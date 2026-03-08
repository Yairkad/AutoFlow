// =============================================
//  shared.js  –  ניהול פנצריה
//  פונקציות משותפות לכל הדפים
// =============================================

const APP_VERSION = 'v25';

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
// ===== DATE NORMALIZE =====
// Converts "3/3/24", "3.3.2024", "3-3-24" → "03/03/2024"
function normDate(s) {
  if (!s || !s.trim()) return '';
  const parts = s.trim().split(/[\/\.\-]/);
  if (parts.length !== 3) return s;
  let [d, m, y] = parts.map(p => p.trim());
  if (!d || !m || !y) return s;
  if (y.length === 2) y = '20' + y;
  d = d.padStart(2, '0');
  m = m.padStart(2, '0');
  return `${d}/${m}/${y}`;
}
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
  applyLogoBg();
}

// ===== LOGO BACKGROUND WATERMARK =====
function applyLogoBg() {
  const s = getSettings();
  let el = document.getElementById('__logoBg');
  if (!s.logoBase64) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('div');
    el.id = '__logoBg';
    document.body.appendChild(el);
  }
  Object.assign(el.style, {
    position:           'fixed',
    top:                '0',
    left:               '0',
    width:              '100%',
    height:             '100%',
    pointerEvents:      'none',
    zIndex:             '-1',
    backgroundImage:    `url(${s.logoBase64})`,
    backgroundRepeat:   'no-repeat',
    backgroundPosition: 'center center',
    backgroundSize:     '75%',
    opacity:            '0.08',
    mixBlendMode:       'multiply'
  });
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
    quotesCars:   getDB('pnc_quotes_cars'),
    reminders:    getDB('pnc_reminders'),
    income:       getDB('pnc_income'),
    recurringInc: getDB('pnc_recurring_income'),
    recurring:    getDB('pnc_recurring'),
    tenants:      getDB('pnc_tenants'),
    payments:     getDB('pnc_payments'),
    carsInv:      getDB('pnc_cars_inventory'),
    carsBuys:     getDB('pnc_cars_buys'),
    carsSells:    getDB('pnc_cars_sells'),
    employees:    getDB('pnc_employees'),
    salaries:     getDB('pnc_salaries'),
    customerDebts: getDB('pnc_customer_debts'),
    supplierDebts: getDB('pnc_supplier_debts'),
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
      if (data.quotesCars)  setDB('pnc_quotes_cars',    data.quotesCars);
      if (data.reminders)   setDB('pnc_reminders',      data.reminders);
      if (data.carsInv)     setDB('pnc_cars_inventory',  data.carsInv);
      if (data.carsBuys)    setDB('pnc_cars_buys',       data.carsBuys);
      if (data.carsSells)   setDB('pnc_cars_sells',      data.carsSells);
      if (data.employees)     setDB('pnc_employees',        data.employees);
      if (data.salaries)      setDB('pnc_salaries',         data.salaries);
      if (data.customerDebts) setDB('pnc_customer_debts',  data.customerDebts);
      if (data.supplierDebts) setDB('pnc_supplier_debts',   data.supplierDebts);
      if (data.suppliers)     setDB('pnc_suppliers',        data.suppliers);
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

// =============================================
//  GOOGLE SHEETS SYNC
//  מבוסס על Google Apps Script Web App.
//  הדרכה: הגדרות → סנכרון ענן
// =============================================

function getSyncUrl() {
  return (getSettings().gasUrl || '').trim();
}

