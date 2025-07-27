import { auth } from '../config/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

class SidebarManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.loadSidebar();
        this.setupAuthListener();
        this.highlightCurrentPage();
    }

    async loadSidebar() {
        try {
            const response = await fetch('/components/sidebar.html');
            const html = await response.text();
            
            const sidebarContainer = document.querySelector('.sidebar');
            if (sidebarContainer) {
                sidebarContainer.innerHTML = html;
            } else {
                console.error('Sidebar container not found');
            }
        } catch (error) {
            console.error('Error loading sidebar:', error);
        }
    }

    setupAuthListener() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                };
                this.updateSidebarUser();
            } else {
                this.updateSidebarUser(null);
            }
        });
    }

    updateSidebarUser(user = this.currentUser) {
        const userNameElement = document.getElementById('sidebar-user-name');
        if (userNameElement) {
            if (user) {
                userNameElement.textContent = user.displayName || user.email || 'NEPP User';
            } else {
                userNameElement.textContent = 'NEPP User';
            }
        }
    }

    highlightCurrentPage() {
        const currentPage = window.location.pathname.split('/').pop();
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        
        sidebarItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPage) {
                item.classList.add('active');
            }
        });
    }

    // Method to get current user from other modules
    getCurrentUser() {
        return this.currentUser;
    }
}

// Create global instance
const sidebarManager = new SidebarManager();

// Export for use in other modules
export default sidebarManager;
