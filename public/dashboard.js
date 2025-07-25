import { auth, db } from './config/firebase-config.js';
import { collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

let currentUser = null;
let calendar = null;

// Wait for auth state before loading
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const displayName = user.displayName || "NEPP User";
        const sidebarUserName = document.getElementById('sidebar-user-name');
        if (sidebarUserName) {
            sidebarUserName.textContent = displayName;
        }
        
        // Load dashboard data
        await loadDashboardData();
        
        // Initialize calendar widget
        initializeCalendar();
    } else {
        window.location.href = '/login.html';
    }
});

async function loadDashboardData() {
    try {
        // Load announcements and forms in parallel
        await Promise.all([
            loadAnnouncements(),
            loadForms()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadAnnouncements() {
    try {
        console.log('Loading announcements...');
        const q = query(
            collection(db, "announcements"), 
            orderBy("time", "desc"), 
            limit(3)
        );
        const querySnapshot = await getDocs(q);
        const announcements = [];
        querySnapshot.forEach(doc => {
            announcements.push({ id: doc.id, ...doc.data() });
        });
        console.log('Announcements loaded:', announcements);
        displayAnnouncements(announcements);
    } catch (error) {
        console.error('Error loading announcements:', error);
    }
}

async function loadForms() {
    try {
        console.log('Loading forms...');
        const q = query(
            collection(db, "forms"), 
            where("authorId", "==", currentUser.uid),
            orderBy("createdAt", "desc"),
            limit(3)
        );
        const querySnapshot = await getDocs(q);
        const forms = [];
        querySnapshot.forEach(doc => {
            forms.push({ id: doc.id, ...doc.data() });
        });
        console.log('Forms loaded:', forms);
        displayForms(forms);
    } catch (error) {
        console.error('Error loading forms:', error);
    }
}

function displayAnnouncements(announcements) {
    const announcementsList = document.getElementById('announcementsList');
    if (!announcementsList) return;

    if (announcements.length === 0) {
        announcementsList.innerHTML = `
            <div class="empty-state">
                <p>No announcements yet</p>
            </div>
        `;
        return;
    }

    announcementsList.innerHTML = announcements.map(announcement => {
        const timeAgo = formatTimeAgo(announcement.time ? announcement.time.toDate() : null);
        return `
            <div class="announcement-item">
                <div class="announcement-header">
                    <h4 class="announcement-title">${announcement.title || 'Announcement'}</h4>
                    <span class="announcement-time">${timeAgo}</span>
                </div>
                <p class="announcement-content">${announcement.message || announcement.content}</p>
                <div class="announcement-meta">
                    <span class="announcement-author">By ${announcement.author || 'Anonymous'}</span>
                    ${announcement.priority ? `<span class="announcement-priority ${announcement.priority}">${announcement.priority}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function displayForms(forms) {
    const formsList = document.getElementById('formsList');
    if (!formsList) return;

    if (forms.length === 0) {
        formsList.innerHTML = `
            <div class="empty-state">
                <p>No forms yet</p>
                <a href="create-form.html" class="create-link">Create your first form</a>
            </div>
        `;
        return;
    }

    formsList.innerHTML = forms.map(form => {
        const dueDate = form.dueDate ? new Date(form.dueDate.toDate()) : null;
        const isOverdue = dueDate && dueDate < new Date();
        
        return `
            <div class="form-item">
                <div class="form-header">
                    <h4 class="form-title">
                        <a href="view-form.html?id=${form.id}">${form.title}</a>
                    </h4>
                    ${dueDate ? `
                        <span class="form-due-date ${isOverdue ? 'overdue' : ''}">
                            Due: ${formatDate(dueDate)}
                        </span>
                    ` : ''}
                </div>
                <p class="form-description">${form.description || 'No description'}</p>
                <div class="form-meta">
                    <span class="form-status ${form.status || 'draft'}">${form.status || 'Draft'}</span>
                    <span class="form-responses">${form.responseCount || 0} responses</span>
                </div>
            </div>
        `;
    }).join('');
}

function initializeCalendar() {
    const calendarWidget = document.getElementById('calendarWidget');
    if (!calendarWidget) return;

    // Import and initialize the calendar widget
    import('./components/calendar-widget.js').then(module => {
        calendar = new module.CalendarWidget(calendarWidget);
        loadCalendarData();
    }).catch(error => {
        console.error('Error loading calendar widget:', error);
        calendarWidget.innerHTML = `
            <div class="calendar-error">
                <p>Unable to load calendar</p>
            </div>
        `;
    });
}

async function loadCalendarData() {
    if (!calendar) return;

    try {
        // Load forms with due dates
        const q = query(
            collection(db, "forms"), 
            where("authorId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        
        // Add form due dates to calendar
        querySnapshot.forEach(doc => {
            const form = doc.data();
            if (form.dueDate) {
                calendar.addForm(form.dueDate.toDate(), {
                    id: doc.id,
                    title: form.title,
                    type: 'form-due'
                });
            }
        });

        // Set up date selection handler
        calendar.onDateSelect = (date) => {
            showDateDetails(date);
        };

    } catch (error) {
        console.error('Error loading calendar data:', error);
    }
}

function showDateDetails(date) {
    const dateDetails = document.getElementById('dateDetails');
    if (!dateDetails) return;

    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Find events/forms for this date
    const dayEvents = calendar ? calendar.getEventsForDate(date) : [];
    
    let content = `
        <div class="date-header">
            <h3>${formattedDate}</h3>
        </div>
    `;

    if (dayEvents.length > 0) {
        content += `
            <div class="date-events">
                <h4>Events for this date:</h4>
                ${dayEvents.map(event => `
                    <div class="date-event-item">
                        <span class="event-type ${event.type}">${event.type === 'form-due' ? 'Form Due' : 'Event'}</span>
                        <span class="event-title">${event.title}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        content += `
            <div class="date-events">
                <p class="no-events">No events scheduled for this date</p>
            </div>
        `;
    }

    dateDetails.innerHTML = content;
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
    const diffTime = Math.abs(date - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (date.toDateString() === now.toDateString()) {
        return 'Today';
    } else if (diffDays === 1) {
        return date > now ? 'Tomorrow' : 'Yesterday';
    } else {
        return date.toLocaleDateString();
    }
}