async function syncPushAll() {
  const url = getSyncUrl();
  if (!url) { showToast('לא הוגדר לינק סנכרון – פתח הגדרות', 'error'); return false; }
  const payload = {
    type: '__all__',
    data: {
      expenses:    getDB('pnc_expenses'),
      products:    getDB('pnc_products'),
      tires:       getDB('pnc_tires'),
      quotesTires: getDB('pnc_quotes_tires'),
      quotesParts: getDB('pnc_quotes_parts'),
      quotesCars:  getDB('pnc_quotes_cars'),
      reminders:   getDB('pnc_reminders'),
      carsInv:     getDB('pnc_cars_inventory'),
      carsBuys:    getDB('pnc_cars_buys'),
      carsSells:   getDB('pnc_cars_sells'),
      employees:    getDB('pnc_employees'),
      salaries:     getDB('pnc_salaries'),
      customerDebts: getDB('pnc_customer_debts'),
      supplierDebts: getDB('pnc_supplier_debts'),
      suppliers:    getDB('pnc_suppliers'),
      checks:      (() => { try { return JSON.parse(localStorage.getItem('mualem_db_v3')) || []; } catch { return []; } })()
    }
  };
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    showToast('הנתונים עודכנו בענן ✓', 'success');
    return true;
  } catch (e) {
    showToast('שגיאה בסנכרון לענן', 'error');
    return false;
  }
}

