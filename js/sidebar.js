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

    // Detect root path based on current location
    const rootPath = calculateRootPath();
    
    try {
        const response = await fetch(`${rootPath}components/sidebar.html`);
        if (!response.ok) throw new Error('Failed to fetch sidebar');
        
        let html = await response.text();
        
        // Inject with dynamic root paths
        placeholder.innerHTML = html.replace(/ROOT\//g, rootPath);
        
        // Highlight current page
        highlightActiveLink();
        
        // Initialize sidebar-specific features
        setupSidebarActions();
        
    } catch (error) {
        console.error('Sidebar Loader Error:', error);
    }
}

function calculateRootPath() {
    // Basic logic: check directory depth
    // Works for pages in /pages/folder/file.html (depth 2)
    // and pages at root (depth 0)
    const path = window.location.pathname;
    
    // If it contains /pages/, we need to go up 2 levels
    if (path.includes('/pages/')) {
        return '../../';
    }
    // If it's at root (index.html), we stay here
    return './';
}

function highlightActiveLink() {
    const currentPath = window.location.pathname.toLowerCase();
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        const page = item.getAttribute('data-page');
        if (!href) return;
        
        // Extract the filename/directory name from href
        // e.g., ROOT/pages/courses/courses.html -> courses
        const parts = href.split('/');
        const filename = parts[parts.length - 1].split('.')[0].toLowerCase();
        
        // Match if:
        // 1. The current pathname contains the data-page attribute (e.g., /courses/ matches data-page="courses")
        // 2. The current pathname contains the filename (e.g., /courses-detail.html matches courses.html)
        if ((page && currentPath.includes(page)) || currentPath.includes(filename)) {
            item.classList.add('active');
        }
    });
}

function setupSidebarActions() {
    // Logout handling
    const logoutBtn = document.getElementById('logout-link');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Dispatch a custom event so the page can handle specialized logout if needed
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
        // Set dynamic invite URL if needed
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

        // Copy functionality
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

    // 2. Become a Mentor Modal
    const mentorBtn = document.getElementById('mentor-link');
    const mentorModal = document.getElementById('mentor-modal');
    const mentorCloseBtn = document.getElementById('mentor-modal-close');
    const mentorRequestBtn = document.getElementById('mentor-request-btn');

    if (mentorBtn && mentorModal) {
        mentorBtn.addEventListener('click', (e) => {
            e.preventDefault();
            mentorModal.classList.add('active');
        });

        mentorCloseBtn?.addEventListener('click', () => {
            mentorModal.classList.remove('active');
        });

        mentorRequestBtn?.addEventListener('click', () => {
            mentorModal.classList.remove('active');
            alert('Your mentor request has been sent!');
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

