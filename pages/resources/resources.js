import { auth, db } from '../../js/firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- STATE ---
let allResources = [];
let selectedMedium = "";
let selectedClassId = null;
let selectedClassName = null;
let selectedSubjectId = null;

// --- DOM ELEMENTS ---
const mediumTabs = document.getElementById('mediumTabs');
const classesGrid = document.getElementById('classesGrid');
const resourceModal = document.getElementById('resourceModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModal');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    setupEventListeners();
    await loadDynamicNavigation();
}

function setupEventListeners() {
    // Medium Tab Switching
    mediumTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('medium-tab')) {
            document.querySelectorAll('.medium-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            selectedMedium = e.target.dataset.medium;
            renderClasses();
        }
    });

    // Close Modal
    closeModalBtn.onclick = closeModal;
    resourceModal.onclick = (e) => {
        if (e.target === resourceModal) closeModal();
    };
}

// --- DATA LOADING ---

async function loadDynamicNavigation() {
    // Show spinner
    classesGrid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:80px; color:var(--primary-green);">
            <i class="fa-solid fa-spinner fa-spin fa-3x" style="margin-bottom:15px;"></i>
            <p style="font-weight:500;">Syncing Resources...</p>
        </div>
    `;

    try {
        const querySnapshot = await getDocs(collection(db, "Resources"));
        allResources = [];
        querySnapshot.forEach(doc => allResources.push({ id: doc.id, ...doc.data() }));

        if (allResources.length === 0) {
            classesGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:80px;"><p>No resources found in the database.</p></div>';
            return;
        }

        // Extract unique Mediums
        const mediums = [...new Set(allResources.map(r => r.medium).filter(Boolean))].sort();

        if (mediums.length > 0) {
            selectedMedium = mediums[0];
            renderMediumTabs(mediums);
            renderClasses();
        } else {
            classesGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:80px;"><p>Metadata missing in documents.</p></div>';
        }
    } catch (error) {
        console.error("Error loading dynamic navigation:", error);
        classesGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:80px; color:red;"><p>Failed to load data: ${error.message}</p></div>`;
    }
}

// --- RENDERING FUNCTIONS ---

function renderMediumTabs(mediumList) {
    mediumTabs.innerHTML = '';
    mediumList.forEach(m => {
        const btn = document.createElement('button');
        btn.className = `medium-tab ${m === selectedMedium ? 'active' : ''}`;
        btn.dataset.medium = m;
        btn.textContent = m;
        mediumTabs.appendChild(btn);
    });
}

function renderClasses() {
    classesGrid.innerHTML = '';

    // Get unique classes for the selected medium
    const classMap = new Map(); // id -> name
    allResources
        .filter(r => r.medium === selectedMedium)
        .forEach(r => {
            if (r.class_id && r.class_name) {
                classMap.set(r.class_id, r.class_name);
            }
        });

    // Dynamic numeric sorting
    const uniqueClasses = Array.from(classMap.entries()).sort((a, b) => {
        const numA = parseInt(a[1].match(/\d+/));
        const numB = parseInt(b[1].match(/\d+/));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a[1].localeCompare(b[1]);
    });

    if (uniqueClasses.length === 0) {
        classesGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:80px;"><p>No classes found for this medium.</p></div>';
        return;
    }

    uniqueClasses.forEach(([id, name]) => {
        const card = document.createElement('div');
        card.className = 'class-card';
        card.innerHTML = `<span>${name}</span> <i class="fa-solid fa-chevron-right"></i>`;
        card.onclick = () => showSubjectsModal(id, name);
        classesGrid.appendChild(card);
    });
}

function showSubjectsModal(classId, className) {
    selectedClassId = classId;
    selectedClassName = className;
    modalTitle.textContent = `Subjects for ${className}`;
    modalBody.innerHTML = '';

    // Get unique subjects for the selected class and medium
    const subjectMap = new Map(); // id -> name
    allResources
        .filter(r => r.medium === selectedMedium && r.class_id === classId)
        .forEach(r => {
            if (r.subject_id && r.subject_name) {
                subjectMap.set(r.subject_id, r.subject_name);
            }
        });

    const uniqueSubjects = Array.from(subjectMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));

    if (uniqueSubjects.length === 0) {
        modalBody.innerHTML = '<p style="text-align:center;">No subjects found for this selection.</p>';
        openModal();
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'modal-grid';

    uniqueSubjects.forEach(([id, name]) => {
        const btn = document.createElement('button');
        btn.className = 'modal-item-btn';
        btn.innerHTML = `<span>${name}</span> <i class="fa-solid fa-chevron-right"></i>`;
        btn.onclick = () => showChaptersModal(id, name);
        grid.appendChild(btn);
    });

    modalBody.appendChild(grid);
    openModal();
}

function showChaptersModal(subjectId, subjectName) {
    selectedSubjectId = subjectId;
    modalTitle.textContent = `Chapters for ${subjectName}`;
    modalBody.innerHTML = '';

    const chapters = allResources.filter(r =>
        r.medium === selectedMedium &&
        r.class_id === selectedClassId &&
        r.subject_id === subjectId
    ).sort((a, b) => a.title.localeCompare(b.title));

    if (chapters.length === 0) {
        modalBody.innerHTML = '<p style="text-align:center;">No chapters found.</p>';
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'modal-grid';

    chapters.forEach(chap => {
        const btn = document.createElement('button');
        btn.className = 'modal-item-btn';
        btn.innerHTML = `<span>${chap.title}</span> <i class="fa-solid fa-chevron-right"></i>`;
        btn.onclick = () => showVideoModal(chap, subjectName);
        grid.appendChild(btn);
    });

    modalBody.appendChild(grid);
}

function showVideoModal(chapter, subjectName) {
    modalTitle.textContent = `${chapter.title} - ${subjectName}`;
    modalBody.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'video-step-container';

    // Lecture Link Card
    const linkCard = document.createElement('div');
    linkCard.className = 'lecture-link-card';
    linkCard.innerHTML = `
        <i class="fa-solid fa-link"></i>
        <p>Lecture Link for ${chapter.title}</p>
        <div class="yt-link" id="playBtn">${chapter.url}</div>
    `;

    // Video Player Area
    const videoArea = document.createElement('div');
    videoArea.id = 'videoArea';
    videoArea.style.display = 'none';

    container.appendChild(linkCard);
    container.appendChild(videoArea);
    modalBody.appendChild(container);

    // Play button logic
    document.getElementById('playBtn').onclick = () => {
        let videoUrl = chapter.url;
        if (videoUrl.includes('watch?v=')) {
            videoUrl = videoUrl.replace('watch?v=', 'embed/').split('&')[0];
        } else if (videoUrl.includes('youtu.be/')) {
            videoUrl = videoUrl.replace('youtu.be/', 'youtube.com/embed/').split('?')[0];
        }

        videoUrl += (videoUrl.includes('?') ? '&' : '?') + 'autoplay=1';

        videoArea.innerHTML = `
            <div class="video-embed-wrapper">
                <iframe src="${videoUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        `;
        videoArea.style.display = 'block';
        linkCard.style.display = 'none';
    };
}

// --- MODAL UTILS ---

function openModal() {
    resourceModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    resourceModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    modalBody.innerHTML = '';
}