async function syncPullAll() {
  const url = getSyncUrl();
  if (!url) { showToast('לא הוגדר לינק סנכרון – פתח הגדרות', 'error'); return false; }
  try {
    const res = await fetch(url + '?action=getAll', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const remote = await res.json();
    if (remote.expenses)    setDB('pnc_expenses',     remote.expenses);
    if (remote.products)    setDB('pnc_products',     remote.products);
    if (remote.tires)       setDB('pnc_tires',        remote.tires);
    if (remote.quotesTires) setDB('pnc_quotes_tires', remote.quotesTires);
    if (remote.quotesParts) setDB('pnc_quotes_parts', remote.quotesParts);
    if (remote.quotesCars)  setDB('pnc_quotes_cars',  remote.quotesCars);
    if (remote.reminders)   setDB('pnc_reminders',       remote.reminders);
    if (remote.carsInv)     setDB('pnc_cars_inventory',  remote.carsInv);
    if (remote.carsBuys)    setDB('pnc_cars_buys',       remote.carsBuys);
    if (remote.carsSells)   setDB('pnc_cars_sells',      remote.carsSells);
    if (remote.employees)     setDB('pnc_employees',        remote.employees);
    if (remote.salaries)      setDB('pnc_salaries',         remote.salaries);
    if (remote.customerDebts) setDB('pnc_customer_debts',  remote.customerDebts);
    if (remote.supplierDebts) setDB('pnc_supplier_debts',   remote.supplierDebts);
    if (remote.suppliers)     setDB('pnc_suppliers',        remote.suppliers);
    if (remote.checks)      setDB('mualem_db_v3',     remote.checks);
    showToast('נתונים עודכנו מהענן ✓', 'success');
    return true;
  } catch (e) {
    showToast('שגיאה במשיכת נתונים: ' + e.message, 'error');
    return false;
  }
}

function autoSync() {
  if (!getSyncUrl()) return;
  setTimeout(() => syncPushAll().catch(() => {}), 800);
}

// ===== VERSION CHIP + NAV SEARCH INJECT =====
document.addEventListener('DOMContentLoaded', () => {
  // Version chip
  const chip = document.createElement('div');
  chip.id = '__versionChip';
  chip.textContent = APP_VERSION;
  Object.assign(chip.style, {
    position: 'fixed', bottom: '6px', left: '8px',
    fontSize: '10px', color: '#94a3b8',
    fontFamily: 'Heebo, sans-serif', pointerEvents: 'none',
    zIndex: '9998', letterSpacing: '0.3px'
  });
  document.body.appendChild(chip);

  // Wrap nav in nav-outer and inject search button
  const nav = document.querySelector('nav.main-nav');
  if (nav && !nav.closest('.nav-outer')) {
    const outer = document.createElement('div');
    outer.className = 'nav-outer';
    nav.parentNode.insertBefore(outer, nav);
    outer.appendChild(nav);
    const btn = document.createElement('button');
    btn.className = 'nav-search-btn';
    btn.title = 'חיפוש גלובלי';
    btn.textContent = '🔍';
    btn.onclick = openSearchModal;
    outer.appendChild(btn);
  }

  // Inject search modal if not already present
  if (!document.getElementById('__globalSearchModal')) {
    const modal = document.createElement('div');
    modal.id = '__globalSearchModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width:620px">
        <div class="modal-header">
          <h3>🔍 חיפוש גלובלי</h3>
          <button class="modal-close" onclick="closeSearchModal()">✕</button>
        </div>
        <div class="search-modal-input">
          <input type="text" id="__globalSearchInput"
            placeholder="חפש לפי שם, לוחית רכב, טלפון..."
            onkeyup="if(event.key==='Enter') doGlobalSearch()">
          <button class="btn btn-primary" onclick="doGlobalSearch()">חפש</button>
        </div>
        <div class="modal-body" style="max-height:60vh;overflow-y:auto;padding:16px 20px">
          <div id="__globalSearchResults">
            <div class="search-empty" style="padding:24px 20px">הקלד מילת חיפוש ולחץ Enter</div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
});

// ===== GLOBAL SEARCH =====
function openSearchModal() {
  document.getElementById('__globalSearchResults').innerHTML =
    '<div class="search-empty" style="padding:24px 20px">הקלד מילת חיפוש ולחץ Enter</div>';
  document.getElementById('__globalSearchInput').value = '';
  document.getElementById('__globalSearchModal').classList.add('open');
  setTimeout(() => document.getElementById('__globalSearchInput').focus(), 100);
}
function closeSearchModal() {
  document.getElementById('__globalSearchModal').classList.remove('open');
}
function doGlobalSearch() {
  const term = (document.getElementById('__globalSearchInput').value || '').trim();
  if (!term) return;
  const results = globalSearch(term);
  _renderSearchResults(results, term);
}
function globalSearch(term) {
  const t = term.toLowerCase();
  const results = [];
  function match(obj, fields) {
    return fields.some(f => (String(obj[f] || '')).toLowerCase().includes(t));
  }
  getDB('pnc_cars_inventory').forEach(c => {
    if (match(c, ['plate','make','model','color','year','notes']))
      results.push({ module: '🚗 רכבים – מלאי', url: 'רכבים.html',
        title: [c.make,c.model,c.year].filter(Boolean).join(' ') || c.plate || '—',
        detail: [c.plate,c.color,c.status==='available'?'זמין':'נמכר'].filter(Boolean).join(' · ') });
  });
  getDB('pnc_cars_buys').forEach(c => {
    if (match(c, ['plate','make','model','sellerName','sellerPhone','notes']))
      results.push({ module: '🚗 רכבים – קניות', url: 'רכבים.html',
        title: [c.make,c.model,c.year].filter(Boolean).join(' ') || c.plate || '—',
        detail: [c.plate,c.sellerName,c.buyDate].filter(Boolean).join(' · ') });
  });
  getDB('pnc_cars_sells').forEach(c => {
    if (match(c, ['plate','make','model','buyerName','buyerPhone','notes']))
      results.push({ module: '🚗 רכבים – מכירות', url: 'רכבים.html',
        title: [c.make,c.model,c.year].filter(Boolean).join(' ') || c.plate || '—',
        detail: [c.plate,c.buyerName,c.sellDate].filter(Boolean).join(' · ') });
  });
  getDB('pnc_customer_debts').forEach(d => {
    if (match(d, ['customerName','plate','description','phone'])) {
      const paid = (d.payments||[]).reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
      results.push({ module: '💳 חובות לקוחות', url: 'חובות.html',
        title: d.customerName || '—',
        detail: [d.plate,`יתרה: ₪${Math.max(0,(parseFloat(d.amount)||0)-paid).toLocaleString('he-IL',{maximumFractionDigits:0})}`,d.date].filter(Boolean).join(' · ') });
    }
  });
  getDB('pnc_supplier_debts').forEach(d => {
    if (match(d, ['supplierName','description','invoiceNum']))
      results.push({ module: '🏭 חובות ספקים', url: 'חובות.html',
        title: d.supplierName || '—',
        detail: [`₪${(parseFloat(d.amount)||0).toLocaleString('he-IL',{maximumFractionDigits:0})}`,d.paid?'שולם ✓':'פתוח',d.dueDate].filter(Boolean).join(' · ') });
  });
  getDB('pnc_employees').forEach(e => {
    if (match(e, ['name','phone','role','id_num','notes']))
      results.push({ module: '👷 עובדים', url: 'עובדים.html',
        title: e.name || '—',
        detail: [e.role,e.phone,e.active?'פעיל':'לא פעיל'].filter(Boolean).join(' · ') });
  });
  getDB('pnc_products').forEach(p => {
    if (match(p, ['name','sku','category','notes']))
      results.push({ module: '📦 מוצרים', url: 'מוצרים.html',
        title: p.name || '—',
        detail: [p.category,`${p.quantity||0} ${p.unit||'יח\''}`,p.sku].filter(Boolean).join(' · ') });
  });
  getDB('pnc_tires').forEach(ti => {
    if (match(ti, ['brand','size','season','notes']))
      results.push({ module: '🔵 צמיגים', url: 'צמיגים.html',
        title: [ti.brand,ti.size].filter(Boolean).join(' ') || '—',
        detail: [ti.season,`${ti.quantity||0} יח'`,ti.price?`₪${ti.price}`:''].filter(Boolean).join(' · ') });
  });
  getDB('pnc_suppliers').forEach(s => {
    if (match(s, ['name','contact','phone','email','category']))
      results.push({ module: '🏭 ספקים', url: 'ספקים.html',
        title: s.name || '—',
        detail: [s.contact,s.phone,s.category].filter(Boolean).join(' · ') });
  });
  getDB('pnc_expenses').forEach(e => {
    if (match(e, ['description','category','notes','supplier']))
      results.push({ module: '💰 הוצאות', url: 'הוצאות.html',
        title: e.description||e.category||'—',
        detail: [`₪${(parseFloat(e.amount)||0).toLocaleString('he-IL',{maximumFractionDigits:0})}`,e.date,e.category].filter(Boolean).join(' · ') });
  });
  getDB('pnc_reminders').forEach(r => {
    if (match(r, ['text','notes']))
      results.push({ module: '🔔 תזכורות', url: 'תזכורות.html',
        title: r.text || '—',
        detail: [r.due,r.priority==='high'?'⚡ דחוף':'',r.done?'הושלם ✓':'פתוח'].filter(Boolean).join(' · ') });
  });
  try { (JSON.parse(localStorage.getItem('mualem_db_v3'))||[]).forEach(c => {
    if (match(c, ['plate','owner','make','model','notes']))
      results.push({ module: '📝 בדיקות קניה', url: 'בדיקות-קניה.html',
        title: [c.make,c.model,c.year].filter(Boolean).join(' ')||c.plate||'—',
        detail: [c.plate,c.owner,c.date].filter(Boolean).join(' · ') });
  }); } catch {}
  getDB('pnc_tenants').forEach(t => {
    if (match(t, ['name','phone','address','notes']))
      results.push({ module: '🧾 חשבונות', url: 'חשבונות.html',
        title: t.name || '—',
        detail: [t.phone,t.address].filter(Boolean).join(' · ') });
  });
  return results;
}
function _renderSearchResults(results, term) {
  const el = document.getElementById('__globalSearchResults');
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  if (!results.length) { el.innerHTML = `<div class="search-empty">🔍 לא נמצאו תוצאות עבור "<strong>${esc(term)}</strong>"</div>`; return; }
  const groups = {};
  results.forEach(r => { if (!groups[r.module]) groups[r.module]=[]; groups[r.module].push(r); });
  let html = `<div class="search-count">נמצאו ${results.length} תוצאות</div>`;
  for (const [mod, items] of Object.entries(groups)) {
    html += `<div class="search-result-group"><div class="search-group-title">${mod} (${items.length})</div>`;
    items.slice(0,12).forEach(item => {
      html += `<a href="${item.url}" class="search-result-item"><div class="search-result-title">${esc(item.title)}</div><div class="search-result-detail">${esc(item.detail)}</div></a>`;
    });
    if (items.length>12) html += `<div style="font-size:12px;color:var(--text-muted);padding:6px 8px">...ועוד ${items.length-12} תוצאות</div>`;
    html += `</div>`;
  }
  el.innerHTML = html;
}

// ===== SERVICE WORKER (PWA) =====
if ('serviceWorker' in navigator) {
  // When new SW takes control (auto, via skipWaiting in sw.js) → reload page to get fresh cache
  let swRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swRefreshing) return;
    swRefreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// =============================================
//  PIN PROTECTION
//  requirePin(callback) – בדוק PIN לפני פעולה קריטית.
//  אם אין PIN מוגדר – הפעולה עוברת ישירות.
// =============================================

(function injectPinModal() {
  const html = `
  <div id="pinOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:600;align-items:center;justify-content:center">
    <div style="background:white;border-radius:16px;padding:32px 28px;max-width:320px;width:90%;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,0.22);direction:rtl">
      <div style="font-size:42px;margin-bottom:12px">🔐</div>
      <h3 style="font-size:17px;font-weight:800;margin:0 0 8px">נדרש קוד מנהל</h3>
      <p style="font-size:13px;color:#64748b;margin:0 0 18px">הכנס את הקוד לאישור הפעולה</p>
      <input id="pinInput" type="password" inputmode="numeric" maxlength="8"
        style="width:100%;padding:13px;text-align:center;font-size:22px;letter-spacing:8px;border:2px solid #e2e8f0;border-radius:10px;outline:none;font-family:monospace;background:#fafbfc;box-sizing:border-box"
        placeholder="••••">
      <p id="pinError" style="color:#dc2626;font-size:12px;font-weight:600;margin:8px 0 0;min-height:18px"></p>
      <div style="display:flex;gap:10px;margin-top:18px">
        <button id="pinCancelBtn" style="flex:1;padding:11px;border:1.5px solid #e2e8f0;background:white;border-radius:9px;cursor:pointer;font-family:inherit;font-weight:600;font-size:14px">ביטול</button>
        <button id="pinConfirmBtn" style="flex:1;padding:11px;background:#1a9e5c;color:white;border:none;border-radius:9px;cursor:pointer;font-family:inherit;font-weight:700;font-size:14px">אישור ✓</button>
      </div>
    </div>
  </div>`;

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('beforeend', html);

    const overlay  = document.getElementById('pinOverlay');
    const input    = document.getElementById('pinInput');
    const errorEl  = document.getElementById('pinError');
    const confirmBtn = document.getElementById('pinConfirmBtn');
    const cancelBtn  = document.getElementById('pinCancelBtn');

    function closePin() {
      overlay.style.display = 'none';
      window._pinCb = null;
    }

    function tryConfirm() {
      const s = getSettings();
      if (input.value === String(s.adminPin || '')) {
        const cb = window._pinCb;
        closePin();
        if (cb) cb();
      } else {
        errorEl.textContent = 'קוד שגוי – נסה שוב';
        input.style.borderColor = '#dc2626';
        input.value = '';
        input.focus();
        setTimeout(() => { errorEl.textContent = ''; input.style.borderColor = '#e2e8f0'; }, 2000);
      }
    }

    confirmBtn.addEventListener('click', tryConfirm);
    cancelBtn.addEventListener('click', closePin);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') tryConfirm(); });

    // Close on backdrop click
    overlay.addEventListener('click', e => { if (e.target === overlay) closePin(); });
  });
})();

