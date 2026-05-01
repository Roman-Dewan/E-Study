import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Immediate Load from LocalStorage (Zero Delay)
function applyCachedData() {
    const cachedName = localStorage.getItem('estudy_user_name');
    const cachedAvatar = localStorage.getItem('estudy_user_avatar');

    if (cachedName) {
        updateUI(cachedName, cachedAvatar);
    }
}

function updateUI(name, avatar = null) {
    const headerNameEls = document.querySelectorAll('#header-name, .user-name');
    headerNameEls.forEach(el => el.textContent = name);
    
    if (avatar) {
        const headerAvatarEls = document.querySelectorAll('#header-avatar');
        headerAvatarEls.forEach(el => el.src = avatar);
    }
}

// Initial pull from cache
applyCachedData();

// 2. Firebase Auth & Firestore Sync
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Immediate fallback to Auth DisplayName if cache is empty
        if (!localStorage.getItem('estudy_user_name') && user.displayName) {
            updateUI(user.displayName, user.photoURL);
        }

        try {
            // Fetch fresh data from Firestore
            const userDocSnap = await getDoc(doc(db, "E-study", user.email));
            
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const firstName = userData.first_name || '';
                const lastName = userData.last_name || '';
                
                // If Firestore is empty, use the auth display name (which we know we set during signup)
                let fullName = `${firstName} ${lastName}`.trim();
                if (!fullName) {
                    fullName = user.displayName || "User";
                }
                
                // Fallback: Check personal_details.image, then avatar_url, then photoURL
                const avatarUrl = (userData.personal_details && userData.personal_details.image) || userData.avatar_url || user.photoURL;

                // Update UI
                updateUI(fullName, avatarUrl);

                // Update Cache for next page load
                localStorage.setItem('estudy_user_name', fullName);
                if (avatarUrl) localStorage.setItem('estudy_user_avatar', avatarUrl);
            }
        } catch (err) {
            console.error("Error syncing global header:", err);
        }
    } else {
        // Clear cache on logout
        localStorage.removeItem('estudy_user_name');
        localStorage.removeItem('estudy_user_avatar');
    }
});
