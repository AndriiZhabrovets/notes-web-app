const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const NOTES_DIR = path.join(__dirname, 'notes');
const EXPORT_DIR = path.join(__dirname, 'export');
const PUBLIC_DIR = path.join(__dirname, 'public');
const TEX_DIR = path.join(__dirname, 'latex');

// Ensure notes directory exists
if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR);
// Parse JSON bodies
app.use(express.json());
// Serve frontend static files
app.use(express.static(PUBLIC_DIR));

async function downloadImage(url, destPath) {
    let finalUrl = url;
    const res = await fetch(finalUrl);
    if (!re/s.ok) throw new Error(`Failed to download ${finalUrl}: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
}

function mdToLatex(md) {
    return md

   .replace(/(^|\n)((?:[-*] .*(?:\n|$))+)/g, (_, prefix, listBlock) => {
        const items = listBlock.trim().split(/\n+/).map(line => {
            const content = line.replace(/^[-*]\s+/, '');
            return `\\item ${content}`;
        }).join('\n');
        return `${prefix}\\begin{itemize}

        ${items}
        \\end{itemize}\n`;
    })

    // Convert ordered list blocks
        .replace(/(^|\n)((?:\d+\. .*(?:\n|$))+)/g, (_, prefix, listBlock) => {
         const items = listBlock.trim().split(/\n+/).map(line => {
            const content = line.replace(/^\d+\.\s+/, '');
            return `\\item ${content}`;
        }).join('\n');
        return `${prefix}\\begin{enumerate}

        ${items}
        \\end{enumerate}\n`;
    })



        .replace(/\r\n/g, "\n")
        .replace(/^### (.*$)/gim, '\\subsubsection{$1}')
        .replace(/^## (.*$)/gim, '\\subsection{$1}')
        .replace(/^# (.*$)/gim, '\\section{$1}')
        .replace(/\*\*(.*?)\*\*/gim, '\\textbf{$1}')
        .replace(/\*(.*?)\*/gim, '\\textit{$1}')
       // .replace(/!\[\]\((.*?)\)/gim, '\\includegraphics[width=\\linewidth]{$1}')
        .split(/\n{2,}/)                     // split on blank-line runs
        .map(para => para
                  .trim()
                  .replace(/\n+/g, ' ')             // collapse any remaining single newlines into spaces
                )
        .join('\n\n\\par\n\n');   


       

        
}


// API: list all note filenames (without .md)
app.get('/notes', (req, res) => {
    fs.readdir(NOTES_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Unable to list notes' });
        const notes = files
            .filter(f => f.endsWith('.md'))
            .map(f => path.basename(f, '.md'));
        res.json(notes);
    });
});

// API: get a single note's content
app.get('/notes/:name', (req, res) => {
    const name = req.params.name.replace(/[^a-z0-9_\-]/gi, '_');
    const filePath = path.join(NOTES_DIR, name + '.md');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(404).json({ error: 'Note not found' });
        res.json({ name, content: data });
    });
});

// API: create or overwrite a note
app.post('/notes', (req, res) => {
    const { name, content } = req.body;
    if (!name || content === undefined) {
        return res.status(400).json({ error: 'Name and content are required' });
    }
    const safeName = name.replace(/[^a-z0-9_\-]/gi, '_');
    const filePath = path.join(NOTES_DIR, safeName + '.md');
    fs.writeFile(filePath, content, err => {
        if (err) return res.status(500).json({ error: 'Failed to save note' });
        res.json({ success: true, name: safeName });
    });
});

// API: delete a note
app.delete('/notes/:name', (req, res) => {
    const name = req.params.name.replace(/[^a-z0-9_\-]/gi, '_');
    const filePath = path.join(NOTES_DIR, name + '.md');
    fs.unlink(filePath, err => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ error: 'Note not found' });
            }
            return res.status(500).json({ error: 'Failed to delete note' });
        }
        res.json({ success: true, name });
    });
});


app.post('/export', async (req, res) => {
    const { name, content: originalContent } = req.body;
    if (!name || originalContent === undefined) {
        return res.status(400).json({ error: 'Name and content are required' });
    }
    const safeName = name.replace(/[^a-z0-9_\-]/gi, '_');
    const texPath = path.join(TEX_DIR, safeName + '.tex');

        const imagesPath = path.join(TEX_DIR, 'images', safeName);
        if (!fs.existsSync(imagesPath)) fs.mkdirSync(imagesPath, { recursive: true });

    // Download any remote images and rewrite paths
    let content = originalContent;
    const imageRegex = /!\[\]\((.*?)\)/g;
    const downloads = [];
    let match;
    while ((match = imageRegex.exec(originalContent)) !== null) {
        const url = match[1];
        const filename = path.basename(url.split('?')[0]);
        const localRel = path.posix.join('images', safeName, filename);
        const localFull = path.join(TEX_DIR, localRel);
        downloads.push(downloadImage(url, localFull));
        content = content.split(url).join(localRel);
    }

    try {
        await Promise.all(downloads);
    } catch (err) {
        console.error('Image download error:', err);
        return res.status(500).json({ error: 'Failed to download images' });
    }
    const pdfPath = path.join(EXPORT_DIR, safeName + '.pdf');
    const logPath = path.join(EXPORT_DIR, safeName + '.log');
    const auxPath = path.join(EXPORT_DIR, safeName + '.aux');
    const toDeleteList = [auxPath, logPath, texPath];
    const tempEnd = "\n\\end{document}";

    let template = fs.readFileSync(path.join(TEX_DIR,'latex-temp.tex'));

    let latexBody = mdToLatex(content);

    let texFile = template + latexBody + tempEnd;

    fs.writeFile(texPath, texFile, function (err) {
                if (err) throw err;
                console.log("Saved!");
            })

    console.log(texPath);
    exec(`pdflatex  -output-directory=${EXPORT_DIR} ${texPath}`,(err, stdout, stderr) => {
        exec(`pdflatex  -output-directory=${EXPORT_DIR} ${texPath}`,(err, stdout, stderr) => {
        if (err) {
            console.error('pdflatex error:', stderr);
            return res.status(500).json({ error: 'PDF generation failed' });
        }
        // Verify PDF exists before sending
        fs.access(pdfPath, fs.constants.R_OK, accessErr => {
            if (accessErr) {
                console.error('PDF not found:', pdfFile);
                return res.status(500).json({ error: 'PDF not generated' });
            }
            res.type('application/pdf');
            res.sendFile(pdfPath, sendErr => {
                if (sendErr) console.error('Send error:', sendErr);
                // Cleanup auxiliary files
                toDeleteList.forEach(file => {
                    fs.unlink(file, unlinkErr => unlinkErr && console.error('Cleanup err:', unlinkErr));
                });
            });
        });
    });

});

});
// Fallback to index.html for SPA routing
app.use((req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
