import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
            
            if (!auth.currentUser) {
                alert('You must be logged in to register.');
                return;
            }

            try {
                btn.textContent = 'Processing...';
                btn.disabled = true;

                // 1. Generate Instructor ID (Sequential if possible, fallback to Timestamp)
                let nextId = "0001";
                try {
                    const mentorsQuery = query(
                        collection(db, "E-study"),
                        where("role", "==", "mentor"),
                        orderBy("instructor_id", "desc"),
                        limit(1)
                    );
                    
                    const querySnapshot = await getDocs(mentorsQuery);
                    if (!querySnapshot.empty) {
                        const lastMentor = querySnapshot.docs[0].data();
                        if (lastMentor.instructor_id) {
                            const lastIdNum = parseInt(lastMentor.instructor_id);
                            if (!isNaN(lastIdNum)) {
                                nextId = String(lastIdNum + 1).padStart(4, '0');
                            }
                        }
                    }
                } catch (queryErr) {
                    console.warn("Could not fetch last mentor ID (possibly missing index):", queryErr);
                    // Fallback to a timestamp-based ID to ensure registration proceeds
                    nextId = "M" + Date.now().toString().slice(-4); 
                }

                // 2. Prepare Update Data
                const updateData = {
                    role: 'mentor',
                    instructor_id: nextId,
                    'personal_details.phone': document.getElementById('mentor-phone').value,
                    'personal_details.gender': mentorForm.querySelector('input[name="gender"]:checked').value,
                    'personal_details.city': document.getElementById('mentor-city').value,
                    'personal_details.location': document.getElementById('mentor-location').value
                };

                // 3. Update User Document
                const userDocRef = doc(db, "E-study", auth.currentUser.email);
                
                await updateDoc(userDocRef, updateData);

                mentorModal.classList.remove('active');
                alert('Congratulations! You are now a mentor. Your Instructor ID is: ' + nextId);
                
                // Refresh sidebar UI
                await updateSidebarForUser(auth.currentUser.email);
                
            } catch (error) {
                console.error("Mentor Registration Error:", error);
                
                if (error.code === 'not-found') {
                    alert('User profile not found. Please contact support.');
                } else {
                    alert('Failed to register as mentor: ' + (error.message || 'Please try again.'));
                }
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }


    // 3. Change Password Modal
    const passwordModal = document.getElementById('password-modal');
    const passwordCloseBtn = document.getElementById('password-modal-close');
    const passwordForm = document.getElementById('change-password-form');
    const passwordError = document.getElementById('password-error');

    if (passwordModal) {
        passwordCloseBtn?.addEventListener('click', () => {
            passwordModal.classList.remove('active');
            passwordForm?.reset();
            if (passwordError) passwordError.style.display = 'none';
        });

        passwordForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-new-password').value;
            const btn = document.getElementById('password-confirm-btn');
            
            if (newPassword !== confirmPassword) {
                if (passwordError) {
                    passwordError.textContent = "New passwords do not match!";
                    passwordError.style.display = 'block';
                }
                return;
            }

            if (!auth.currentUser) {
                alert('You must be logged in to change your password.');
                return;
            }

            try {
                btn.textContent = 'Updating...';
                btn.disabled = true;
                if (passwordError) passwordError.style.display = 'none';

                // 1. Re-authenticate
                const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
                await reauthenticateWithCredential(auth.currentUser, credential);

                // 2. Update Password
                await updatePassword(auth.currentUser, newPassword);

                alert('Password updated successfully!');
                passwordModal.classList.remove('active');
                passwordForm.reset();
            } catch (error) {
                console.error("Change Password Error:", error);
                if (passwordError) {
                    let msg = "Failed to update password.";
                    if (error.code === 'auth/wrong-password') msg = "Incorrect current password.";
                    else if (error.code === 'auth/weak-password') msg = "New password is too weak.";
                    passwordError.textContent = msg;
                    passwordError.style.display = 'block';
                }
            } finally {
                btn.textContent = 'Update Password';
                btn.disabled = false;
            }
        });

        // Initialize Visibility Toggles
        const toggleButtons = passwordModal.querySelectorAll('.toggle-password-btn');
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = button.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
            });
        });
    }

    // 4. Support Modal
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
    const changePassDropdownBtns = document.querySelectorAll('.user-dropdown-menu .dropdown-item');
    changePassDropdownBtns.forEach(btn => {
        if (btn.textContent.includes('Change Password')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const menu = document.getElementById('user-dropdown-menu');
                if (menu) menu.classList.remove('show');
                const modal = document.getElementById('password-modal');
                if (modal) modal.classList.add('active');
            });
        }
    });

}

