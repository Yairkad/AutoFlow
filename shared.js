// =============================================
//  shared.js  –  ניהול פנצריה
//  פונקציות משותפות לכל הדפים
// =============================================

// ===== DB =====
function getDB(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function setDB(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) { console.error(e); }
}
function getSettings() {
  try { return JSON.parse(localStorage.getItem('pnc_settings')) || {}; } catch { return {}; }
}
function saveSettings(obj) {
  localStorage.setItem('pnc_settings', JSON.stringify(obj));
}

// ===== TOAST =====
let _toastTimer;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== FORMATTERS =====
function formatCurrency(n) {
  const v = parseFloat(n);
  if (isNaN(v)) return '—';
  return '₪' + v.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function todayStr() {
  const d = new Date();
  return [String(d.getDate()).padStart(2,'0'), String(d.getMonth()+1).padStart(2,'0'), d.getFullYear()].join('/');
}
function nowId() { return Date.now(); }
function monthLabel(dateStr) {
  // dateStr = DD/MM/YYYY
  const p = dateStr ? dateStr.split('/') : [];
  if (p.length < 3) return '';
  const months = ['','ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  return (months[parseInt(p[1])] || p[1]) + ' ' + p[2];
}

// ===== NAV =====
function highlightNav() {
  const page = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    a.classList.toggle('active', href === page);
  });
}

// ===== HEADER =====
function loadHeaderBranding() {
  const s = getSettings();
  const logo = document.querySelector('.header-logo');
  const h1   = document.querySelector('.header-title h1');
  const sub  = document.querySelector('.header-title p');
  if (s.businessName && h1) h1.textContent = s.businessName;
  if (s.businessSub  && sub) sub.textContent = s.businessSub;
  if (s.logoBase64 && logo) { logo.src = s.logoBase64; logo.style.display = ''; }
  else if (logo) logo.style.display = 'none';
}

// ===== CONFIRM DIALOG =====
let _confirmCb = null;
function showConfirm(msg, cb) {
  const overlay = document.getElementById('confirmOverlay');
  if (!overlay) { if (confirm(msg)) cb(); return; }
  document.getElementById('confirmMsg').textContent = msg;
  overlay.classList.add('open');
  _confirmCb = cb;
}
function confirmYes() {
  document.getElementById('confirmOverlay').classList.remove('open');
  if (_confirmCb) { _confirmCb(); _confirmCb = null; }
}
function confirmNo() {
  document.getElementById('confirmOverlay').classList.remove('open');
  _confirmCb = null;
}

// ===== MARK FILLED =====
function markFilled(el) { el.classList.toggle('filled', el.value.trim() !== ''); }

// ===== EXCEL EXPORT =====
function exportToExcel(rows, filename, sheetName) {
  if (typeof XLSX === 'undefined') { showToast('טוען ספריית Excel...'); return; }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = rows[0] ? rows[0].map(() => ({ wch: 20 })) : [];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'נתונים');
  XLSX.writeFile(wb, filename + '.xlsx');
  showToast('קובץ Excel יוצא בהצלחה ✓', 'success');
}

// ===== EXCEL IMPORT =====
function importFromExcel(file, callback) {
  if (typeof XLSX === 'undefined') { showToast('שגיאה בטעינת ספריית Excel', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      callback(rows);
    } catch { showToast('שגיאה בקריאת הקובץ', 'error'); }
  };
  reader.readAsBinaryString(file);
}

// ===== BACKUP / RESTORE =====
function backupAll() {
  const data = {
    version: 3,
    date: todayStr(),
    expenses:     getDB('pnc_expenses'),
    products:     getDB('pnc_products'),
    tires:        getDB('pnc_tires'),
    quotesTires:  getDB('pnc_quotes_tires'),
    quotesParts:  getDB('pnc_quotes_parts'),
    suppliers:    getDB('pnc_suppliers'),
    checks:       getDB('mualem_db_v3') || JSON.parse(localStorage.getItem('mualem_db_v3') || '[]'),
    settings:     getSettings()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'גיבוי-פנצריה-' + todayStr().replace(/\//g,'-') + '.json';
  a.click();
  showToast('גיבוי נשמר בהצלחה ✓', 'success');
}

function restoreAll(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.expenses)    setDB('pnc_expenses',       data.expenses);
      if (data.products)    setDB('pnc_products',       data.products);
      if (data.tires)       setDB('pnc_tires',           data.tires);
      if (data.quotesTires) setDB('pnc_quotes_tires',   data.quotesTires);
      if (data.quotesParts) setDB('pnc_quotes_parts',   data.quotesParts);
      if (data.suppliers)   setDB('pnc_suppliers',       data.suppliers);
      if (data.checks)      setDB('mualem_db_v3',        data.checks);
      if (data.settings)    saveSettings(data.settings);
      showToast('הנתונים שוחזרו בהצלחה ✓', 'success');
      setTimeout(() => location.reload(), 1200);
    } catch { showToast('קובץ גיבוי לא תקין', 'error'); }
  };
  reader.readAsText(file);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  highlightNav();
  loadHeaderBranding();
});
