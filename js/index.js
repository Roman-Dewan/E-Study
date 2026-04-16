// ── FIREBASE (configure and uncomment when ready) ──────────────────────────
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// const firebaseConfig = {
//   apiKey: "API_KEY",
//   authDomain: "AUTH_DOMAIN",
//   projectId: "PROJECT_ID",
//   storageBucket: "STORAGE_BUCKET",
//   messagingSenderId: "SENDER_ID",
//   appId: "APP_ID"
// };

// const app  = initializeApp(firebaseConfig);
// const auth = Auth(app);
// const db   = Firestore(app);

// onAuthStateChanged(auth, async (user) => {
//   if (!user) { window.location.href = 'index.html'; return; }
//   const snap = await getDoc(doc(db, 'users', user.uid));
//   if (snap.exists()) { /* populate UI */ }
// });


// ── CALENDAR ────────────────────────────────────────────────────────────────
function renderCalendar() {
  const month = document.getElementById('calMonth').selectedIndex;
  const year  = parseInt(document.getElementById('calYear').value);
  const grid  = document.getElementById('calGrid');

  // Remove previously rendered day cells (keep the day-label headers)
  grid.querySelectorAll('.cal-day').forEach(d => d.remove());

  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const today        = new Date();
  const eventDays    = [9, 13, 20]; // sample event days

  // Trailing days from the previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className   = 'cal-day other-month';
    el.textContent = prevMonthDays - firstDay + 1 + i;
    grid.appendChild(el);
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year  === today.getFullYear();

    let cls = 'cal-day';
    if (isToday)             cls += ' today';
    else if (eventDays.includes(d)) cls += ' has-event';

    el.className   = cls;
    el.textContent = d;
    grid.appendChild(el);
  }
}

document.getElementById('calMonth').addEventListener('change', renderCalendar);
document.getElementById('calYear').addEventListener('change', renderCalendar);
renderCalendar();


// ── CALENDAR NAV BUTTONS ────────────────────────────────────────────────────
const calMonthSelect = document.getElementById('calMonth');
const calYearSelect  = document.getElementById('calYear');

document.querySelectorAll('.cal-nav').forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    let month = calMonthSelect.selectedIndex;
    let year  = parseInt(calYearSelect.value);

    if (idx === 0) {          // prev
      month--;
      if (month < 0) { month = 11; year--; }
    } else {                  // next
      month++;
      if (month > 11) { month = 0; year++; }
    }

    calMonthSelect.selectedIndex = month;

    // Update year select if the value exists
    const yearOption = [...calYearSelect.options].find(o => parseInt(o.value) === year);
    if (yearOption) calYearSelect.value = year;

    renderCalendar();
  });
});


// ── COURSE TABS ─────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});