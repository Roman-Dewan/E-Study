import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Updates today's activity stats for the logged-in user.
 * @param {Object} stats - Fields to increment (e.g. { lessons: 1, video: 5 })
 */
export async function updateDailyStat(stats) {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                console.warn("Tracker: No user logged in.");
                resolve(null);
                return;
            }

            const uid = user.uid;
            const today = new Date().toISOString().split('T')[0];
            const docRef = doc(db, 'E-study', uid, 'activity', today);
            
            // Prepare increment object
            const updateObj = {};
            for (const [key, value] of Object.entries(stats)) {
                updateObj[key] = increment(value);
            }
            
            try {
                await setDoc(docRef, updateObj, { merge: true });
                console.log(`Tracker: Updated stats for ${today}`, stats);
                resolve(true);
            } catch (err) {
                console.error("Tracker: Error updating stats", err);
                resolve(false);
            }
        });
    });
}

// Logic for Time Tracking (Video Time)
let startTime = Date.now();

export function startTimeTracking() {
    startTime = Date.now();
    console.log("Tracker: Time tracking started.");
}

export async function stopAndSaveTime(statType = 'video') {
    const endTime = Date.now();
    const minutes = Math.floor((endTime - startTime) / 60000);
    
    if (minutes > 0) {
        await updateDailyStat({ [statType]: minutes });
        console.log(`Tracker: Saved ${minutes} minutes to ${statType}`);
    }
    
    // Reset start time
    startTime = Date.now();
}

// Auto-save every 5 minutes if page stays open
setInterval(() => {
    stopAndSaveTime('video');
}, 300000); 

// Save when leaving the page
window.addEventListener('beforeunload', () => {
    stopAndSaveTime('video');
});
