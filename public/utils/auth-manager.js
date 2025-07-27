import { auth } from '../config/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

/**
 * Global authentication utility that provides shared user state across all modules
 */
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.listeners = [];
        this.setupAuthListener();
    }

    setupAuthListener() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                };
            } else {
                this.currentUser = null;
            }
            
            // Notify all listeners about the auth state change
            this.listeners.forEach(callback => callback(this.currentUser));
        });
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Subscribe to auth state changes
    onAuthStateChanged(callback) {
        this.listeners.push(callback);
        
        // Call immediately with current state
        callback(this.currentUser);
        
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
}

// Create global instance
const authManager = new AuthManager();

export default authManager;
