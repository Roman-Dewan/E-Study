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

// Modal functionality
const inviteBtn = document.getElementById('invite-friend-link');
const modal = document.getElementById('invite-modal');
const closeBtn = document.getElementById('modal-close');
const copyBtn = document.getElementById('copy-btn');
const shareUrl = document.getElementById('share-url');
const toast = document.getElementById('copy-toast');

// Set current URL (fallback if needed)
shareUrl.value = window.location.origin + "/invite/roman-dewan";

inviteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('active');
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

// Become a Mentor modal
const mentorBtn = document.getElementById('mentor-link');
const mentorModal = document.getElementById('mentor-modal');
const mentorCloseBtn = document.getElementById('mentor-modal-close');
const mentorRequestBtn = document.getElementById('mentor-request-btn');

mentorBtn.addEventListener('click', (e) => {
    e.preventDefault();
    mentorModal.classList.add('active');
});

mentorCloseBtn.addEventListener('click', () => {
    mentorModal.classList.remove('active');
});

window.addEventListener('click', (e) => {
    if (e.target === mentorModal) {
        mentorModal.classList.remove('active');
    }
});

mentorRequestBtn.addEventListener('click', () => {
    mentorModal.classList.remove('active');
    alert('Your mentor request has been sent!');
});

// Copy functionality
copyBtn.addEventListener('click', () => {
    shareUrl.select();
    navigator.clipboard.writeText(shareUrl.value).then(() => {
        // visual feedback
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied</span>';
        copyBtn.classList.add('copied');
        toast.classList.add('show');

        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> <span>Copy</span>';
            copyBtn.classList.remove('copied');
            toast.classList.remove('show');
        }, 2000);
    });
});

// Delete modal functionality
const deleteBtn = document.getElementById('delete-account-btn');
const deleteModal = document.getElementById('delete-modal');
const deleteCloseBtn = document.getElementById('delete-modal-close');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const deleteToast = document.getElementById('delete-toast');

deleteBtn.addEventListener('click', (e) => {
    e.preventDefault();
    deleteModal.classList.add('active');
});

deleteCloseBtn.addEventListener('click', () => {
    deleteModal.classList.remove('active');
});

cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.remove('active');
});

window.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        deleteModal.classList.remove('active');
    }
});

// Confirm delete
confirmDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.remove('active');
    deleteToast.classList.add('show');
    setTimeout(() => {
        deleteToast.classList.remove('show');
    }, 2000);
});

// Support modal functionality
const supportBtn = document.getElementById('support-link');
const supportModal = document.getElementById('support-modal');
const supportCloseBtn = document.getElementById('support-modal-close');
const supportForm = document.getElementById('support-form');

supportBtn.addEventListener('click', (e) => {
    e.preventDefault();
    supportModal.classList.add('active');
});

supportCloseBtn.addEventListener('click', () => {
    supportModal.classList.remove('active');
});

window.addEventListener('click', (e) => {
    if (e.target === supportModal) {
        supportModal.classList.remove('active');
    }
});

supportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('support-subject').value;
    const message = document.getElementById('support-message').value;

    if (!subject || !message.trim()) {
        alert('Please fill in all fields.');
        return;
    }

    // Simulate form submission
    supportModal.classList.remove('active');
    alert('Your support request has been sent! We\'ll get back to you soon.');

    // Reset form
    supportForm.reset();
});

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
