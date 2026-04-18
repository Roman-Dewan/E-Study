import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBwGBnnMnKsZ2Pqa2mQv4pO8qMJ07Y2XlI",
  authDomain: "e-study-97072.firebaseapp.com",
  projectId: "e-study-97072",
  storageBucket: "e-study-97072.firebasestorage.app",
  messagingSenderId: "351324744836",
  appId: "1:351324744836:web:fad5eb89dbb91d197426d1",
  measurementId: "G-LQYD0NQMWS"
};

const app  = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db   = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = '../../index.html'; return; }
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (snap.exists()) { /* populate UI */ }
});


// ── DASHBOARD DATA ENGINE (MOCK) ───────────────────────────────────────────
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDayData(year, month, day) {
  const seed = year * 10000 + month * 100 + day;
  const r = (n) => seededRandom(seed + n);
  return {
    reading:    Math.round(r(1) * 90 + 10),
    video:      Math.round(r(2) * 70 + 10),
    writing:    Math.round(r(3) * 60 + 5),
    assignment: Math.round(r(4) * 40 + 5),
    weekTasks:   Array.from({ length: 7 }, (_, i) => Math.round(r(10 + i) * 8)),
    weekLessons: Array.from({ length: 7 }, (_, i) => Math.round(r(20 + i) * 6)),
    highlightIdx: Math.round(r(30) * 6)
  };
}


// ── CALENDAR ────────────────────────────────────────────────────────────────
const today = new Date();
let selectedDate = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };

function renderCalendar() {
  const month = document.getElementById('calMonth').selectedIndex;
  const year  = parseInt(document.getElementById('calYear').value);
  const grid  = document.getElementById('calGrid');

  grid.querySelectorAll('.cal-day').forEach(d => d.remove());

  const firstDay      = new Date(year, month, 1).getDay();
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className   = 'cal-day other-month';
    el.textContent = prevMonthDays - firstDay + 1 + i;
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSel   = d === selectedDate.day && month === selectedDate.month && year === selectedDate.year;

    let cls = 'cal-day';
    if (isToday) cls += ' today';
    if (isSel)   cls += ' selected';
    if (!isToday && !isSel && [3, 9, 13, 22].includes(d)) cls += ' has-event';

    el.className   = cls;
    el.textContent = d;
    el.addEventListener('click', () => {
      selectedDate = { year, month, day: d };
      renderCalendar();
      updateDashboardForDate(year, month, d);
    });
    grid.appendChild(el);
  }
}


// ── DASHBOARD UPDATE LOGIC ──────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function updateDashboardForDate(year, month, day) {
  const data = getDayData(year, month, day);
  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Update Labels
  document.getElementById('learningDateLabel').textContent = isToday ? 'Today' : `${MONTHS[month]} ${day}, ${year}`;
  document.getElementById('activityPeriodLabel').textContent = isToday ? 'weekly' : `week of ${MONTHS[month]} ${day}`;

  // Update Donut
  const total = data.reading + data.video + data.writing + data.assignment;
  const C = 2 * Math.PI * 50;
  const wArc = (data.writing / total) * C;
  const vArc = (data.video / total) * C;
  const rArc = (data.reading / total) * C;

  document.getElementById('donutWriting').setAttribute('stroke-dasharray', `${wArc + vArc + rArc} ${C}`);
  const dVideo = document.getElementById('donutVideo');
  dVideo.setAttribute('stroke-dasharray', `${vArc + rArc} ${C}`);
  dVideo.setAttribute('stroke-dashoffset', -wArc);
  const dReading = document.getElementById('donutReading');
  dReading.setAttribute('stroke-dasharray', `${rArc} ${C}`);
  dReading.setAttribute('stroke-dashoffset', -(wArc + vArc));

  document.getElementById('labelReading').textContent    = `Reading ${data.reading}m`;
  document.getElementById('labelVideo').textContent      = `Video ${data.video}m`;
  document.getElementById('labelWriting').textContent    = `Writing ${data.writing}m`;
  document.getElementById('labelAssignment').textContent = `Assignment ${data.assignment}m`;

  // Update Line Chart
  const xs = 260 / 6;
  const pts = (vals, max) => vals.map((v, i) => `${Math.round(i * xs)},${Math.round(95 - (v / max) * 85)}`).join(' ');
  document.getElementById('activityLine1').setAttribute('points', pts(data.weekTasks, 8));
  document.getElementById('activityLine2').setAttribute('points', pts(data.weekLessons, 6));

  const hi = data.highlightIdx;
  const hx = Math.round(hi * xs);
  const hy = Math.round(95 - (data.weekTasks[hi] / 8) * 85);
  document.getElementById('activityDot').setAttribute('cx', hx);
  document.getElementById('activityDot').setAttribute('cy', hy);
  document.getElementById('activityDotText').setAttribute('x', hx);
  document.getElementById('activityDotText').setAttribute('y', hy - 10);
  document.getElementById('activityDotText').textContent = data.weekTasks[hi];
  document.getElementById('activityDotLabel').setAttribute('x', hx);
  document.getElementById('activityDotLabel').setAttribute('y', hy + 18);

  // Day Headers
  const base = new Date(year, month, day);
  const startOffset = (base.getDay() + 1) % 7;
  let labels = '';
  for(let i=0; i<7; i++) {
    const d = new Date(year, month, day - startOffset + i);
    const active = d.getDate() === day && d.getMonth() === month;
    labels += `<span ${active ? 'style="color:var(--green);font-weight:700"' : ''}>${DAYS[d.getDay()]}</span>`;
  }
  document.getElementById('activityDayLabels').innerHTML = labels;
}


// ── INIT & EVENTS ───────────────────────────────────────────────────────────
document.getElementById('calMonth').addEventListener('change', renderCalendar);
document.getElementById('calYear').addEventListener('change', renderCalendar);

document.querySelectorAll('.cal-nav').forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    let month = document.getElementById('calMonth').selectedIndex;
    let year  = parseInt(document.getElementById('calYear').value);
    if (idx === 0) { month--; if (month < 0) { month = 11; year--; } }
    else           { month++; if (month > 11) { month = 0; year++; } }
    document.getElementById('calMonth').selectedIndex = month;
    const yearOpt = [...document.getElementById('calYear').options].find(o => parseInt(o.value) === year);
    if (yearOpt) document.getElementById('calYear').value = year;
    renderCalendar();
  });
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

renderCalendar();
updateDashboardForDate(today.getFullYear(), today.getMonth(), today.getDate());