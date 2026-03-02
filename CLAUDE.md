# אוטוליין – הקשר לאי

## מה המערכת
מערכת ניהול לפנצריה ומוסך. **HTML + Vanilla JS בלבד**, ללא שרת, ללא framework.
פועלת ישירות בדפדפן. נתונים ב-`localStorage`. פרוסה ב-GitHub Pages.
PWA מלא (Service Worker, manifest, offline, אייקון).

---

## קבצים וארכיטקטורה

### קבצים משותפים
| קובץ | תפקיד |
|------|--------|
| `style.css?v=1.7` | עיצוב גלובלי לכל הדפים |
| `shared.js?v=1.7` | פונקציות משותפות (ראה רשימה מטה) |
| `sw.js` | Service Worker – כרגע **autoline-v14** |
| `manifest.json` | PWA manifest |
| `icon-512.png` | אייקון PWA + favicon (PNG, 512×512) |

### מודולים (14 קבצי HTML)
| קובץ | תיאור | DB Key ראשי |
|------|--------|-------------|
| `index.html` | דשבורד – stats + כרטיסיות + התראות | — |
| `הוצאות.html` | הוצאות והכנסות, קבלות, Excel | `pnc_expenses` |
| `מוצרים.html` | מלאי מוצרים/אביזרים, מחיר קנייה+רווח | `pnc_products` |
| `צמיגים.html` | מלאי צמיגים לפי מידה/עונה, מחירון | `pnc_tires` |
| `רכבים.html` | קנייה/מכירה רכבים, מתעניינים, רווחיות | `pnc_cars_inventory`, `pnc_cars_buys`, `pnc_cars_sells` |
| `הצעות-מחיר.html` | הצעות מחיר לצמיגים וחלקים | `pnc_quotes_tires`, `pnc_quotes_parts` |
| `ספקים.html` | ניהול ספקים, הזמנות, חובות | `pnc_suppliers` |
| `חשבונות.html` | חיובים חודשיים קבועים, תשלום לפי חודש | `pnc_tenants`, `pnc_payments` |
| `תזכורות.html` | תזכורות לפי תאריך יעד ועדיפות | `pnc_reminders` |
| `חובות.html` | חובות לקוחות + חובות לספקים, תשלומים חלקיים | `pnc_customer_debts`, `pnc_supplier_debts` |
| `עובדים.html` | עובדים + שכר חודשי/שעתי, בונוסים, ניכויים | `pnc_employees`, `pnc_salaries` |
| `מסמכים.html` | תבניות טפסים להדפסה (טבלאות A4) | `pnc_forms` |
| `בדיקות-קניה.html` | בדיקת רכב לפני קניה, הדפסת דוח | `mualem_db_v3` |
| `הגדרות.html` | שם עסק, לוגו, PIN, סנכרון ענן, גיבוי | `pnc_settings` |

---

## shared.js – פונקציות

### DB
- `getDB(key)` → מחזיר מערך מ-localStorage ([] אם שגיאה)
- `setDB(key, data)` → שומר ל-localStorage
- `getSettings()` / `saveSettings(obj)` → `pnc_settings`

### פורמט
- `formatCurrency(n)` → `₪1,234.56` (2 ספרות עשרוניות, Hebrew locale)
- `todayStr()` → `DD/MM/YYYY`
- `nowId()` → `Date.now()` לID ייחודי
- `normDate(s)` → ממיר `3/3/24` / `3.3.2024` / `3-3-24` → `03/03/2024`
- `monthLabel(dateStr)` → `DD/MM/YYYY` → שם חודש עברי + שנה

### UI
- `showToast(msg, type?)` → toast תחתון (type: `'success'` / `'error'`)
- `showConfirm(msg, cb)` / `confirmYes()` / `confirmNo()` → dialog אישור
- `markFilled(el)` → מוסיף class `filled` ל-input אם יש ערך
- `highlightNav()` → מסמן nav link פעיל
- `loadHeaderBranding()` → טוען שם עסק + לוגו לכותרת

### Excel
- `exportToExcel(rows, filename, sheetName)` → מייצא `.xlsx` דרך SheetJS CDN
- `importFromExcel(file, callback)` → קורא `.xlsx` ומחזיר שורות

### גיבוי / סנכרון
- `backupAll()` → מוריד JSON עם כל הנתונים
- `restoreAll(file)` → משחזר מ-JSON
- `syncPushAll()` / `syncPullAll()` → Google Sheets דרך GAS
- `autoSync()` → דחיפה שקטה אחרי שמירה (800ms delay)

### PIN
- `requirePin(cb)` → מחכה לקוד מנהל לפני callback

---

## קונבנציות קוד

### מבנה כל דף HTML
```
<head> → meta charset/viewport/theme-color/apple-meta + favicon + manifest + title + style.css + <style>
<body> → <header class="app-header"> → <nav class="main-nav"> → <div class="container"> → modals → toast → confirmOverlay → <script src="shared.js"> → <script>
```

