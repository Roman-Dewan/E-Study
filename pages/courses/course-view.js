import { auth, db } from '../../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentCourse = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../../index.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (!courseId) {
        alert("No course ID provided.");
        window.location.href = 'my-courses.html';
        return;
    }

    await loadCourseData(courseId, user.email);
});

async function loadCourseData(courseId, email) {
    try {
        const courseDoc = await getDoc(doc(db, "E-study", email, "enrolled_courses", courseId));
        
        if (!courseDoc.exists()) {
            console.error("Course not found in enrollments.");
            // Try fetching from global courses if not in enrollments (e.g. preview)
            const globalDoc = await getDoc(doc(db, "courses", courseId));
            if (globalDoc.exists()) {
                currentCourse = { id: globalDoc.id, ...globalDoc.data() };
            } else {
                alert("Course not found.");
                window.location.href = 'courses.html';
                return;
            }
        } else {
            currentCourse = { id: courseDoc.id, ...courseDoc.data() };
        }

        renderPlayerUI();
    } catch (error) {
        console.error("Error loading course:", error);
    }
}

function renderPlayerUI() {
    if (!currentCourse) return;

    // Update Basic Info
    document.title = `${currentCourse.course_name} – Player`;
    document.getElementById('courseTitle').textContent = currentCourse.course_name;
    document.getElementById('instrName').textContent = currentCourse.instructor_name || "Expert Instructor";
    document.getElementById('instrAvatar').textContent = (currentCourse.instructor_name ? currentCourse.instructor_name[0] : "?").toUpperCase();
    document.getElementById('statLessons').textContent = currentCourse.lesson || 0;
    document.getElementById('courseDesc').textContent = currentCourse.course_description || "No description available for this course.";

    // Load Video
    loadVideo(currentCourse.url);

    // Render Lecture List (Mocking modules if not present in DB)
    renderLectureList();
}

function loadVideo(url) {
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    if (!url) {
        videoPlaceholder.innerHTML = `<div class="loading-video"><span>Video not available for this course.</span></div>`;
        return;
    }

    let embedUrl = url;
    if (url.includes('watch?v=')) {
        embedUrl = url.replace('watch?v=', 'embed/').split('&')[0];
    } else if (url.includes('youtu.be/')) {
        embedUrl = url.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
    }

    // Add autoplay and privacy settings
    const finalUrl = `${embedUrl}?rel=0&autoplay=0`;

    videoPlaceholder.innerHTML = `
        <iframe src="${finalUrl}" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen></iframe>
    `;
}

function renderLectureList() {
    const list = document.getElementById('lectureList');
    // For now, we mock modules based on the lecture count
    const lessonCount = parseInt(currentCourse.lesson) || 5;
    
    let html = '';
    
    // Module 1
    html += `<div class="module-item">
        <span class="module-title">MODULE 1 - INTRODUCTION</span>
        <div class="lecture-item active">
            <div class="l-info">
                <span class="l-name">01. Course Overview</span>
                <span class="l-meta"><i class="fa-regular fa-clock"></i> 05:00</span>
            </div>
            <i class="fa-solid fa-play l-icon"></i>
        </div>
        <div class="lecture-item">
            <div class="l-info">
                <span class="l-name">02. Setup Environment</span>
                <span class="l-meta"><i class="fa-regular fa-clock"></i> 12:45</span>
            </div>
            <i class="fa-regular fa-circle l-icon"></i>
        </div>
    </div>`;

    // Module 2
    if (lessonCount > 2) {
        html += `<div class="module-item" style="margin-top: 20px;">
            <span class="module-title">MODULE 2 - CORE CONCEPTS</span>
            <div class="lecture-item">
                <div class="l-info">
                    <span class="l-name">03. Understanding the Basics</span>
                    <span class="l-meta"><i class="fa-regular fa-clock"></i> 18:20</span>
                </div>
                <i class="fa-regular fa-circle l-icon"></i>
            </div>
            <div class="lecture-item">
                <div class="l-info">
                    <span class="l-name">04. Deep Dive into Strategy</span>
                    <span class="l-meta"><i class="fa-regular fa-clock"></i> 22:15</span>
                </div>
                <i class="fa-regular fa-circle l-icon"></i>
            </div>
        </div>`;
    }

    list.innerHTML = html;
}

// ── TAB SWITCHING ──
document.querySelectorAll('.player-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        // Triggers
        document.querySelectorAll('.player-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Content
        const target = btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const content = document.getElementById(`tab-${target}`);
        if (content) content.classList.add('active');
    });
});
