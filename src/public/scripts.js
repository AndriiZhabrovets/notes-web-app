const mdInput  = document.getElementById('md-input');
const preview  = document.getElementById('preview');
const noteList = document.getElementById('note-list');
const exportBtn= document.getElementById('export');

// 1) Live‐preview using marked.js
mdInput.addEventListener('input', () => {
  preview.innerHTML = marked.parse(mdInput.value);
});

// 2) Load list of notes
async function loadNotes() {
  const res = await fetch('/api/notes');
  const notes = await res.json();
  noteList.innerHTML = notes.map(n => `<option value="${n.id}">${n.title}</option>`).join('');
}
noteList.addEventListener('change', async () => {
  const res = await fetch(`/api/notes/${noteList.value}`);
  const { content } = await res.json();
  mdInput.value = content;
  preview.innerHTML = marked.parse(content);
});

// 3) New note
document.getElementById('new-note').addEventListener('click', async () => {
  const res = await fetch('/api/notes', { method:'POST' });
  await loadNotes();
});

// 4) Export to LaTeX
exportBtn.addEventListener('click', () => {
  window.location = `/api/notes/${noteList.value}/export`;
});

// Initial load
loadNotes();
