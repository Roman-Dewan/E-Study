import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Try reading by UID
            let userDocSnap = await getDoc(doc(db, "E-study", user.uid));
            
            // Fallback: Try reading by email
            if (!userDocSnap.exists() && user.email) {
                userDocSnap = await getDoc(doc(db, "E-study", user.email));
            }

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                
                const firstName = userData.first_name || '';
                const lastName = userData.last_name || '';
                const fullName = (firstName + (lastName ? ' ' + lastName : '')).trim() || userData.fullName || "User";

                // Update the global header dropdown elements
                const headerNameEls = document.querySelectorAll('#header-name, .user-name');
                headerNameEls.forEach(el => el.textContent = fullName);
                
                // For avatars if they exist in firestore
                if (userData.avatar_url) {
                    const headerAvatarEls = document.querySelectorAll('#header-avatar');
                    headerAvatarEls.forEach(el => el.src = userData.avatar_url);
                }
            }
        } catch (err) {
            console.error("Error syncing global header:", err);
        }
    }
});
