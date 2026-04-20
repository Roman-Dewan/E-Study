import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Reusable Sidebar Loader for E-Study
 * Manages fetching, injecting, active state, and relative paths.
 */

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
});

async function initSidebar() {
    const placeholder = document.getElementById('sidebar-placeholder');
    if (!placeholder) return;

    const rootPath = calculateRootPath();
    
    try {
        const response = await fetch(`${rootPath}components/sidebar.html`);
        if (!response.ok) throw new Error('Failed to fetch sidebar');
        
        let html = await response.text();
        placeholder.innerHTML = html.replace(/ROOT\//g, rootPath);
        
        highlightActiveLink();
        setupSidebarActions();
        setupGlobalHeader();
        
        // Listen for Auth changes after sidebar is loaded
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                await updateSidebarForUser(user.email);
            }
        });
        
    } catch (error) {
        console.error('Sidebar Loader Error:', error);
    }
}

async function updateSidebarForUser(email) {
    try {
        const userDocSnap = await getDoc(doc(db, "E-study", email));
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const role = userData.role || 'student';
            
            const mentorNavItem = document.getElementById('mentor-nav-item');
            const becomeMentorLink = document.getElementById('mentor-link');
            
            if (role === 'mentor') {
                if (mentorNavItem) mentorNavItem.style.display = 'flex';
                if (becomeMentorLink) becomeMentorLink.style.display = 'none'; // Already a mentor
            } else {
                if (mentorNavItem) mentorNavItem.style.display = 'none';
                if (becomeMentorLink) becomeMentorLink.style.display = 'flex';
            }
        }
    } catch (err) {
        console.error("Error updating sidebar for user:", err);
    }
}

function calculateRootPath() {
    const path = window.location.pathname;
    if (path.includes('/pages/')) {
        return '../../';
    }
    return './';
}

function highlightActiveLink() {
    const currentPath = window.location.pathname.toLowerCase();
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        const page = item.getAttribute('data-page');
        if (!href) return;
        
        const parts = href.split('/');
        const filename = parts[parts.length - 1].split('.')[0].toLowerCase();
        
        if ((page && currentPath.includes(page)) || currentPath.includes(filename)) {
            item.classList.add('active');
        }
    });
}

