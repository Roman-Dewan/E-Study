import { auth, db } from '../../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, getDocs, collection, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let allCourses = [];
let enrolledCourseIds = new Set();
let selectedCourse = null;

// ── AUTH GUARD ──
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = '../../index.html'; return; }
  
  // Fetch User Profile
  const snap = await getDoc(doc(db, 'E-study', user.email));
  if (snap.exists()) {
    const d = snap.data();
    const name = `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'User';
    const el = document.querySelector('.user-name');
    if (el) el.textContent = name;
  }

  // Initial Load
  await initializePage();
});

async function initializePage() {
  await fetchEnrolledCourses();
  await fetchAllCourses();
  renderAllSections();

  // Check for deep-link enrollment
  const urlParams = new URLSearchParams(window.location.search);
  const enrollId = urlParams.get('enroll');
  if (enrollId) {
    setTimeout(() => window.openEnrollmentModal(enrollId), 500);
  }
}

async function fetchEnrolledCourses() {
  if (!auth.currentUser) return;
  try {
    const querySnapshot = await getDocs(collection(db, "E-study", auth.currentUser.email, "enrolled_courses"));
    enrolledCourseIds = new Set(querySnapshot.docs.map(doc => doc.id));
  } catch (e) { console.error("Error fetching enrolled courses:", e); }
}

async function fetchAllCourses() {
  try {
    const querySnapshot = await getDocs(collection(db, "courses"));
    allCourses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching all courses:", e);
  }
}

function renderAllSections() {
  const searchVal = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const catVal = document.getElementById('categoryFilter')?.value || 'All Categories';
  
  // Filter for Explore All
  const exploreList = allCourses.filter(c => {
    const matchesSearch = c.course_name.toLowerCase().includes(searchVal) || 
                          (c.instructor_name && c.instructor_name.toLowerCase().includes(searchVal));
    const matchesCategory = catVal === 'All Categories' || c.course_category === catVal;
    return matchesSearch && matchesCategory;
  });

  renderExploreCourses(exploreList);
}



function renderExploreCourses(list) {
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">No courses found.</p>`;
    return;
  }

  grid.innerHTML = list.map(c => generateCardHTML(c, false)).join('');
}

function generateCardHTML(c, isEnrolledExplicitly) {
  const theme = categoryTheme[c.course_category] || categoryTheme['Default'];
  const isEnrolled = enrolledCourseIds.has(c.id);
  const instructorInitial = c.instructor_name ? c.instructor_name[0] : '?';
  
  return `
    <div class="modal-course-card" onclick="openEnrollmentModal('${c.id}')">
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
        
        <div class="course-stats" style="display:flex; gap:15px; font-size:12px; color:var(--text-muted); margin-bottom:20px;">
            <div class="stat-item" style="display:flex; align-items:center; gap:5px;">
                <i class="fa-solid fa-layer-group" style="color: ${theme.color}"></i>
                <span>${c.lesson || 0} Lessons</span>
            </div>
            <div class="stat-item" style="display:flex; align-items:center; gap:5px;">
                <i class="fa-regular fa-clock"></i>
                <span>${c.course_duration || 'Self-paced'}</span>
            </div>
        </div>
        
        <div class="card-actions">
            ${isEnrolled ? 
              `<button class="btn-action btn-view" style="width:100%;"><i class="fa-solid fa-check"></i> Enrolled</button>` : 
              `<button class="btn-action btn-enroll" style="width:100%;">Enroll Now</button>`
            }
        </div>
    </div>
  `;
}

// ── MODAL LOGIC ──
const modalOverlay = document.getElementById('enrollmentModalOverlay');
const modalContent = document.getElementById('modalCourseContent');
const modalTitle = document.getElementById('modalCourseName');
const confirmBtn = document.getElementById('confirmEnrollBtn');

window.openEnrollmentModal = (courseId) => {
  selectedCourse = allCourses.find(c => c.id === courseId);
  if (!selectedCourse) return;

  const isEnrolled = enrolledCourseIds.has(courseId);
  const theme = categoryTheme[selectedCourse.course_category] || categoryTheme['Default'];

  modalTitle.textContent = selectedCourse.course_name;
  modalContent.innerHTML = `
    <div style="display:flex; gap:20px; align-items:center; margin-bottom:20px;">
        <div style="font-size:40px; width:80px; height:80px; border-radius:20px; background:${theme.bg}; display:flex; align-items:center; justify-content:center; color:white;">
            ${theme.icon}
        </div>
        <div>
            <p style="font-weight:700; color:var(--text-dark); margin-bottom:5px;">Category: ${selectedCourse.course_category}</p>
            <p style="color:var(--text-muted); font-size:14px;">Instructor: ${selectedCourse.instructor_name}</p>
        </div>
    </div>
    <p style="color:var(--text-dark); line-height:1.6; margin-bottom:20px;">
        ${selectedCourse.course_description || 'Join this comprehensive course to master ' + selectedCourse.course_name + '. Perfect for students starting from scratch.'}
    </p>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; background:#f8fafc; padding:15px; border-radius:15px;">
        <div>
            <p style="font-size:12px; color:var(--text-muted);">Duration</p>
            <p style="font-weight:600;">${selectedCourse.course_duration}</p>
        </div>
        <div>
            <p style="font-size:12px; color:var(--text-muted);">Total Lessons</p>
            <p style="font-weight:600;">${selectedCourse.lesson} Video Lessons</p>
        </div>
    </div>
  `;

  if (isEnrolled) {
    confirmBtn.textContent = 'Already Enrolled';
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
  } else {
    confirmBtn.textContent = 'Enroll Now';
    confirmBtn.disabled = false;
    confirmBtn.style.opacity = '1';
  }

  modalOverlay.classList.add('active');
};

function closeEnrollmentModal() {
  modalOverlay.classList.remove('active');
}

document.getElementById('closeEnrollmentModal')?.addEventListener('click', closeEnrollmentModal);

confirmBtn?.addEventListener('click', async () => {
  if (!selectedCourse || !auth.currentUser) return;
  
  confirmBtn.textContent = 'Enrolling...';
  confirmBtn.disabled = true;

  try {
    await setDoc(doc(db, "E-study", auth.currentUser.email, "enrolled_courses", selectedCourse.id), {
      course_id: selectedCourse.id,
      course_name: selectedCourse.course_name,
      course_category: selectedCourse.course_category || "",
      course_description: selectedCourse.course_description || "",
      course_duration: selectedCourse.course_duration || "",
      course_image: selectedCourse.course_image || selectedCourse.thumbnail || "",
      course_price: selectedCourse.course_price || 0,
      createdAt: selectedCourse.createdAt || new Date().toISOString(),
      
      instructor_id: selectedCourse.instructor_id || "unknown",
      instructor_name: selectedCourse.instructor_name || "Expert Instructor",
      
      lesson: selectedCourse.lesson || "0",
      
      enrolledAt: new Date().toISOString(),
      progressPercentage: 0,
      isCompleted: "false"
    });
    
    enrolledCourseIds.add(selectedCourse.id);
    renderAllSections();
    closeEnrollmentModal();
  } catch (e) {
    console.error("Enrollment failed:", e);
    alert("Failed to enroll. Please try again.");
    confirmBtn.textContent = 'Enroll Now';
    confirmBtn.disabled = false;
  }
});

// ── FILTER ACTIONS ──
document.getElementById('searchInput')?.addEventListener('input', renderAllSections);
document.getElementById('categoryFilter')?.addEventListener('change', renderAllSections);