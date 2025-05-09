//const http = require('http');
//const lt = require('./latex-trs');
//const name = "result";
//
////http.createServer(function (req, res) {
////  res.writeHead(200, {'Content-Type': 'text/html'});
////  res.end('Hello World!');
////}).listen(8080); 
//
//
//async function main() {
//    lt.sHello();
//    await lt.save(name);
//    await lt.compile(name);
//    await lt.clean(name);
//
//}
//main()

// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const NOTES_DIR = path.join(__dirname, 'markdown');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure notes directory exists
if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR);
// Parse JSON bodies
app.use(express.json());
// Serve frontend static files
app.use(express.static(PUBLIC_DIR));

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

// Fallback to index.html for SPA routing
// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