function setupSidebarActions() {
    // Logout handling
    const logoutBtn = document.getElementById('logout-link');
    const logoutDropdownBtns = document.querySelectorAll('.logout-action');
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
    const logoutModalClose = document.getElementById('logout-modal-close');

    function openLogoutModal(e) {
        e.preventDefault();
        if (logoutModal) logoutModal.classList.add('active');
    }

    if (logoutBtn) logoutBtn.addEventListener('click', openLogoutModal);
    logoutDropdownBtns.forEach(btn => btn.addEventListener('click', openLogoutModal));

    if (logoutModal) {
        cancelLogoutBtn?.addEventListener('click', () => logoutModal.classList.remove('active'));
        logoutModalClose?.addEventListener('click', () => logoutModal.classList.remove('active'));

        confirmLogoutBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            const event = new CustomEvent('estudy-logout', { 
                bubbles: true, 
                detail: { originalEvent: e } 
            });
            document.dispatchEvent(event);
        });
    }

    // --- MODAL HANDLERS ---

    // 1. Invite Friend Modal
    const inviteBtn = document.getElementById('invite-friend-link');
    const inviteModal = document.getElementById('invite-modal');
    const inviteCloseBtn = document.getElementById('modal-close');
    const copyBtn = document.getElementById('copy-btn');
    const shareUrl = document.getElementById('share-url');
    const inviteToast = document.getElementById('copy-toast');

    if (inviteBtn && inviteModal) {
        if (shareUrl) {
            shareUrl.value = window.location.origin + "/invite/roman-dewan";
        }

        inviteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            inviteModal.classList.add('active');
        });

        inviteCloseBtn?.addEventListener('click', () => {
            inviteModal.classList.remove('active');
        });

        copyBtn?.addEventListener('click', () => {
            shareUrl.select();
            navigator.clipboard.writeText(shareUrl.value).then(() => {
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied</span>';
                copyBtn.classList.add('copied');
                inviteToast?.classList.add('show');

                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> <span>Copy</span>';
                    copyBtn.classList.remove('copied');
                    inviteToast?.classList.remove('show');
                }, 2000);
            });
        });
    }

    // 2. Become a Mentor Modal & Form Handling
    const mentorBtn = document.getElementById('mentor-link');
    const mentorModal = document.getElementById('mentor-modal');
    const mentorCloseBtn = document.getElementById('mentor-modal-close');
    const mentorForm = document.getElementById('mentor-registration-form');

    if (mentorBtn && mentorModal) {
        mentorBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Pre-fill user data if available
            if (auth.currentUser) {
                const emailInput = document.getElementById('mentor-email');
                const nameInput = document.getElementById('mentor-name');
                
                if (emailInput) emailInput.value = auth.currentUser.email;
                
                // If name is not yet set in input and we can get it from Firestore
                if (nameInput && !nameInput.value) {
                    try {
                        const userDocSnap = await getDoc(doc(db, "E-study", auth.currentUser.email));
                        if (userDocSnap.exists()) {
                            const userData = userDocSnap.data();
                            const firstName = userData.first_name || '';
                            const lastName = userData.last_name || '';
                            nameInput.value = (firstName + ' ' + lastName).trim() || auth.currentUser.displayName || '';
                        }
                    } catch (err) {
                        console.log("Could not pre-fill name:", err);
                        if (auth.currentUser.displayName) nameInput.value = auth.currentUser.displayName;
                    }
                }
            }
            mentorModal.classList.add('active');
        });

        mentorCloseBtn?.addEventListener('click', () => {
            mentorModal.classList.remove('active');
        });

        mentorForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('mentor-confirm-btn');
            const originalText = btn.textContent;
            
            try {
                btn.textContent = 'Processing...';
                btn.disabled = true;

                const formData = {
                    role: 'mentor',
                    'personal_details.phone': document.getElementById('mentor-phone').value,
                    'personal_details.gender': mentorForm.querySelector('input[name="gender"]:checked').value,
                    'personal_details.city': document.getElementById('mentor-city').value,
                    'personal_details.location': document.getElementById('mentor-location').value
                };

                const userDocRef = doc(db, "E-study", auth.currentUser.email);
                await updateDoc(userDocRef, formData);

                mentorModal.classList.remove('active');
                alert('Congratulations! You are now a mentor.');
                
                // Refresh sidebar UI
                await updateSidebarForUser(auth.currentUser.email);
                
            } catch (error) {
                console.error("Mentor Registration Error:", error);
                alert('Failed to register as mentor. Please try again.');
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }


    // 3. Support Modal
    const supportBtn = document.getElementById('support-link');
    const supportModal = document.getElementById('support-modal');
    const supportCloseBtn = document.getElementById('support-modal-close');
    const supportForm = document.getElementById('support-form');

    if (supportBtn && supportModal) {
        supportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            supportModal.classList.add('active');
        });

        supportCloseBtn?.addEventListener('click', () => {
            supportModal.classList.remove('active');
        });

        supportForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const subject = document.getElementById('support-subject')?.value;
            const message = document.getElementById('support-message')?.value;

            if (!subject || !message?.trim()) {
                alert('Please fill in all fields.');
                return;
            }

            supportModal.classList.remove('active');
            alert('Your support request has been sent! We\'ll get back to you soon.');
            supportForm.reset();
        });
    }

    // Global click-to-close for all modals
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
        }
    });
}

function setupGlobalHeader() {
    const toggle = document.getElementById('user-dropdown-toggle');
    const menu = document.getElementById('user-dropdown-menu');

    if (toggle && menu) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.remove('show');
            }
        });
    }

    const notifBtn = document.getElementById('notification-btn');
    const notifModal = document.getElementById('notification-modal');
    const notifClose = document.getElementById('notification-modal-close');

    if (notifBtn && notifModal) {
        notifBtn.addEventListener('click', (e) => {
            e.preventDefault();
            notifModal.classList.add('active');
        });
        notifClose?.addEventListener('click', () => {
            notifModal.classList.remove('active');
        });
    }
}

