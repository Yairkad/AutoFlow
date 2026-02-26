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

// ===== SERVICE WORKER (PWA) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            // New version ready – show update bar
            const bar = document.createElement('div');
            bar.innerHTML = `<span>🔄 גרסה חדשה זמינה</span><button onclick="location.reload()" style="margin-right:12px;padding:5px 14px;background:white;color:#1a9e5c;border:none;border-radius:6px;font-weight:700;cursor:pointer;font-family:inherit">רענן עכשיו</button>`;
            Object.assign(bar.style, {
              position:'fixed', top:'0', left:'0', right:'0', zIndex:'9999',
              background:'#1a9e5c', color:'white', padding:'10px 20px',
              display:'flex', alignItems:'center', justifyContent:'center',
              gap:'12px', fontSize:'14px', fontWeight:'600', fontFamily:'Heebo,sans-serif'
            });
            document.body.prepend(bar);
          }
        });
      });
    }).catch(() => {});
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
