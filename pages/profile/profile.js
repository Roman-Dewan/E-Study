// Tab functionality
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');

        // Switch button state
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Switch content state
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    });
});

// Modal functionality (Delete Account)
const deleteBtn = document.getElementById('delete-account-btn');
const deleteModal = document.getElementById('delete-modal');
const deleteCloseBtn = document.getElementById('delete-modal-close');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const deleteToast = document.getElementById('delete-toast');

if (deleteBtn && deleteModal) {
    deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        deleteModal.classList.add('active');
    });

    deleteCloseBtn?.addEventListener('click', () => {
        deleteModal.classList.remove('active');
    });

    cancelDeleteBtn?.addEventListener('click', () => {
        deleteModal.classList.remove('active');
    });

    confirmDeleteBtn?.addEventListener('click', () => {
        deleteModal.classList.remove('active');
        deleteToast?.classList.add('show');
        setTimeout(() => {
            deleteToast?.classList.remove('show');
        }, 2000);
    });
}

// Support, Invite, and Mentor logic is now handled in sidebar.js


// Avatar upload functionality
const avatarInput = document.getElementById('avatar-upload');
const avatarImgs = document.querySelectorAll('.profile-avatar-medium, .profile-avatar-large, .user-avatar-small');

avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarImgs.forEach(img => {
                img.src = e.target.result;
            });
        };
        reader.readAsDataURL(file);
    }
});

// Notification modal functionality
const notificationBtn = document.getElementById('notification-btn');
const notificationModal = document.getElementById('notification-modal');
const notificationCloseBtn = document.getElementById('notification-modal-close');

if (notificationBtn) {
    notificationBtn.addEventListener('click', (e) => {
        e.preventDefault();
        notificationModal.classList.add('active');
    });
}

if (notificationCloseBtn) {
    notificationCloseBtn.addEventListener('click', () => {
        notificationModal.classList.remove('active');
    });
}

window.addEventListener('click', (e) => {
    if (e.target === notificationModal) {
        notificationModal.classList.remove('active');
    }
});
