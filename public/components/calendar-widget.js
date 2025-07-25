export class CalendarWidget {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentDate = new Date();
    this.selectedDate = null;
    this.events = new Map(); // Map of date strings to events
    this.forms = new Map(); // Map of date strings to forms
    
    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('other-month')) {
        this.selectDate(e.target);
      }
      
      if (e.target.classList.contains('calendar-nav-btn')) {
        const direction = e.target.dataset.direction;
        this.navigateMonth(direction);
      }
    });
  }

  navigateMonth(direction) {
    if (direction === 'prev') {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    }
    this.render();
  }

  selectDate(dayElement) {
    // Remove previous selection
    this.container.querySelectorAll('.calendar-day.selected').forEach(day => {
      day.classList.remove('selected');
    });
    
    // Add selection to clicked day
    dayElement.classList.add('selected');
    
    const day = parseInt(dayElement.textContent);
    this.selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
    
    // Trigger custom event
    this.container.dispatchEvent(new CustomEvent('dateSelected', {
      detail: { 
        date: this.selectedDate,
        dateString: this.formatDateString(this.selectedDate)
      }
    }));
  }

  formatDateString(date) {
    return date.toISOString().split('T')[0];
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const today = new Date();
    
    // Get first day of month and days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Month names
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    let html = `
      <div class="calendar-header">
        <button class="calendar-nav-btn" data-direction="prev">&lt;</button>
        <h3 class="calendar-month-year">${monthNames[month]} ${year}</h3>
        <button class="calendar-nav-btn" data-direction="next">&gt;</button>
      </div>
      <div class="calendar-weekdays">
        <div class="calendar-weekday">S</div>
        <div class="calendar-weekday">M</div>
        <div class="calendar-weekday">T</div>
        <div class="calendar-weekday">W</div>
        <div class="calendar-weekday">T</div>
        <div class="calendar-weekday">F</div>
        <div class="calendar-weekday">S</div>
      </div>
      <div class="calendar-days">
    `;

    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      html += `<div class="calendar-day other-month">${day}</div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = this.formatDateString(date);
      const isToday = date.toDateString() === today.toDateString();
      const hasEvents = this.events.has(dateString) || this.forms.has(dateString);
      
      let classes = 'calendar-day';
      if (isToday) classes += ' today';
      if (hasEvents) classes += ' has-events';
      
      html += `<div class="${classes}">${day}</div>`;
    }

    // Next month's leading days
    const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (startingDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
      html += `<div class="calendar-day other-month">${day}</div>`;
    }

    html += '</div>';
    this.container.innerHTML = html;
  }

  addEvent(date, event) {
    const dateString = this.formatDateString(new Date(date));
    if (!this.events.has(dateString)) {
      this.events.set(dateString, []);
    }
    this.events.get(dateString).push(event);
    this.render();
  }

  addForm(date, form) {
    const dateString = this.formatDateString(new Date(date));
    if (!this.forms.has(dateString)) {
      this.forms.set(dateString, []);
    }
    this.forms.get(dateString).push(form);
    this.render();
  }

  getEventsForDate(date) {
    const dateString = this.formatDateString(new Date(date));
    return {
      events: this.events.get(dateString) || [],
      forms: this.forms.get(dateString) || []
    };
  }
}
