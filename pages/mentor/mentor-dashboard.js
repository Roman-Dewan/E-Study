import { auth, db } from '../../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, collection, serverTimestamp, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    initMentorDashboard();
});

async function initMentorDashboard() {
    const tabs = document.querySelectorAll('.mentor-tab');
    const forms = document.querySelectorAll('.mentor-form');
    const confirmBtn = document.getElementById('confirm-btn');
    const courseIdInput = document.getElementById('course-id');
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
        if (!auth.currentUser || !currentUserData) {
            alert("User data not loaded yet. Please wait.");
            return;
        }

        const btn = document.getElementById('confirm-btn');
        const originalText = btn.textContent;

        try {
            btn.textContent = 'Processing...';
            btn.disabled = true;

            let data = {};
            let collectionName = '';
            let docId = '';

            const instructorId = currentUserData.instructor_id || "0000";

            if (type === 'resource') {
                collectionName = 'Resources';

                // Format ID: instructor_id-dd-mm-yyyy
                const now = new Date();
                const day = String(now.getDate()).padStart(2, '0');
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const year = now.getFullYear();
                const baseId = `${instructorId}-${day}-${month}-${year}`;

                // Handle potential duplicates on the same day
                docId = baseId;
                let counter = 1;
                while (true) {
                    const checkDoc = await getDoc(doc(db, "Resources", docId));
                    if (!checkDoc.exists()) break;
                    docId = `${baseId}-${counter}`;
                    counter++;
                    if (counter > 100) break; // Safety break
                }

                const classSelect = document.getElementById('res-class-name');
                const subjectSelect = document.getElementById('res-subject-name');
                const instructorName = `${currentUserData.first_name || ''} ${currentUserData.last_name || ''}`.trim() || auth.currentUser.displayName || 'Mentor';

                // Helper to extract or normalize YouTube URLs
                function processUrl(input) {
                    let url = input.trim();
                    
                    // 1. Check if it's an iframe code
                    if (url.includes('<iframe')) {
                        const srcMatch = url.match(/src=["'](.*?)["']/);
                        if (srcMatch && srcMatch[1]) {
                            url = srcMatch[1];
                        }
                    }
                    
                    // 2. Normalize YouTube URLs to embed format
                    if (url.includes('youtube.com/watch?v=')) {
                        url = url.replace('watch?v=', 'embed/');
                        // Remove other params if present
                        url = url.split('&')[0];
                    } else if (url.includes('youtu.be/')) {
                        url = url.replace('youtu.be/', 'youtube.com/embed/');
                        // Remove params
                        url = url.split('?')[0];
                    }
                    
                    return url;
                }

                const rawUrl = document.getElementById('res-url').value;
                const processedUrl = processUrl(rawUrl);
                const thumbnailInput = document.getElementById('res-thumbnail');

                data = {
                    title: document.getElementById('res-title').value,
                    type: document.getElementById('res-type').value,
                    url: processedUrl,
                    thumbnail: thumbnailInput ? thumbnailInput.value.trim() : '',
                    description: document.getElementById('res-description').value,
                    class_id: classSelect.value,
                    class_name: classSelect.options[classSelect.selectedIndex].text,
                    subject_id: subjectSelect.value,
                    subject_name: subjectSelect.options[subjectSelect.selectedIndex].text,
                    tags: document.getElementById('res-tags').value,
                    category: document.getElementById('res-category').value,
                    medium: document.getElementById('res-medium').value,
                    instrcutor_name: instructorName,
                    instructor_id: instructorId,
                    createdBy: auth.currentUser.email,
                    createdAt: serverTimestamp()
                };
            } else {
                collectionName = 'courses';

                // Generate Sequential Course ID (c-0001, c-0002...)
                const coursesRef = collection(db, "courses");
                const q = query(coursesRef, orderBy("course_id", "desc"), limit(1));
                const querySnapshot = await getDocs(q);

                let nextCourseNum = 1;
                if (!querySnapshot.empty) {
                    const lastCourseId = querySnapshot.docs[0].data().course_id || "c-0000";
                    const lastNum = parseInt(lastCourseId.replace('c-', '')) || 0;
                    nextCourseNum = lastNum + 1;
                }

                docId = `c-${String(nextCourseNum).padStart(4, '0')}`;

                const courseImageInput = document.getElementById('course-image');

                data = {
                    course_name: document.getElementById('course-name').value,
                    course_category: document.getElementById('course-category').value,
                    course_duration: document.getElementById('course-duration').value,
                    course_id: docId,
                    course_image: courseImageInput ? courseImageInput.value.trim() : '',
                    course_price: parseFloat(document.getElementById('course-price').value) || 0,
                    course_description: document.getElementById('course-description').value,
                    lesson: document.getElementById('course-lesson').value,
                    instructor_name: instructorNameInput.value,
                    instructor_id: instructorId,
                    createdAt: serverTimestamp()
                };
            }

            // Save to Firestore
            await setDoc(doc(db, collectionName, docId), data);

            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully! ID: ${docId}`);

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
