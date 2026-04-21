import { auth, db } from '../../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- DATA CONSTANTS ---
const initialClassesData = {
    "Bangla Medium": ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "University Admission"],
    "English Version": ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "University Admission"],
    "English Medium": ["Level 6", "Level 7", "Level 8", "Level 9", "O Level", "A Level"],
    "Madrasa Medium": ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"],
    "Skill Development": ["Web Development", "Graphic Design", "Digital Marketing", "Video Editing", "Python Programming"]
};

// Map display names to Firestore IDs where applicable
const classIdMap = {
    "Class 6": "class_6", "Class 7": "class_7", "Class 8": "class_8", "Class 9": "class_9", "Class 10": "class_10"
};

const standardSubjects = [
    { id: "bn", name: "Bangla" },
    { id: "en", name: "English" },
    { id: "math", name: "Mathematics" },
    { id: "rel", name: "Religion" },
    { id: "sci", name: "Science" }
];

// --- STATE ---
let currentMedium = "Bangla Medium";
let currentCategory = "Academic"; // Default category
let selectedClass = null;
let selectedSubject = null;
let allResources = []; // For local searching
let classesData = { ...initialClassesData };

// --- DOM ELEMENTS ---
const classesList = document.getElementById('classesList');
const subjectsList = document.getElementById('subjectsList');
const resourcesGrid = document.getElementById('resourcesGrid');
const displayTitle = document.getElementById('displayTitle');
const resSearch = document.getElementById('resSearch');

const videoOverlay = document.getElementById('videoOverlay');
const videoIframe = document.getElementById('videoIframe');
const videoTitle = document.getElementById('videoTitle');
const videoDesc = document.getElementById('videoDesc');
const closeVideoBtn = document.getElementById('closeVideo');

const popModal = document.getElementById('popModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBodyGrid');
const closeModalBtn = document.querySelector('.close-modal');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    renderClasses();
    setupEventListeners();
}

function setupEventListeners() {
    // Video Overlay Close
    closeVideoBtn.addEventListener('click', closeVideo);
    videoOverlay.addEventListener('click', (e) => {
        if (e.target === videoOverlay || e.target.classList.contains('overlay-backdrop')) {
            closeVideo();
        }
    });

    // Search
    resSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        filterResources(term);
    });
}

// --- RENDERING LOGIC ---

function renderClasses() {
    classesList.innerHTML = '';
    const list = classesData["Bangla Medium"] || [];
    
    list.forEach(cls => {
        const btn = document.createElement('button');
        btn.className = 'list-item';
        btn.innerHTML = `<span>${cls}</span> <i class="fa-solid fa-chevron-right"></i>`;
        
        if (selectedClass === cls) btn.classList.add('active');
        
        btn.onclick = () => {
            selectedClass = cls;
            document.querySelectorAll('.classes-column .list-item').forEach(i => i.classList.remove('active'));
            btn.classList.add('active');
            renderSubjects();
        };
        
        classesList.appendChild(btn);
    });
}

function renderSubjects() {
    subjectsList.innerHTML = '';
    selectedSubject = null;
    renderEmptyResources("Select a subject to view resources");

    standardSubjects.forEach(sub => {
        const btn = document.createElement('button');
        btn.className = 'list-item';
        btn.innerHTML = `<span>${sub.name}</span> <i class="fa-solid fa-chevron-right"></i>`;
        
        btn.onclick = () => {
            selectedSubject = sub;
            document.querySelectorAll('.subjects-column .list-item').forEach(i => i.classList.remove('active'));
            btn.classList.add('active');
            fetchResources();
        };
        
        subjectsList.appendChild(btn);
    });
}

async function fetchResources() {
    if (!selectedClass || !selectedSubject) return;

    displayTitle.textContent = `${selectedClass} - ${selectedSubject.name}`;
    resourcesGrid.innerHTML = '<div class="empty-state-large"><i class="fa-solid fa-spinner fa-spin"></i><p>Loading resources...</p></div>';

    try {
        const firestoreClassId = classIdMap[selectedClass] || selectedClass.toLowerCase().replace(/\s+/g, '_');
        const firestoreSubId = selectedSubject.id;

        const q = query(
            collection(db, "Resources"),
            where("category", "==", currentCategory),
            where("class_id", "==", firestoreClassId),
            where("subject_id", "==", firestoreSubId)
        );

        const querySnapshot = await getDocs(q);
        allResources = [];
        
        querySnapshot.forEach((doc) => {
            allResources.push({ id: doc.id, ...doc.data() });
        });

        // Manual sort by createdAt desc if index is missing
        allResources.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });

        renderResourceGrid(allResources);
    } catch (error) {
        console.error("DEBUG: Firebase Query Failed:", error);
        resourcesGrid.innerHTML = `
            <div class="empty-state-large">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>Failed to load resources. Error: ${error.message}</p>
            </div>`;
    }
}

function renderResourceGrid(resources) {
    if (resources.length === 0) {
        resourcesGrid.innerHTML = `
            <div class="empty-state-large">
                <i class="fa-solid fa-box-open"></i>
                <p>No resources found for this selection.</p>
            </div>`;
        return;
    }

    resourcesGrid.innerHTML = '';
    resources.forEach(res => {
        const card = document.createElement('div');
        card.className = 'resource-card';
        
        // Use provided thumbnail or high-quality YouTube thumbnail
        let thumbUrl = res.thumbnail;
        if (!thumbUrl && res.url.includes('youtube.com/embed/')) {
            const videoId = res.url.split('embed/')[1]?.split('?')[0];
            thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }

        card.innerHTML = `
            <div class="res-card-image">
                <img src="${thumbUrl || '../../assets/images/placeholder-video.jpg'}" onerror="this.src='../../assets/images/placeholder-video.jpg'" alt="${res.title}">
                <div class="play-overlay">
                    <i class="fa-solid fa-circle-play"></i>
                </div>
            </div>
            <div class="res-card-content">
                <h4 class="res-card-title">${res.title}</h4>
                <p class="res-card-desc">${res.description || 'No description provided.'}</p>
                <div class="res-card-footer">
                    <span class="instructor-tag"><i class="fa-solid fa-user-tie"></i> ${res.instrcutor_name || 'Instructor'}</span>
                </div>
            </div>
        `;
        
        card.onclick = () => openVideo(res);
        resourcesGrid.appendChild(card);
    });
}

function filterResources(term) {
    const filtered = allResources.filter(res => 
        res.title.toLowerCase().includes(term) || 
        (res.description && res.description.toLowerCase().includes(term))
    );
    renderResourceGrid(filtered);
}

function renderEmptyResources(msg) {
    displayTitle.textContent = "Resources";
    resourcesGrid.innerHTML = `
        <div class="empty-state-large">
            <i class="fa-solid fa-graduation-cap"></i>
            <p>${msg}</p>
        </div>`;
}

// --- VIDEO OVERLAY LOGIC ---

function openVideo(resource) {
    let url = resource.url;
    // Ensure autoplay is added
    if (url.includes('?')) {
        url += '&autoplay=1';
    } else {
        url += '?autoplay=1';
    }

    videoIframe.src = url;
    videoTitle.textContent = resource.title;
    videoDesc.textContent = resource.description || "";
    videoOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeVideo() {
    videoOverlay.classList.remove('active');
    videoIframe.src = ''; // Stop video
    document.body.style.overflow = 'auto';
}
