import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { courses } from '../pages/courses/courses.js';
import { updateDailyStat, startTimeTracking } from './tracker.js';

// ── SETUP & AUTH ──
// Logout handler
document.addEventListener('estudy-logout', async () => {
    try { await signOut(auth); window.location.href = '../index.html'; }
    catch (e) { console.error(e); }
});

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '../index.html'; return; }
    
    // Initialize Tracker & Common UI
    startTimeTracking();
    loadCourseDetails();

    // Fetch profile
    try {
        const snap = await getDoc(doc(db, 'E-study', user.email));
        if (snap.exists()) {
            const data = snap.data();
            const nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.textContent = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User';
            
            const avatarEl = document.getElementById('user-avatar');
            if (avatarEl) avatarEl.textContent = (data.first_name || 'U').charAt(0).toUpperCase();
        }
    } catch (err) {
        console.error("Error fetching profile:", err);
    }
});

// ── DYNAMIC CONTENT LOADING ──
function loadCourseDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = parseInt(urlParams.get('id')) || 0;
    const course = courses[courseId] || courses[0];

    // Update Text
    if (document.getElementById('courseTitle')) document.getElementById('courseTitle').textContent = course.title;
    if (document.getElementById('courseInstructor')) document.getElementById('courseInstructor').textContent = course.instructor;
    if (document.getElementById('videoBannerTitle')) {
        document.getElementById('videoBannerTitle').innerHTML = course.title.toUpperCase().replace(/ /g, '<br>');
    }
    
    // Stats
    const statsProgress = document.getElementById('statsProgress');
    const statsComplete = document.getElementById('statsComplete');
    if (statsProgress) statsProgress.textContent = String(course.lessons - (course.status === 'completed' ? 0 : 5)).padStart(2, '0');
    if (statsComplete) statsComplete.textContent = course.status === 'completed' ? String(course.lessons).padStart(2, '0') : '00';

    renderModules(course);
}

function renderModules(course) {
    const list = document.getElementById('moduleList');
    if (!list) return;
    
    // Static modules for demo; usually these would come from courses.js or Firestore
    const modules = [
        { 
            title: "Module 1 - Introduction", 
            lessons: ["Course Overview", "Setting Expectations", "Tools for Success"] 
        },
        { 
            title: "Module 2 - Core Concepts", 
            lessons: ["Understanding the Ecosystem", "Basic Principles", "First Hands-on Project"] 
        },
        { 
            title: "Module 3 - Advanced Strategy", 
            lessons: ["Optimization Techniques", "Data Analysis", "Scaling Your Results"] 
        }
    ];

    list.innerHTML = modules.map((m, mIdx) => `
        <div class="module-group">
            <div class="module-header" style="padding: 12px 14px; font-weight: 700; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">${m.title}</div>
            ${m.lessons.map((l, lIdx) => `
                <div class="module-item ${mIdx === 0 && lIdx === 0 ? 'active' : ''}" data-lesson="${l}">
                    <div class="module-title">${l}</div>
                    <div class="module-meta">
                        <i class="fa-regular ${mIdx === 0 && lIdx === 0 ? 'fa-circle-play' : 'fa-circle'} check-icon"></i>
                        <span class="dot"></span>
                        10:00
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');

    // Module Click Events
    document.querySelectorAll('.module-item').forEach(item => {
        item.addEventListener('click', async () => {
            // Remove active from others
            document.querySelectorAll('.module-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const icon = item.querySelector('.check-icon');
            if (icon && !item.classList.contains('done')) {
                icon.className = 'fa-solid fa-circle-check check-icon';
                icon.style.color = 'var(--green)';
                item.classList.add('done');
                
                // Track progress
                await updateDailyStat({ lessons: 1, tasks: 1 });
            }
        });
    });
}

// ── SEARCH IN SIDEBAR ──
const lectureSearch = document.getElementById('lectureSearch');
if (lectureSearch) {
    lectureSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.module-item').forEach(item => {
            const text = item.querySelector('.module-title').textContent.toLowerCase();
            item.style.display = text.includes(term) ? 'block' : 'none';
        });
    });
}

// ── TABS FUNCTIONALITY ──
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-target');
        
        // Toggle Active Tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Toggle Active Pane
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
            if (pane.id === targetId) pane.classList.add('active');
        });
    });
});

