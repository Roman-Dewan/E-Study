import { auth, db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let allResources = [];
let selectedMedium = "";
let currentUser = null;

const overlay = document.getElementById('resourceBrowseModalOverlay');
const closeBtn = document.getElementById('closeResourceBrowseModal');
const mediumTabsWrap = document.getElementById('rbMediumTabs');
const classesGrid = document.getElementById('rbClassesGrid');

// --- INITIALIZATION ---

onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

export async function fetchResourceCategories() {
    if (allResources.length > 0) return;

    try {
        classesGrid.innerHTML = `
            <div class="rb-loading">
                <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                <p>Browsing library...</p>
            </div>
        `;

        const querySnapshot = await getDocs(collection(db, "Resources"));
        allResources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (allResources.length === 0) {
            classesGrid.innerHTML = '<p>No resources found.</p>';
            return;
        }

        const mediums = [...new Set(allResources.map(r => r.medium).filter(Boolean))].sort();
        if (mediums.length > 0) {
            selectedMedium = mediums[0];
            renderMediumTabs(mediums);
            renderClasses();
        }
    } catch (error) {
        console.error("Error fetching resource categories:", error);
        classesGrid.innerHTML = '<p>Error loading categories.</p>';
    }
}

function renderMediumTabs(mediumList) {
    if (!mediumTabsWrap) return;
    mediumTabsWrap.innerHTML = '';
    mediumList.forEach(m => {
        const btn = document.createElement('button');
        btn.className = `rb-tab ${m === selectedMedium ? 'active' : ''}`;
        btn.textContent = m;
        btn.onclick = () => {
            document.querySelectorAll('.rb-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedMedium = m;
            renderClasses();
        };
        mediumTabsWrap.appendChild(btn);
    });
}

function renderClasses() {
    if (!classesGrid) return;
    classesGrid.innerHTML = '';

    const classMap = new Map();
    allResources
        .filter(r => r.medium === selectedMedium)
        .forEach(r => {
            if (r.class_id && r.class_name) {
                classMap.set(r.class_id, r.class_name);
            }
        });

    const uniqueClasses = Array.from(classMap.entries()).sort((a, b) => {
        const numA = parseInt(a[1].match(/\d+/));
        const numB = parseInt(b[1].match(/\d+/));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a[1].localeCompare(b[1]);
    });

    uniqueClasses.forEach(([id, name]) => {
        const card = document.createElement('div');
        card.className = 'rb-class-card';
        card.innerHTML = `<span>${name}</span> <i class="fa-solid fa-chevron-right"></i>`;
        card.onclick = () => handleClassClick(id, name);
        classesGrid.appendChild(card);
    });
}

function handleClassClick(classId, className) {
    if (currentUser) {
        // If logged in, go to the full resources page with selection
        // We can pass params if needed, or just go to the page
        window.location.href = `pages/resources/resources.html?class=${encodeURIComponent(className)}`;
    } else {
        // If not logged in, redirect to login as requested
        window.location.href = 'features/auth/login.html';
    }
}

// --- MODAL UTILS ---

export function openResourceBrowseModal() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    fetchResourceCategories();
}

function closeResourceBrowseModalFunc() {
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

if (overlay) {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeResourceBrowseModalFunc();
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeResourceBrowseModalFunc);
}

document.addEventListener('open-resource-browse-modal', openResourceBrowseModal);
