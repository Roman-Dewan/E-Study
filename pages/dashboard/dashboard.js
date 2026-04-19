import { auth, db } from '../../js/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, collection, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const today = new Date();
let selectedDate = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = '../../index.html'; return; }
  const snap = await getDoc(doc(db, 'E-study', user.uid));
  if (snap.exists()) {
    const userData = snap.data();
    const firstName = userData.first_name || '';
    const fullName = `${firstName} ${userData.last_name || ''}`.trim() || 'User';
    // Update topbar name
    const nameEl = document.querySelector('.user-name');
    if (nameEl) nameEl.textContent = fullName;
    // Update hero banner greeting
    const heroH2 = document.querySelector('.hero-banner h2');
    if (heroH2) heroH2.textContent = `Hi ${firstName || fullName} \uD83D\uDC4B`;
  }
  updateDashboardForDate(selectedDate.year, selectedDate.month, selectedDate.day);
});


// Logout handler (triggered by sidebar logout link)
document.addEventListener('estudy-logout', async () => {
  try {
    await signOut(auth);
    window.location.href = '../../index.html';
  } catch (err) {
    console.error('Logout error:', err);
  }
});


// ── DASHBOARD DATA ENGINE (FIREBASE) ─────────────────────────────────────────

/**
 * Fetches stats for a specific day. If no data exists, returns zeros.
 */
async function getDayData(uid, dateStr) {
  const docRef = doc(db, 'E-study', uid, 'activity', dateStr);
  const snap = await getDoc(docRef);
  if (snap.exists()) return snap.data();
  return { reading: 0, video: 0, writing: 0, assignment: 0, tasks: 0, lessons: 0 };
}

/**
 * Fetches activity for the week surrounding the given date.
 */
async function getWeeklyData(uid, centerDate) {
  const activityRef = collection(db, 'E-study', uid, 'activity');

  // Calculate the start of the week (last Saturday as per current layout)
  const base = new Date(centerDate.year, centerDate.month, centerDate.day);
  const dayOfWeek = base.getDay(); // 0 is Sunday
  const diffToSat = (dayOfWeek + 1) % 7;
  const startDate = new Date(base);
  startDate.setDate(base.getDate() - diffToSat);

  const weekData = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const data = await getDayData(uid, dStr);
    weekData.push(data);
  }

  return {
    weekTasks: weekData.map(d => d.tasks || 0),
    weekLessons: weekData.map(d => d.lessons || 0),
    highlightIdx: diffToSat
  };
}

/**
 * UTILITY: Call this from the browser console to add sample data!
 * Example: seedStats('2025-09-11', { reading: 45, video: 30, writing: 20, assignment: 15, tasks: 4, lessons: 3 })
 */
window.seedStats = async (dateStr, data) => {
  if (!auth.currentUser) return console.error("No user logged in");
  const docRef = doc(db, 'E-study', auth.currentUser.uid, 'activity', dateStr);
  await setDoc(docRef, data, { merge: true });
  console.log(`Data seeded for ${dateStr}`);
  updateDashboardForDate(selectedDate.year, selectedDate.month, selectedDate.day);
};


// ── CALENDAR ────────────────────────────────────────────────────────────────