// ── FAQ ACCORDION ──
document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
        const item = q.parentElement;
        const toggle = q.querySelector('.faq-toggle');
        const isOpen = item.classList.contains('open');

        // Close all
        document.querySelectorAll('.faq-item').forEach(i => {
            i.classList.remove('open');
            const bt = i.querySelector('.faq-toggle');
            if (bt) { bt.textContent = '+'; bt.className = 'faq-toggle plus'; }
        });

        // Toggle this
        if (!isOpen) {
            item.classList.add('open');
            if (toggle) { toggle.textContent = '−'; toggle.className = 'faq-toggle minus'; }
        }
    });
});

// ── VIDEO TOOLS ──

// PANELS (Settings, Notification)
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const settingsClose = document.getElementById('settingsClose');
if(settingsBtn && settingsPanel) settingsBtn.addEventListener('click', () => settingsPanel.classList.toggle('open'));
if(settingsClose && settingsPanel) settingsClose.addEventListener('click', () => settingsPanel.classList.remove('open'));

const notifBell = document.getElementById('notif-bell');
const notifPanel = document.getElementById('notificationPanel');
const notifClose = document.getElementById('notif-close');
if(notifBell && notifPanel) notifBell.addEventListener('click', () => notifPanel.classList.toggle('open'));
if(notifClose && notifPanel) notifClose.addEventListener('click', () => notifPanel.classList.remove('open'));

// Speed / Quality Highlighting
document.querySelectorAll('.speed-btn, .quality-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const group = btn.classList.contains('speed-btn') ? '.speed-btn' : '.quality-btn';
        document.querySelectorAll(group).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// FULLSCREEN
const fullscreenBtn = document.getElementById('fullscreenBtn');
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        const player = document.querySelector('.video-player');
        if (!document.fullscreenElement) {
            player.requestFullscreen?.() || player.webkitRequestFullscreen?.() || player.msRequestFullscreen?.();
        } else {
            document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.msExitFullscreen?.();
        }
    });
}

// MINIMIZE (Mini Player Toggle / PiP Simulation)
const minimizeBtn = document.getElementById('minimizeBtn');
if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
        const player = document.querySelector('.video-player');
        player.classList.toggle('mini-player');
        
        // If it was a real video tag, we would use:
        // video.requestPictureInPicture();
    });
}

// LIKE
const likeBtn = document.getElementById('likeBtn');
if (likeBtn) {
    likeBtn.addEventListener('click', () => {
        likeBtn.classList.toggle('active');
        if (likeBtn.classList.contains('active')) {
            likeBtn.style.color = '#ef4444';
            likeBtn.style.transform = 'scale(1.2)';
        } else {
            likeBtn.style.color = '';
            likeBtn.style.transform = 'scale(1)';
        }
    });
}

// ── VIDEO PLAYER SIMULATION ──
const playPauseBtn = document.getElementById('playPauseBtn');
const playBtnLarge = document.getElementById('playBtnLarge');
const timeFill = document.getElementById('timeFill');
const currentTimeLabel = document.getElementById('currentTime');
const videoThumbnail = document.getElementById('videoThumbnail');

let isPlaying = false;
let progress = 0;
let videoInterval;

function togglePlay() {
    isPlaying = !isPlaying;
    if (playPauseBtn) playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
    if (videoThumbnail) videoThumbnail.style.opacity = isPlaying ? '0.2' : '1';
    
    if (isPlaying) {
        videoInterval = setInterval(() => {
            progress += 0.2;
            if (progress > 100) progress = 0;
            if (timeFill) timeFill.style.width = progress + '%';
            
            // Format Time
            if (currentTimeLabel) {
                const totalSec = Math.floor((progress / 100) * 3600);
                const hrs = Math.floor(totalSec / 3600);
                const mins = Math.floor((totalSec % 3600) / 60);
                const secs = totalSec % 60;
                currentTimeLabel.textContent = `${hrs > 0 ? hrs + ':' : ''}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            }
        }, 1000);
    } else {
        clearInterval(videoInterval);
    }
}

if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlay);
if (playBtnLarge) playBtnLarge.addEventListener('click', togglePlay);

// ── NOTES & REVIEWS ──
const saveNotesBtn = document.getElementById('saveNotesBtn');
if (saveNotesBtn) {
    saveNotesBtn.addEventListener('click', () => {
        const area = document.getElementById('notesArea');
        if (area && area.value.trim()) {
            alert("✅ Notes saved successfully!");
            area.value = "";
        }
    });
}

const submitReviewBtn = document.getElementById('submitReviewBtn');
if (submitReviewBtn) {
    submitReviewBtn.addEventListener('click', () => {
        const area = document.getElementById('reviewText');
        if (area && area.value.trim()) {
            alert("⭐ Thank you for your review!");
            area.value = "";
        }
    });
}