function requirePin(cb) {
  const pin = (getSettings().adminPin || '').trim();
  if (!pin) { cb(); return; }  // No PIN set → pass through

  const overlay = document.getElementById('pinOverlay');
  if (!overlay) { cb(); return; }  // Modal not loaded yet (shouldn't happen)

  overlay.style.display = 'flex';
  const input = document.getElementById('pinInput');
  document.getElementById('pinError').textContent = '';
  input.style.borderColor = '#e2e8f0';
  input.value = '';
  setTimeout(() => input.focus(), 80);
  window._pinCb = cb;
}

// =============================================
//  FILE UPLOAD TO GOOGLE DRIVE (via GAS)
//  תמיכה בתור offline + חיווי התקדמות
// =============================================

function getUploadQueue() {
  try { return JSON.parse(localStorage.getItem('pnc_upload_queue')) || []; } catch { return []; }
}
function saveUploadQueue(q) {
  try { localStorage.setItem('pnc_upload_queue', JSON.stringify(q)); } catch(e) { console.error(e); }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsDataURL(file);
  });
}

function uploadFileViaXhr(url, payload, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    if (onProgress) {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
      };
    }
    xhr.onload = () => { if (onProgress) onProgress(100); resolve(); };
    xhr.onerror = () => reject(new Error('שגיאת רשת'));
    xhr.ontimeout = () => reject(new Error('פסק זמן'));
    xhr.timeout = 60000;
    xhr.send(JSON.stringify(payload));
  });
}