function renderCalendar() {
  const month = document.getElementById('calMonth').selectedIndex;
  const year = parseInt(document.getElementById('calYear').value);
  const grid = document.getElementById('calGrid');

  grid.querySelectorAll('.cal-day').forEach(d => d.remove());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day other-month';
    el.textContent = prevMonthDays - firstDay + 1 + i;
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSel = d === selectedDate.day && month === selectedDate.month && year === selectedDate.year;

    let cls = 'cal-day';
    if (isToday) cls += ' today';
    if (isSel) cls += ' selected';
    if (!isToday && !isSel && [3, 9, 13, 22].includes(d)) cls += ' has-event';

    el.className = cls;
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

async function updateDashboardForDate(year, month, day) {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Show a mini loading state if desired (optional)
  document.getElementById('learningDateLabel').textContent = "Loading...";

  const data = await getDayData(uid, dateStr);
  const weekly = await getWeeklyData(uid, { year, month, day });

  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Update Labels
  document.getElementById('learningDateLabel').textContent = isToday ? 'Today' : `${MONTHS[month]} ${day}, ${year}`;
  document.getElementById('activityPeriodLabel').textContent = isToday ? 'weekly' : `week of ${MONTHS[month]} ${day}`;

  // Update Donut
  const total = (data.reading || 0) + (data.video || 0) + (data.writing || 0) + (data.assignment || 0) || 1; // avoid divide by zero
  const C = 2 * Math.PI * 50;
  const wArc = ((data.writing || 0) / total) * C;
  const vArc = ((data.video || 0) / total) * C;
  const rArc = ((data.reading || 0) / total) * C;

  document.getElementById('donutWriting').setAttribute('stroke-dasharray', `${wArc + vArc + rArc} ${C}`);
  const dVideo = document.getElementById('donutVideo');
  dVideo.setAttribute('stroke-dasharray', `${vArc + rArc} ${C}`);
  dVideo.setAttribute('stroke-dashoffset', -wArc);
  const dReading = document.getElementById('donutReading');
  dReading.setAttribute('stroke-dasharray', `${rArc} ${C}`);
  dReading.setAttribute('stroke-dashoffset', -(wArc + vArc));

  document.getElementById('labelReading').textContent = `Reading ${data.reading || 0}m`;
  document.getElementById('labelVideo').textContent = `Video ${data.video || 0}m`;
  document.getElementById('labelWriting').textContent = `Writing ${data.writing || 0}m`;
  document.getElementById('labelAssignment').textContent = `Assignment ${data.assignment || 0}m`;

  // Update Line Chart
  const xs = 260 / 6;
  const pts = (vals, max) => vals.map((v, i) => `${Math.round(i * xs)},${Math.round(95 - (v / (max || 1)) * 85)}`).join(' ');
  document.getElementById('activityLine1').setAttribute('points', pts(weekly.weekTasks, 8));
  document.getElementById('activityLine2').setAttribute('points', pts(weekly.weekLessons, 6));

  const hi = weekly.highlightIdx;
  const hx = Math.round(hi * xs);
  const hy = Math.round(95 - ((weekly.weekTasks[hi] || 0) / 8) * 85);
  document.getElementById('activityDot').setAttribute('cx', hx);
  document.getElementById('activityDot').setAttribute('cy', hy);
  document.getElementById('activityDotText').setAttribute('x', hx);
  document.getElementById('activityDotText').setAttribute('y', hy - 10);
  document.getElementById('activityDotText').textContent = weekly.weekTasks[hi] || 0;
  document.getElementById('activityDotLabel').setAttribute('x', hx);
  document.getElementById('activityDotLabel').setAttribute('y', hy + 18);

  // Day Headers
  const base = new Date(year, month, day);
  const startOffset = (base.getDay() + 1) % 7;
  let labels = '';
  for (let i = 0; i < 7; i++) {
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
    let year = parseInt(document.getElementById('calYear').value);
    if (idx === 0) { month--; if (month < 0) { month = 11; year--; } }
    else { month++; if (month > 11) { month = 0; year++; } }
    document.getElementById('calMonth').selectedIndex = month;

    // Ensure the year exists in dropdown
    const yearSelect = document.getElementById('calYear');
    let yearOpt = [...yearSelect.options].find(o => parseInt(o.value) === year);
    if (!yearOpt) {
      const op = document.createElement('option');
      op.value = year;
      op.textContent = year;
      yearSelect.appendChild(op);
    }
    yearSelect.value = year;

    renderCalendar();
  });
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// Initialize Calendar Dropdowns to Current Month/Year
document.getElementById('calMonth').selectedIndex = today.getMonth();
const initYearSelect = document.getElementById('calYear');
let initYearOpt = [...initYearSelect.options].find(o => parseInt(o.value) === today.getFullYear());
if (!initYearOpt) {
  const op = document.createElement('option');
  op.value = today.getFullYear();
  op.textContent = today.getFullYear();
  initYearSelect.appendChild(op);
}
initYearSelect.value = today.getFullYear();

renderCalendar();