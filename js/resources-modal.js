import { db } from './firebase-config.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const resourceOverlay = document.getElementById('resourceFrontModalOverlay');
const resourceContent = document.getElementById('resourceFrontContent');
const closeBtn = document.getElementById('closeResourceFrontModal');

export function openResourceFrontModal(resourceId) {
    if (!resourceOverlay) return;
    resourceOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    fetchResourceDetails(resourceId);
}

async function fetchResourceDetails(resourceId) {
    try {
        const resourceDoc = await getDoc(doc(db, "Resources", resourceId));
        if (resourceDoc.exists()) {
            renderResourceFront(resourceDoc.data());
        }
    } catch (error) {
        console.error("Error fetching resource:", error);
    }
}

function renderResourceFront(data) {
    resourceContent.innerHTML = `
        <div class="resource-front-view">
            <div class="resource-img-main" style="background: linear-gradient(135deg, #41D185 0%, #36C690 100%);">
                <i class="fa-solid fa-file-pdf"></i>
            </div>
            <div class="resource-details-main">
                <div class="res-tag">${data.medium || 'Academic'} • ${data.class_name || 'General'}</div>
                <h2 class="res-title">${data.title}</h2>
                <div class="res-meta-row">
                    <span><i class="fa-solid fa-book-open"></i> ${data.subject_name || 'Subject'}</span>
                    <span><i class="fa-solid fa-clock"></i> Updated 2024</span>
                </div>
                <p class="res-desc">${data.description || 'Access comprehensive learning materials, notes, and guides designed to help you master this subject with ease.'}</p>
                
                <div class="res-stats-grid">
                    <div class="res-stat">
                        <span class="stat-v">1.2k</span>
                        <span class="stat-l">Downloads</span>
                    </div>
                    <div class="res-stat">
                        <span class="stat-v">4.8</span>
                        <span class="stat-l">Rating</span>
                    </div>
                    <div class="res-stat">
                        <span class="stat-v">Free</span>
                        <span class="stat-l">Access</span>
                    </div>
                </div>

                <div class="res-modal-actions">
                    <button class="btn-primary-res" onclick="window.location.href='pages/resources/resources.html'">Access Full Resource</button>
                </div>
            </div>
        </div>
    `;
}

function closeResourceFrontModalFunc() {
    if (resourceOverlay) {
        resourceOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeResourceFrontModalFunc);
}

if (resourceOverlay) {
    resourceOverlay.addEventListener('click', (e) => {
        if (e.target === resourceOverlay) closeResourceFrontModalFunc();
    });
}

// Global exposure
window.openResourceFrontModal = openResourceFrontModal;