// Upload multiple files — handles online/offline automatically
// callbacks: { onFileStart(i,name), onProgress(i,pct), onFileDone(i,mode), onFileError(i,err), onAllDone(uploaded,failed,queued) }
async function uploadFilesToDrive(files, folderId, folderName, callbacks) {
  const url = getSyncUrl();
  const cb = callbacks || {};
  let uploaded = 0, failed = 0, queued = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (cb.onFileStart) cb.onFileStart(i, file.name);

    let base64;
    try {
      base64 = await fileToBase64(file);
    } catch (err) {
      failed++;
      if (cb.onFileError) cb.onFileError(i, 'שגיאה בקריאת הקובץ');
      continue;
    }

    const payload = {
      type: '__file__',
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      data: base64,
      folderId: folderId || ''
    };

    if (!navigator.onLine || !url) {
      const q = getUploadQueue();
      q.push({
        id: nowId() + '_' + i,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: base64,
        folderId: folderId || '',
        folderName: folderName || '',
        status: 'pending',
        timestamp: todayStr()
      });
      saveUploadQueue(q);
      queued++;
      if (cb.onFileDone) cb.onFileDone(i, 'queued');
    } else {
      try {
        await uploadFileViaXhr(url, payload, pct => { if (cb.onProgress) cb.onProgress(i, pct); });
        uploaded++;
        if (cb.onFileDone) cb.onFileDone(i, 'uploaded');
      } catch (err) {
        // Save to queue as fallback on error
        const q = getUploadQueue();
        q.push({
          id: nowId() + '_' + i,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          data: base64,
          folderId: folderId || '',
          folderName: folderName || '',
          status: 'error',
          timestamp: todayStr()
        });
        saveUploadQueue(q);
        failed++;
        if (cb.onFileError) cb.onFileError(i, err.message);
      }
    }
  }

  if (cb.onAllDone) cb.onAllDone(uploaded, failed, queued);
}

