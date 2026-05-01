import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

async function fetchCourses() {
    try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        allCourses = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        renderCourses(allCourses);
    } catch (error) {
        console.error("Error fetching courses: ", error);
        document.getElementById('coursesGrid').innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 40px;">Failed to load courses. Please try again later.</p>';
    }
}

function renderCourses(courses) {
    const grid = document.getElementById('modalCoursesGrid');
    if (!grid) return;

    if (courses.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 40px; color: #6b7280;">No courses found matching your search.</p>';
        return;
    }

    grid.innerHTML = courses.map(course => {
        const theme = categoryTheme[course.course_category] || categoryTheme['Default'];
        const instructorInitial = course.instructor_name ? course.instructor_name[0] : '?';
        
        return `
            <div class="modal-course-card">
                <div class="card-top">
                    <div class="category-icon" style="background: ${theme.bg}; color: white;">
                        ${theme.icon}
                    </div>
                    <div class="card-dots">···</div>
                </div>
                <div class="course-cat">${course.course_category || 'General'}</div>
                <h3 class="course-name">${course.course_name}</h3>
                
                <div class="instructor-info">
                    <div class="instr-avatar-small" style="background: ${theme.color}">
                        ${instructorInitial}
                    </div>
                    <span class="instr-name-small">${course.instructor_name || 'Expert Instructor'}</span>
                </div>
                
                <div class="course-stats">
                    <div class="stat-item">
                        <i class="fa-solid fa-layer-group" style="color: ${theme.color}"></i>
                        <span>${course.lesson || 0} Lessons</span>
                    </div>
                    <div class="stat-item">
                        <i class="fa-regular fa-clock"></i>
                        <span>${course.course_duration || 'Self-paced'}</span>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn-action ${course.course_price === 0 ? 'btn-enroll' : 'btn-view'}" 
                            onclick="handleCourseAction('${course.id}', ${course.course_price})">
                        ${course.course_price === 0 || !course.course_price ? 'Enroll' : 'View Details'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Global scope for onclick
window.handleCourseAction = (courseId, price) => {
    // If authenticated, go to courses page with the enrollment ID
    if (window._auth && window._auth.currentUser) {
        window.location.href = `pages/courses/courses.html?enroll=${courseId}`;
    } else {
        window.location.href = 'features/auth/login.html';
    }
};

// Modal Logic
const overlay = document.getElementById('coursesModalOverlay');
const closeBtn = document.getElementById('closeCoursesModal');
const searchInput = document.getElementById('modalSearchInput');
const categorySelect = document.getElementById('modalCategorySort');

export function openCoursesModal() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    if (allCourses.length === 0) {
        fetchCourses();
    }
}

function closeCoursesModalFunc() {
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

if (overlay) {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeCoursesModalFunc();
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeCoursesModalFunc);
}

// Search Logic
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allCourses.filter(c => 
            c.course_name.toLowerCase().includes(query) || 
            (c.instructor_name && c.instructor_name.toLowerCase().includes(query))
        );
        renderCourses(filtered);
    });
}

// Category Filter
if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
        const cat = e.target.value;
        if (cat === 'All Categories') {
            renderCourses(allCourses);
        } else {
            const filtered = allCourses.filter(c => c.course_category === cat);
            renderCourses(filtered);
        }
    });
}

// Listen for global trigger
document.addEventListener('open-courses-modal', openCoursesModal);
