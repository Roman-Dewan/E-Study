import { auth, db } from '../../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const categoryTheme = {
  'AI': { icon: '🤖', color: '#f093fb', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  'Development': { icon: '💻', color: '#4facfe', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  'Design': { icon: '🎨', color: '#f5a623', bg: 'linear-gradient(135deg, #f5a623 0%, #f76b1c 100%)' },
  'Marketing': { icon: '📱', color: '#43e97b', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  'Business': { icon: '💼', color: '#667eea', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  'Science': { icon: '🔬', color: '#fc5c7d', bg: 'linear-gradient(135deg, #fc5c7d 0%, #6a82fb 100%)' },
  'History': { icon: '📜', color: '#11998e', bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  'Martial Arts': { icon: '🥋', color: '#f5a623', bg: 'linear-gradient(135deg, #f5a623 0%, #f76b1c 100%)' },
  'Game Dev': { icon: '🎮', color: '#43e97b', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  'Trading': { icon: '⚓', color: '#4facfe', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  'Default': { icon: '📚', color: '#3DBE7B', bg: 'linear-gradient(135deg, #3DBE7B 0%, #2da066 100%)' }
};

let enrolledCourses = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = '../../index.html'; return; }
  
  // Sync Header Name
  const snap = await getDoc(doc(db, 'E-study', user.email));
  if (snap.exists()) {
    const d = snap.data();
    const nameEl = document.querySelector('.user-name');
    if (nameEl) nameEl.textContent = `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Student';
  }

  await fetchUserCourses();
});

async function fetchUserCourses() {
  if (!auth.currentUser) return;
  
  const grid = document.getElementById('myCoursesGrid');
  if (!grid) return;

  try {
    const email = auth.currentUser.email;
    const enrolledSnap = await getDocs(collection(db, "E-study", email, "enrolled_courses"));
    
    // We need the data from the 'courses' collection for icons/categories too
    const allCoursesSnap = await getDocs(collection(db, "courses"));
    const allCoursesMap = {};
    allCoursesSnap.docs.forEach(doc => allCoursesMap[doc.id] = doc.data());

    enrolledCourses = enrolledSnap.docs.map(doc => {
        const enrollData = doc.data();
        const globalData = allCoursesMap[doc.id] || {};
        return { 
           id: doc.id, 
           ...globalData, 
           ...enrollData // Priority to enroll specific data like progress
        };
    });

    renderMyCourses();
  } catch (error) {
    console.error("Error fetching courses:", error);
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Failed to load your courses. Please try again.</p>`;
  }
}

function renderMyCourses() {
  const searchVal = document.getElementById('myCoursesSearch')?.value.toLowerCase() || '';
  const grid = document.getElementById('myCoursesGrid');
  if (!grid) return;

  const filtered = enrolledCourses.filter(c => 
    c.course_name.toLowerCase().includes(searchVal) || 
    (c.instructor_name && c.instructor_name.toLowerCase().includes(searchVal))
  );

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px;">You haven't enrolled in any matching courses yet.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(c => {
    const theme = categoryTheme[c.course_category] || categoryTheme['Default'];
    const progress = c.progressPercentage || 0;
    const instructorInitial = c.instructor_name ? c.instructor_name[0] : '?';

    return `
      <div class="modal-course-card" onclick="openStatusModal('${c.id}')">
          <div class="card-top">
              <div class="category-icon" style="background: ${theme.bg}; color: white;">
                  ${theme.icon}
              </div>
              <div class="card-dots">···</div>
          </div>
          <div class="course-cat">${c.course_category || 'General'}</div>
          <h3 class="course-name">${c.course_name}</h3>
          
          <div class="instructor-info">
              <div class="instr-avatar-small" style="background: ${theme.color}">
                  ${instructorInitial}
              </div>
              <span class="instr-name-small">${c.instructor_name || 'Expert Instructor'}</span>
          </div>

          <div class="progress-container" style="margin-bottom: 20px;">
              <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px; color:var(--text-muted);">
                  <span>Progress</span>
                  <span>${progress}%</span>
              </div>
              <div style="height:6px; background:#f1f5f9; border-radius:10px; overflow:hidden;">
                  <div style="width:${progress}%; height:100%; background:var(--primary); transition:width 0.3s;"></div>
              </div>
          </div>
          
          <div class="card-actions">
              <button class="btn-action btn-enroll" style="width:100%;">Continue Learning</button>
          </div>
      </div>
    `;
  }).join('');
}

// ── STATUS MODAL ──
const modalOverlay = document.getElementById('courseDetailModalOverlay');
const modalContent = document.getElementById('modalCourseContent');
const modalTitle = document.getElementById('modalCourseName');

window.openStatusModal = (courseId) => {
  const course = enrolledCourses.find(c => c.id === courseId);
  if (!course) return;

  const theme = categoryTheme[course.course_category] || categoryTheme['Default'];
  
  modalTitle.textContent = course.course_name;
  modalContent.innerHTML = `
    <div style="display:flex; gap:20px; align-items:center; margin-bottom:25px;">
        <div style="font-size:40px; width:80px; height:80px; border-radius:20px; background:${theme.bg}; display:flex; align-items:center; justify-content:center; color:white;">
            ${theme.icon}
        </div>
        <div>
            <p style="font-weight:700; color:var(--text-dark); margin-bottom:5px;">Enrolled On: ${new Date(course.enrolledAt).toLocaleDateString()}</p>
            <p style="color:var(--text-muted); font-size:14px;">Instructor: ${course.instructor_name}</p>
        </div>
    </div>
    
    <div style="background:#f8fafc; padding:20px; border-radius:15px; margin-bottom:20px;">
        <p style="font-size:14px; color:var(--text-muted); margin-bottom:10px;">Goal Checklist</p>
        <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; align-items:center; gap:10px; color:var(--text-dark); font-size:14px;">
                <i class="fa-solid fa-circle-check" style="color:var(--primary);"></i> Watch Overview
            </div>
            <div style="display:flex; align-items:center; gap:10px; color:var(--text-dark); font-size:14px;">
                <i class="fa-regular fa-circle" style="color:#cbd5e1;"></i> Complete ${course.lesson || 0} Lessons
            </div>
            <div style="display:flex; align-items:center; gap:10px; color:var(--text-dark); font-size:14px;">
                <i class="fa-regular fa-circle" style="color:#cbd5e1;"></i> Achievement Badge
            </div>
        </div>
    </div>
  `;

  modalOverlay.classList.add('active');
};

document.getElementById('closeDetailModal')?.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
});

document.getElementById('myCoursesSearch')?.addEventListener('input', renderMyCourses);