// Process pending queue items (called on coming online or manually)
async function processUploadQueue(onItemProgress) {
  const url = getSyncUrl();
  if (!url || !navigator.onLine) return { uploaded: 0, failed: 0 };
  const queue = getUploadQueue();
  const pending = queue.filter(f => f.status === 'pending' || f.status === 'error');
  let uploaded = 0, failed = 0;

  for (const item of pending) {
    item.status = 'uploading';
    saveUploadQueue(queue);
    if (onItemProgress) onItemProgress(item.fileName);
    try {
      await uploadFileViaXhr(url, {
        type: '__file__',
        fileName: item.fileName,
        mimeType: item.mimeType,
        data: item.data,
        folderId: item.folderId
      }, null);
      item.status = 'done';
      uploaded++;
    } catch {
      item.status = 'error';
      failed++;
    }
    saveUploadQueue(queue);
  }
  return { uploaded, failed };
}

// Auto-process queue when internet returns
window.addEventListener('online', async () => {
  const q = getUploadQueue();
  if (q.some(f => f.status === 'pending' || f.status === 'error')) {
    showToast('מתחבר – מעלה קבצים בתור...', '');
    const { uploaded, failed } = await processUploadQueue().catch(() => ({ uploaded: 0, failed: 0 }));
    if (uploaded > 0) showToast(`${uploaded} קבצים הועלו בהצלחה ✓`, 'success');
    if (failed > 0) showToast(`${failed} קבצים נכשלו בהעלאה`, 'error');
  }
});
