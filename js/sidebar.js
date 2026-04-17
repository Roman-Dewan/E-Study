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
            // Dispatch a custom event so the page can handle specialized logout if needed
            const event = new CustomEvent('estudy-logout', { 
                bubbles: true, 
                detail: { originalEvent: e } 
            });
            document.dispatchEvent(event);
            
            // If no one prevented default, fallback to a standard redirect or alert
            // But usually the page will have a listener
        });
    }

    // Modal triggers (Invite, Mentor etc) if they exist on the page
    // We can add global handlers here if the modals are also made reusable
}
