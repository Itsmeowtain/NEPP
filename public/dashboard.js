import FormsService from './services/forms-service.js';
import AnnouncementService from './services/announcement-service.js';
import AuthService from './services/auth-service.js';

class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.calendar = null;
        
        this.initializeElements();
        this.checkAuthentication();
    }

    initializeElements() {
        this.announcementsList = document.getElementById('announcementsList');
        this.formsList = document.getElementById('formsList');
        this.dateDetails = document.getElementById('dateDetails');
        this.calendarWidget = document.getElementById('calendarWidget');
    }

    async checkAuthentication() {
        try {
            this.currentUser = await AuthService.getCurrentUser();
            if (!this.currentUser) {
                this.showAuthAlert();
                return;
            }
            
            // Update sidebar with user info
            this.updateSidebarUser();
            
            // Load dashboard data
            await this.loadDashboardData();
            
            // Initialize calendar widget
            this.initializeCalendar();
        } catch (error) {
            console.error('Authentication error:', error);
            this.showAuthAlert();
        }
    }

    updateSidebarUser() {
        const userNameElement = document.getElementById('sidebar-user-name');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.email || 'NEPP User';
        }
    }

    showAuthAlert() {
        alert('Please log in to access the dashboard.');
        window.location.href = 'login.html';
    }

    async loadDashboardData() {
        try {
            // Load announcements and forms in parallel
            const [announcements, forms] = await Promise.all([
                AnnouncementService.getAnnouncements(),
                FormsService.getUserForms(this.currentUser.uid)
            ]);

            this.displayAnnouncements(announcements.slice(0, 3)); // Show latest 3
            this.displayForms(forms.slice(0, 3)); // Show latest 3
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    displayAnnouncements(announcements) {
        if (!this.announcementsList) return;

        if (announcements.length === 0) {
            this.announcementsList.innerHTML = `
                <div class="empty-state">
                    <p>No announcements yet</p>
                </div>
            `;
            return;
        }

        this.announcementsList.innerHTML = announcements.map(announcement => {
            const timeAgo = this.formatTimeAgo(announcement.createdAt);
            return `
                <div class="announcement-item">
                    <div class="announcement-header">
                        <h4 class="announcement-title">${announcement.title}</h4>
                        <span class="announcement-time">${timeAgo}</span>
                    </div>
                    <p class="announcement-content">${announcement.content}</p>
                    <div class="announcement-meta">
                        <span class="announcement-author">By ${announcement.author || 'Anonymous'}</span>
                        ${announcement.priority ? `<span class="announcement-priority ${announcement.priority}">${announcement.priority}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    displayForms(forms) {
        if (!this.formsList) return;

        if (forms.length === 0) {
            this.formsList.innerHTML = `
                <div class="empty-state">
                    <p>No forms yet</p>
                    <a href="create-form.html" class="create-link">Create your first form</a>
                </div>
            `;
            return;
        }

        this.formsList.innerHTML = forms.map(form => {
            const dueDate = form.dueDate ? new Date(form.dueDate) : null;
            const isOverdue = dueDate && dueDate < new Date();
            
            return `
                <div class="form-item">
                    <div class="form-header">
                        <h4 class="form-title">
                            <a href="view-form.html?id=${form.id}">${form.title}</a>
                        </h4>
                        ${dueDate ? `
                            <span class="form-due-date ${isOverdue ? 'overdue' : ''}">
                                Due: ${this.formatDate(dueDate)}
                            </span>
                        ` : ''}
                    </div>
                    <p class="form-description">${form.description || 'No description'}</p>
                    <div class="form-meta">
                        <span class="form-status ${form.status || 'draft'}">${form.status || 'Draft'}</span>
                        <span class="form-responses">${form.responses || 0} responses</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    initializeCalendar() {
        if (!this.calendarWidget) return;

        // Import and initialize the calendar widget
        import('./components/calendar-widget.js').then(module => {
            this.calendar = new module.CalendarWidget(this.calendarWidget);
            this.loadCalendarData();
        }).catch(error => {
            console.error('Error loading calendar widget:', error);
            this.calendarWidget.innerHTML = `
                <div class="calendar-error">
                    <p>Unable to load calendar</p>
                </div>
            `;
        });
    }

    async loadCalendarData() {
        if (!this.calendar) return;

        try {
            // Load forms with due dates
            const forms = await FormsService.getUserForms(this.currentUser.uid);
            
            // Add form due dates to calendar
            forms.forEach(form => {
                if (form.dueDate) {
                    this.calendar.addForm(form.dueDate, {
                        id: form.id,
                        title: form.title,
                        type: 'form-due'
                    });
                }
            });

            // Set up date selection handler
            this.calendar.onDateSelect = (date) => {
                this.showDateDetails(date);
            };

        } catch (error) {
            console.error('Error loading calendar data:', error);
        }
    }

    showDateDetails(date) {
        if (!this.dateDetails) return;

        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Find events/forms for this date
        const dayEvents = this.calendar ? this.calendar.getEventsForDate(date) : [];
        
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

        this.dateDetails.innerHTML = content;
    }

    formatTimeAgo(date) {
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

    formatDate(date) {
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
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
