import { auth, db } from "../../js/firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { UserModel, NotificationModel, PersonalDetailsModel, PrivacyModel } from "../../js/models.js";

// --- STATE ---
let currentUserModel = null;

// --- TAB FUNCTIONALITY ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
    });
});

// --- MODAL FUNCTIONALITY ---
const setupModal = (btnId, modalId, closeId) => {
    const btn = document.getElementById(btnId);
    const modal = document.getElementById(modalId);
    const close = document.getElementById(closeId);

    if (btn && modal) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
        });
        close?.addEventListener('click', () => modal.classList.remove('active'));
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }
};

setupModal('delete-account-btn', 'delete-modal', 'delete-modal-close');
setupModal('notification-btn', 'notification-modal', 'notification-modal-close');

// Cancel buttons
document.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentUserModel) populateForms(currentUserModel);
    });
});

// --- FIREBASE INTEGRATION ---
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../../features/auth/login.html';
        return;
    }

    console.log("Authenticated user:", user.email);
    await loadUserProfile(user.email);
});

async function loadUserProfile(email) {
    try {
        const userDocRef = doc(db, "E-study", email);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            currentUserModel = new UserModel({ ...userDocSnap.data(), email });
        } else {
            // Initialize new user if doesn't exist
            currentUserModel = new UserModel({ email });
            await setDoc(userDocRef, currentUserModel.toFirestore());
        }

        populateForms(currentUserModel);
        updateUIElements(currentUserModel);
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

function populateForms(userModel) {
    // Personal Details
    document.getElementById('full-name').value = userModel.fullName;
    document.getElementById('email-address').value = userModel.email;
    document.getElementById('address').value = userModel.personal_details.address;
    document.getElementById('city').value = userModel.personal_details.city;
    document.getElementById('state').value = userModel.personal_details.state;
    document.getElementById('zip').value = userModel.personal_details.zip;
    document.getElementById('country').value = userModel.personal_details.country;

    // Notifications
    document.getElementById('notif-email-updates').checked = userModel.notification.recieve_email_updates;
    document.getElementById('notif-messages').checked = userModel.notification.new_messages;
    document.getElementById('notif-announcements').checked = userModel.notification.course_anouncements;
    document.getElementById('notif-progress').checked = userModel.notification.progress_report;
    document.getElementById('notif-reminders').checked = userModel.notification.lesson_reminders;

    // Privacy
    document.getElementById('priv-profile-private').checked = userModel.privacy.profile_private;
    document.getElementById('priv-active-status').checked = userModel.privacy.active_status;
    document.getElementById('priv-messages').checked = userModel.privacy.messages;
}

function updateUIElements(userModel) {
    const name = userModel.fullName || "User";
    document.getElementById('card-name').textContent = name;
    document.getElementById('header-name').textContent = name;
}

// --- SAVE ACTIONS ---

// 1. Personal Details Form
const personalForm = document.getElementById('personal-form');
personalForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = personalForm.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        const fullName = document.getElementById('full-name').value;
        const { first_name, last_name } = UserModel.splitName(fullName);
        
        const updates = {
            first_name,
            last_name,
            "personal_details.address": document.getElementById('address').value,
            "personal_details.city": document.getElementById('city').value,
            "personal_details.state": document.getElementById('state').value,
            "personal_details.zip": document.getElementById('zip').value,
            "personal_details.country": document.getElementById('country').value
        };

        const userDocRef = doc(db, "E-study", auth.currentUser.email);
        await updateDoc(userDocRef, updates);
        
        // Update local model
        currentUserModel.first_name = first_name;
        currentUserModel.last_name = last_name;
        currentUserModel.personal_details.address = updates["personal_details.address"];
        currentUserModel.personal_details.city = updates["personal_details.city"];
        currentUserModel.personal_details.state = updates["personal_details.state"];
        currentUserModel.personal_details.zip = updates["personal_details.zip"];
        currentUserModel.personal_details.country = updates["personal_details.country"];

        updateUIElements(currentUserModel);
        alert('Profile updated successfully!');
    } catch (error) {
        console.error("Error saving personal details:", error);
        alert('Failed to save profile.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// 2. Auto-save Toggles (Notifications and Privacy)
const setupToggleAutoSave = (elementId, firestorePath) => {
    const toggle = document.getElementById(elementId);
    toggle?.addEventListener('change', async () => {
        try {
            const userDocRef = doc(db, "E-study", auth.currentUser.email);
            await updateDoc(userDocRef, {
                [firestorePath]: toggle.checked
            });
            console.log(`Updated ${firestorePath} to ${toggle.checked}`);
        } catch (error) {
            console.error(`Error updating ${firestorePath}:`, error);
            toggle.checked = !toggle.checked; // Revert on failure
        }
    });
};

// Notification toggles
setupToggleAutoSave('notif-email-updates', 'notification.recieve_email_updates');
setupToggleAutoSave('notif-messages', 'notification.new_messages');
setupToggleAutoSave('notif-announcements', 'notification.course_anouncements');
setupToggleAutoSave('notif-progress', 'notification.progress_report');
setupToggleAutoSave('notif-reminders', 'notification.lesson_reminders');

// Privacy toggles
setupToggleAutoSave('priv-profile-private', 'privacy.profile_private');
setupToggleAutoSave('priv-active-status', 'privacy.active_status');
setupToggleAutoSave('priv-messages', 'privacy.messages');

// Standardized logout via custom event from sidebar
document.addEventListener('estudy-logout', async () => {
    try {
        await signOut(auth);
        window.location.href = '../../features/auth/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out.');
    }
});

// --- AVATAR UPLOAD (Local preview for now) ---
const avatarInput = document.getElementById('avatar-upload');
const avatarImgs = document.querySelectorAll('#card-avatar, #header-avatar, .profile-avatar-medium');

avatarInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarImgs.forEach(img => { img.src = e.target.result; });
        };
        reader.readAsDataURL(file);
    }
});