### nav – תבנית
```html
<nav class="main-nav">
  <a href="index.html"       class="nav-link">🏠 <span class="label">ראשי</span></a>
  <a href="הוצאות.html"      class="nav-link">💰 <span class="label">הוצאות</span></a>
  <a href="חשבונות.html"     class="nav-link">🧾 <span class="label">חשבונות</span></a>
  <a href="חובות.html"       class="nav-link">💳 <span class="label">חובות</span></a>
  <a href="עובדים.html"      class="nav-link">👷 <span class="label">עובדים</span></a>
  <a href="מוצרים.html"      class="nav-link">📦 <span class="label">מוצרים</span></a>
  <a href="צמיגים.html"      class="nav-link">🔵 <span class="label">צמיגים</span></a>
  <a href="רכבים.html"       class="nav-link">🚗 <span class="label">רכבים</span></a>
  <a href="הצעות-מחיר.html" class="nav-link">💬 <span class="label">הצעות מחיר</span></a>
  <a href="ספקים.html"       class="nav-link">🏭 <span class="label">ספקים</span></a>
  <a href="בדיקות-קניה.html" class="nav-link">📝 <span class="label">בדיקות קניה</span></a>
  <a href="תזכורות.html"     class="nav-link">🔔 <span class="label">תזכורות</span></a>
  <a href="מסמכים.html"      class="nav-link">📄 <span class="label">מסמכים</span></a>
  <a href="הגדרות.html"      class="nav-link">⚙️ <span class="label">הגדרות</span></a>
</nav>
```

### modal – תבנית
```html
<div id="myModal" class="modal-overlay">
  <div class="modal" style="max-width:640px">
    <div class="modal-header">
      <h3>כותרת</h3>
      <button class="modal-close" onclick="closeMyModal()">✕</button>
    </div>
    <div class="modal-body"> ... </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeMyModal()">ביטול</button>
      <button class="btn btn-primary" onclick="save()">💾 שמור</button>
    </div>
  </div>
</div>
```
פתיחה: `document.getElementById('myModal').classList.add('open')`
סגירה: `document.getElementById('myModal').classList.remove('open')`

### confirm dialog – תבנית קבועה
```html
<div id="confirmOverlay" class="confirm-overlay">
  <div class="confirm-box">
    <div class="big-icon" id="confirmIcon">🗑️</div>
    <p id="confirmMsg"></p>
    <div class="btns">
      <button class="btn btn-secondary" onclick="confirmNo()">ביטול</button>
      <button class="btn btn-danger" onclick="confirmYes()" id="confirmYesBtn">מחק</button>
    </div>
  </div>
</div>
```

---

## CSS – משתני צבע עיקריים
```css
--primary:      #1a9e5c   /* ירוק – ברירת מחדל */
--accent:       #2563eb   /* כחול */
--warning:      #d97706   /* כתום */
--danger:       #dc2626   /* אדום */
--text:         #1e293b
--text-muted:   #64748b
--bg:           #f8fafc
--border:       #e2e8f0
--radius:       12px
--shadow:       0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06)
```

### כרטיסיות מודול (index.html)
```html
<a href="X.html" class="module-card [blue|orange|gray|red]">
  <div class="mod-icon">emoji</div>
  <h2>שם</h2>
  <p>תיאור</p>
  <div class="mod-stat" id="statX">—</div>
</a>
```

---

## Service Worker
- גרסה נוכחית: **autoline-v19**
- בכל עדכון גדול: bump מספר ב-`sw.js` + עדכן `style.css?v=X` / `shared.js?v=X` ב-SHELL ובכל HTML

---

## localStorage – כל המפתחות
| מפתח | מודול |
|------|-------|
| `pnc_expenses` | הוצאות |
| `pnc_products` | מוצרים |
| `pnc_tires` | צמיגים |
| `pnc_cars_inventory` | רכבים – מלאי |
| `pnc_cars_buys` | רכבים – קניות |
| `pnc_cars_sells` | רכבים – מכירות |
| `pnc_quotes_tires` | הצעות מחיר – צמיגים |
| `pnc_quotes_parts` | הצעות מחיר – חלקים |
| `pnc_suppliers` | ספקים |
| `pnc_tenants` | חשבונות – חיובים |
| `pnc_payments` | חשבונות – תשלומים |
| `pnc_reminders` | תזכורות |
| `pnc_customer_debts` | חובות לקוחות |
| `pnc_supplier_debts` | חובות ספקים |
| `pnc_employees` | עובדים |
| `pnc_salaries` | שכר |
| `pnc_forms` | מסמכים (תבניות הדפסה) |
| `mualem_db_v3` | בדיקות קניה (legacy) |
| `pnc_settings` | הגדרות גלובליות |

---

## העדפות משתמש
- שפת קוד: **אנגלית**, תוכן: **עברית**
- RTL בכל הדפים
- אין frameworks, אין build step, אין package.json
- שם המערכת: **"אוטוליין – מערכת עזר לניהול"**
- פרסה: **GitHub Pages** (HTTPS → PWA תקין)
- אין Supabase/Firebase – סנכרון רק דרך **Google Apps Script**
