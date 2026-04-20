import { auth, db } from '../../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    initMentorDashboard();
});

async function initMentorDashboard() {
    const tabs = document.querySelectorAll('.mentor-tab');
    const forms = document.querySelectorAll('.mentor-form');
    const confirmBtn = document.getElementById('confirm-btn');
    const courseIdInput = document.getElementById('course-id');
    const genCourseIdBtn = document.getElementById('gen-course-id');
    const instructorNameInput = document.getElementById('instructor-name');

    let currentUserData = null;

    // 1. Auth & Pre-fill
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '../../index.html';
            return;
        }

        try {
            // Get user data from Firestore
            const userDocSnap = await getDoc(doc(db, "E-study", user.email));
            if (userDocSnap.exists()) {
                currentUserData = userDocSnap.data();
                if (currentUserData.role !== 'mentor') {
                    // alert('Access denied. Mentor role required.');
                    // window.location.href = '../dashboard/dashboard.html';
                }
                
                const fullName = `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim() || user.displayName || 'Mentor';
                if (instructorNameInput) instructorNameInput.value = fullName;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    });

    // 2. Tab Switching logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Update active tab button
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show active form
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tabName}-form`) {
                    form.classList.add('active');
                }
            });

            // Update confirm button target form
            confirmBtn.setAttribute('form', `${tabName}-form`);
        });
    });

    // 3. Course ID Generator
    genCourseIdBtn?.addEventListener('click', () => {
        const randomId = 'C-' + Math.floor(10000 + Math.random() * 90000);
        courseIdInput.value = randomId;
    });

    // 4. Form Submissions
    const resourceForm = document.getElementById('resource-form');
    const courseForm = document.getElementById('course-form');

    resourceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSubmission('resource');
    });

    courseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSubmission('course');
    });

    async function handleSubmission(type) {
        if (!auth.currentUser) return;

        const btn = document.getElementById('confirm-btn');
        const originalText = btn.textContent;
        
        try {
            btn.textContent = 'Processing...';
            btn.disabled = true;

            let data = {};
            let collectionName = '';

            if (type === 'resource') {
                collectionName = 'resources';
                data = {
                    title: document.getElementById('res-title').value,
                    type: document.getElementById('res-type').value,
                    url: document.getElementById('res-url').value,
                    thumbnail: document.getElementById('res-thumbnail').value || '',
                    description: document.getElementById('res-description').value,
                    tags: document.getElementById('res-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
                    category: document.getElementById('res-category').value,
                    createdBy: auth.currentUser.email,
                    createdAt: serverTimestamp()
                };
            } else {
                collectionName = 'courses';
                data = {
                    course_name: document.getElementById('course-name').value,
                    course_category: document.getElementById('course-category').value,
                    course_duration: document.getElementById('course-duration').value,
                    course_id: document.getElementById('course-id').value || ('C-' + Date.now()),
                    course_image: document.getElementById('course-image').value || '',
                    course_price: parseFloat(document.getElementById('course-price').value) || 0,
                    course_description: document.getElementById('course-description').value,
                    lesson: document.getElementById('course-lesson').value,
                    instructor_name: instructorNameInput.value,
                    instructor_id: auth.currentUser.uid,
                    createdAt: serverTimestamp()
                };
            }

            // Add to Firestore
            await addDoc(collection(db, collectionName), data);
            
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`);
            
            // Reset form
            if (type === 'resource') resourceForm.reset();
            else courseForm.reset();
            
            if (instructorNameInput && currentUserData) {
                const fullName = `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim() || auth.currentUser.displayName || 'Mentor';
                instructorNameInput.value = fullName;
            }

        } catch (error) {
            console.error(`Error adding ${type}:`, error);
            alert(`Failed to add ${type}. Check console for details.`);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}
