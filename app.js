const STORAGE_KEY = 'bookmarks_v1';

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

function getFavicon(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
  } catch {
    return null;
  }
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 2500);
}

function renderBookmarks(filter = '') {
  const list = document.getElementById('bookmarks-list');
  const badge = document.getElementById('count-badge');
  const bookmarks = loadBookmarks();

  const filtered = filter
    ? bookmarks.filter(b =>
        b.name.toLowerCase().includes(filter) ||
        b.desc.toLowerCase().includes(filter) ||
        b.url.toLowerCase().includes(filter)
      )
    : bookmarks;

  badge.textContent = bookmarks.length;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span>${filter ? '🔍' : '📭'}</span>
        ${filter ? 'לא נמצאו תוצאות לחיפוש' : 'עדיין אין סימניות. הוסף את הראשונה!'}
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(b => {
    const faviconUrl = getFavicon(b.url);
    const faviconHtml = faviconUrl
      ? `<img src="${faviconUrl}" alt="" onerror="this.parentElement.textContent='🌐'" />`
      : '🌐';

    const safeUrl = encodeURI(b.url);
    const displayUrl = b.url.replace(/^https?:\/\//, '').replace(/\/$/, '');

    return `
      <div class="bookmark-item" data-id="${b.id}">
        <div class="bookmark-favicon">${faviconHtml}</div>
        <div class="bookmark-info">
          <div class="bookmark-name" title="${escapeHtml(b.name)}">${escapeHtml(b.name)}</div>
          ${b.desc ? `<div class="bookmark-desc">${escapeHtml(b.desc)}</div>` : ''}
          <a class="bookmark-url" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(displayUrl)}</a>
        </div>
        <button class="btn-delete" data-id="${b.id}" title="מחק סימנייה">✕</button>
      </div>`;
  }).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function addBookmark() {
  const name = document.getElementById('input-name').value.trim();
  const url = document.getElementById('input-url').value.trim();
  const desc = document.getElementById('input-desc').value.trim();

  if (!name) { showToast('נא להזין שם לסימנייה', true); return; }
  if (!url) { showToast('נא להזין כתובת URL', true); return; }

  let normalizedUrl = url;
  if (!/^https?:\/\//i.test(url)) normalizedUrl = 'https://' + url;

  try { new URL(normalizedUrl); } catch {
    showToast('כתובת URL לא תקינה', true);
    return;
  }

  const bookmarks = loadBookmarks();
  bookmarks.unshift({ id: Date.now().toString(), name, url: normalizedUrl, desc });
  saveBookmarks(bookmarks);

  document.getElementById('input-name').value = '';
  document.getElementById('input-url').value = '';
  document.getElementById('input-desc').value = '';
  document.getElementById('search-box').value = '';

  renderBookmarks();
  showToast('הסימנייה נוספה בהצלחה ✓');
}

function deleteBookmark(id) {
  const bookmarks = loadBookmarks().filter(b => b.id !== id);
  saveBookmarks(bookmarks);
  const filter = document.getElementById('search-box').value.trim().toLowerCase();
  renderBookmarks(filter);
  showToast('הסימנייה נמחקה');
}

document.getElementById('btn-add').addEventListener('click', addBookmark);

document.getElementById('input-url').addEventListener('keydown', e => {
  if (e.key === 'Enter') addBookmark();
});

document.getElementById('bookmarks-list').addEventListener('click', e => {
  const btn = e.target.closest('.btn-delete');
  if (btn) deleteBookmark(btn.dataset.id);
});

document.getElementById('search-box').addEventListener('input', e => {
  renderBookmarks(e.target.value.trim().toLowerCase());
});

renderBookmarks();
