import { auth, db } from '../../js/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, collection, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const today = new Date();
let selectedDate = { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = '../../index.html'; return; }
  
  // Set immediate fallback from cache/auth to prevent blink
  const cachedName = localStorage.getItem('estudy_user_name') || user.displayName || 'User';
  const firstNameFallback = cachedName.split(' ')[0];
  
  const nameEl = document.querySelector('.user-name');
  if (nameEl) nameEl.textContent = cachedName;
  
  const greetingEl = document.getElementById('greeting-name');
  if (greetingEl) greetingEl.textContent = `${firstNameFallback} \uD83D\uDC4B`;

  // Fetch full data from Firestore using email (consistent with signup/login)
  const snap = await getDoc(doc(db, 'E-study', user.email));
  if (snap.exists()) {
    const userData = snap.data();
    const firstName = userData.first_name || firstNameFallback;
    const fullName = `${firstName} ${userData.last_name || ''}`.trim() || cachedName;
    
    // Update topbar name
    if (nameEl) nameEl.textContent = fullName;
    // Update hero banner greeting
    if (greetingEl) greetingEl.textContent = `${fullName} \uD83D\uDC4B`;
    
    // Sync back to localStorage
    localStorage.setItem('estudy_user_name', fullName);
  }
  updateDashboardForDate(selectedDate.year, selectedDate.month, selectedDate.day);
  if (user.email) {
    loadUpcomingTasks(user.email);
    loadMyCourses(user.email);
  }
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


// ── UPCOMING TASKS ───────────────────────────────────────────────────────────

const THEME_CONFIG = {
  green:  { bg: '#e0f8ec', color: '#45D48B', icon: '📗' },
  orange: { bg: '#fff5eb', color: '#f97316', icon: '📙' },
  purple: { bg: '#f5f3ff', color: '#8b5cf6', icon: '📘' },
};

async function loadUpcomingTasks(email) {
  const list = document.getElementById('upcoming-tasks-list');
  if (!list) return;

  // Today's date string in YYYY-MM-DD
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  try {
    const q = collection(db, 'E-study', email, 'schedule_task');
    const snap = await getDocs(q);

    const tasks = [];
    snap.forEach(d => tasks.push({ ...d.data(), id: d.id }));

    // Filter: only today and future; sort by date then start_time
    const upcoming = tasks
      .filter(t => t.date >= todayStr)
      .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
      .slice(0, 3);

    if (upcoming.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:16px 0;color:var(--muted);font-size:13px;">No upcoming tasks</div>`;
      return;
    }

    const todayLabel = todayStr;
    list.innerHTML = upcoming.map(t => {
      const cfg = THEME_CONFIG[t.theme] || THEME_CONFIG.green;
      const isToday = t.date === todayLabel;
      const dateObj = new Date(t.date + 'T00:00:00');
      const dateDisplay = isToday ? 'Today' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Format times to AM/PM
      const fmtTime = (str) => {
        if (!str) return '';
        const [h, m] = str.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
      };

      return `
        <div class="task-item" style="border-left: 3px solid ${cfg.color}; padding-left: 10px;">
          <div class="task-icon" style="background:${cfg.bg}; font-size:16px;">${cfg.icon}</div>
          <div class="task-info">
            <h4 style="margin:0 0 2px;font-size:13px;color:#222;">${t.title}</h4>
            <span style="font-size:11px;color:var(--muted);">${dateDisplay} &nbsp;·&nbsp; ${fmtTime(t.start_time)} – ${fmtTime(t.end_time)}</span>
          </div>
        </div>`;
    }).join('');

  } catch (e) {
    console.error('Error loading upcoming tasks:', e);
    list.innerHTML = `<div style="text-align:center;padding:16px 0;color:var(--muted);font-size:13px;">Could not load tasks</div>`;
  }
}

// ── MY COURSES ─────────────────────────────────────────────────────────────────

const COURSE_GRADIENTS = [
  'linear-gradient(135deg,#f5a623,#f76b1c)',
  'linear-gradient(135deg,#6a82fb,#fc5c7d)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#30cfd0,#667eea)',
];

let allCourses = [];

async function loadMyCourses(email) {
  try {
    const q = collection(db, 'E-study', email, 'enrolled_courses');
    const snap = await getDocs(q);
    allCourses = [];
    snap.forEach(d => allCourses.push({ ...d.data(), id: d.id }));
    renderCourses('all');
  } catch (e) {
    console.error('Error loading courses:', e);
    const list = document.getElementById('courses-list');
    if (list) list.innerHTML = `<div style="text-align:center;padding:20px 0;color:var(--muted);font-size:13px;">Could not load courses</div>`;
  }
}

function renderCourses(filter) {
  const list = document.getElementById('courses-list');
  if (!list) return;

  let filtered = allCourses;
  if (filter === 'ongoing') {
    filtered = allCourses.filter(c => c.isCompleted === 'false' || c.isCompleted === false || !c.isCompleted);
  } else if (filter === 'complete') {
    filtered = allCourses.filter(c => c.isCompleted === 'true' || c.isCompleted === true);
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:20px 0;color:var(--muted);font-size:13px;">No courses found</div>`;
    return;
  }

  list.innerHTML = filtered.map((course, idx) => {
    const gradient = COURSE_GRADIENTS[idx % COURSE_GRADIENTS.length];
    const progress = Number(course.progressPercentage) || 0;
    const isComplete = course.isCompleted === 'true' || course.isCompleted === true;
    const badgeStyle = isComplete
      ? 'background:#e0f8ec;color:#45D48B;'
      : 'background:#fff5eb;color:#f97316;';
    const badgeText = isComplete ? 'Completed' : 'Ongoing';

    // Thumbnail: use course_image as background if valid URL, else gradient
    const thumbStyle = course.course_image
      ? `background:${gradient}; background-image:url('${course.course_image}'); background-size:cover; background-position:center;`
      : `background:${gradient};`;
    const thumbInner = course.course_image ? '' : '📚';

    return `
      <div class="course-item">
        <div class="course-thumb-sm" style="${thumbStyle}">${thumbInner}</div>
        <div class="course-info" style="flex:1;min-width:0;">
          <h4 style="margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${course.course_name || 'Untitled Course'}</h4>
          <span style="font-size:11px;color:var(--muted);">By ${course.instructor_name || 'Unknown'}&nbsp;
            <span style="${badgeStyle} padding:1px 7px; border-radius:20px; font-size:10px; font-weight:600;">${badgeText}</span>
          </span>
          <div style="margin-top:5px; height:4px; background:#f0f0f0; border-radius:4px; overflow:hidden;">
            <div style="height:100%; width:${progress}%; background:var(--green); border-radius:4px; transition:width 0.4s;"></div>
          </div>
          <span style="font-size:10px;color:var(--muted);">${progress}% complete</span>
        </div>
        <a href="../courses/course-view.html?id=${course.id}" class="view-btn" style="flex-shrink:0;">View</a>
      </div>`;
  }).join('');
}



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
    const filter = tab.dataset.filter || 'all';
    renderCourses(filter);
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