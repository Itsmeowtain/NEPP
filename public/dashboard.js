import { auth, db } from '/config/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { CalendarWidget } from '/components/calendar-widget.js';
import { initializeAuth } from '/utils/auth-utils.js';

let currentUser = null;
let calendar = null;

// Initialize authentication and load dashboard
initializeAuth().then(async (authResult) => {
  if (authResult) {
    currentUser = authResult.user;
    await loadDashboardData();
    initializeCalendar();
  }
}).catch(error => {
  console.error('Authentication error:', error);
  window.location.href = '/login.html';
});

async function loadDashboardData() {
  try {
    await Promise.all([
      loadAnnouncements(),
      loadForms()
    ]);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

async function loadForms() {
  try {
    const formsRef = collection(db, "forms");
    const q = query(
      formsRef,
      where("createdBy", "==", currentUser.uid),
      orderBy("dueDate", "desc"),
      limit(3)
    );
    const querySnapshot = await getDocs(q);
    const forms = [];
    querySnapshot.forEach(doc => {
      forms.push({ id: doc.id, ...doc.data() });
    });
    
    const container = document.getElementById('formsList');
    if (!container) return;

    if (forms.length === 0) {
      container.innerHTML = '<div class="empty-state">No forms yet.</div>';
      return;
    }

    container.innerHTML = forms.map(form => `
      <div class="form-item">
        <div class="form-header">
          <h4 class="form-title">
            <a href="view-form.html?id=${form.id}">${form.title}</a>
          </h4>
          ${form.dueDate ? `
            <span class="form-due-date">
              Due: ${formatDate(form.dueDate.toDate())}
            </span>
          ` : ''}
        </div>
        <p class="form-description">${form.description || 'No description'}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading forms:', error);
  }
}

async function loadAnnouncements() {
  try {
    const q = query(
        collection(db, "announcements"), 
        orderBy("time", "desc"), 
        limit(3)
    );
    const querySnapshot = await getDocs(q);
    const announcements = [];
    querySnapshot.forEach(doc => announcements.push({ id: doc.id, ...doc.data() }));

    const container = document.getElementById('announcementsList');
    if (!container) return;

    if (announcements.length === 0) {
        container.innerHTML = '<div class="empty-state">No announcements yet.</div>';
        return;
    }
    
    container.innerHTML = announcements.map(announcement => {
      const time = announcement.time ? announcement.time.toDate() : new Date();
      return `
        <div class="announcement-item">
          <strong>${announcement.message}</strong><br>
          <span class="announcement-author">By: ${announcement.author || 'Anonymous'}</span>
          <span class="announcement-time">${formatTimeAgo(time)}</span>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error displaying announcements:', error);
  }
}

function formatTimeAgo(date) {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
}

function formatDate(date) {
    if (!date) return 'No date';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (inputDate.getTime() === today.getTime()) {
        return 'Today';
    } else if (inputDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
    } else if (inputDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

function initializeCalendar() {
    try {
        calendar = new CalendarWidget('calendarWidget');
        
        // Load events into calendar
        loadUpcomingEvents();
        
        // Add event listener for date selection
        document.getElementById('calendarWidget').addEventListener('dateSelected', (e) => {
            console.log('Date selected:', e.detail.date);
        });
    } catch (error) {
        console.error('Error initializing calendar:', error);
    }
}

async function loadUpcomingEvents() {
    try {
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, orderBy("date", "asc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(doc => {
            const event = doc.data();
            if (event.date && calendar) {
                calendar.addEvent(event.date.toDate(), {
                    title: event.title,
                    description: event.description,
                    id: doc.id
                });
            }
        });
    } catch (error) {
        console.error('Error loading events for calendar:', error);
    }
}
