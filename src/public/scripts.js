const apiBase = '';
let currentNoteName = null;
const toggleBtn = document.getElementById('toggleBtn');
const bodyEl = document.body;
const editor = document.getElementById('editor');
const previewPane = document.getElementById('previewPane');
const sidebar = document.getElementById('sidebar-nav');
const newBtn = document.getElementById('new');
const saveBtn = document.getElementById('save');
const saveAsBtn = document.getElementById('save-as');
const exportBtn = document.getElementById('export');
const search = document.getElementById('search');
// Toggle sidebar
toggleBtn.addEventListener('click', () => {
    const root = document.documentElement;
    const current = getComputedStyle(root).getPropertyValue('--sidebar-width').trim();
    const open = current !== '0px';
    bodyEl.classList.toggle('sidebar-open', !open);
    root.style.setProperty('--sidebar-width', open ? '0px' : '250px');
    toggleBtn.innerHTML = open ? '>' : '<';
});


editor.addEventListener('input', () => {
    let md = editor.value;

    md = md.replace(/^(?:-|\*)\s+(.*)$/gm, '<ul><li>$1</li></ul>');
           // Ordered list items
    md = md.replace(/^\d+\.\s+(.*)$/gm, '<ol><li>$1</li></ol>');


    md = md.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    md = md.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    md = md.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    md = md.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    md = md.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    md = md.replace(/\((.*?)\)/gim, '($1)');
    md = md.replace(/\n/g, '<br>');
    md = md.replace(/\\newpage/g, '');
    previewPane.innerHTML = md;
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([previewPane]);
    }

});
// Live markdown preview
search.addEventListener('input', async() => {
    let note = search.value;
    const res = await fetch(apiBase + '/notes/' + encodeURIComponent(note) + "?mode=search");
    const notes = await res.json();
    sidebar.innerHTML = '';
    notes.forEach(name => {
        const a = document.createElement('a');
        a.href = '#'; a.textContent = name;
        // delete button
        const del = document.createElement('span');
        del.className = 'delete-btn';
        del.textContent = '×';
        del.addEventListener('click', async e => {
            e.stopPropagation();
            await fetch(apiBase + '/notes/' + encodeURIComponent(name), { method: 'DELETE' });
            fetchNotes();
        });
        a.appendChild(del);
        a.addEventListener('click', async e => { e.preventDefault(); await loadNote(name); });
        sidebar.appendChild(a);
    });

});

// Fetch and render notes + delete UI
async function fetchNotes() {
    const res = await fetch(apiBase + '/notes');
    const notes = await res.json();
    sidebar.innerHTML = '';
    notes.forEach(name => {
        const a = document.createElement('a');
        a.href = '#'; a.textContent = name;
        // delete button
        const del = document.createElement('span');
        del.className = 'delete-btn';
        del.textContent = '×';
        del.addEventListener('click', async e => {
            e.stopPropagation();
            await fetch(apiBase + '/notes/' + encodeURIComponent(name), { method: 'DELETE' });
            fetchNotes();
        });
        a.appendChild(del);
        a.addEventListener('click', async e => { e.preventDefault(); await loadNote(name); });
        sidebar.appendChild(a);
    });
}

// Load a note
async function loadNote(name) {
    const res = await fetch(apiBase + '/notes/' + encodeURIComponent(name) + "?mode=load");
    if (res.ok) {
        const { content } = await res.json();
        currentNoteName = name;
        editor.value = content;
        editor.dispatchEvent(new Event('input'));
    }
}
// New note
newBtn.addEventListener('click', async () => {
    editor.value = ''; previewPane.innerHTML = '';
    const name = prompt('Enter new note name:'); if (!name) return;
    const res = await fetch(apiBase + '/notes', {
        method: 'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, content: editor.value })
    });
    if (res.ok) { currentNoteName = name; fetchNotes(); } else alert('Error creating note');
});

// Save note
saveBtn.addEventListener('click', async () => {
    if (!currentNoteName) return alert('No note selected');
    await fetch(apiBase + '/notes', {
        method: 'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name: currentNoteName, content: editor.value })
    });
});

saveAsBtn.addEventListener('click', async () => {
    const name = prompt('Enter name for the note:'); if (!name) return;
    const res = await fetch(apiBase + '/notes', {
        method: 'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, content: editor.value })
    });
    if (res.ok) { currentNoteName = name; fetchNotes(); } else alert('Error saving note');
});

// Export handler
exportBtn.addEventListener('click', async () => {
    if (!currentNoteName) {
        alert('Please select or create a note before exporting.');
        return;
    }
    const res = await fetch(apiBase + '/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: currentNoteName, content: editor.value })
    });
    if (!res.ok) {
        alert('Export failed');
        return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentNoteName + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Init: clear any stale content on reload
currentNoteName = null;
editor.value = '';
previewPane.innerHTML = '';

// Fetch saved notes into sidebar
fetchNotes();
