import { auth, db } from '/config/firebase-config.js';
import { FormsService } from '/services/forms-service.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { AnnouncementService } from '/services/announcement-service.js';
import { UIUtils } from './utils/ui-utils.js';
import { CONSTANTS } from './config/constants.js';
import { UserSelector } from './components/user-selector.js';

// Wait for auth state before trying to load data
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      console.log('User authenticated, loading data...');
      await displayForms();
      await displayAnnouncements();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
});

// UI: Set sidebar and header user name
onAuthStateChanged(auth, (user) => {
  const displayName = user?.displayName || CONSTANTS.UI.DEFAULT_USER_NAME;
  document.getElementById('sidebar-user-name').textContent = displayName;
  document.getElementById('user-display-name').textContent = displayName;
});

// Initialize user selector
const userSelector = new UserSelector('formUserSelector');

// Forms Logic
document.getElementById('createFormBtn').onclick = () => UIUtils.toggleModal('formModal', true);
document.getElementById('closeFormModal').onclick = () => {
  UIUtils.toggleModal('formModal', false);
  UIUtils.clearFormFields(['formTitle', 'formDueDate', 'formAssignedTo', 'formAssignedBy', 'formDescription']);
};

document.getElementById('saveFormBtn').onclick = async () => {
  const formData = {
    title: document.getElementById('formTitle').value.trim(),
    dueDate: document.getElementById('formDueDate').value,
    description: document.getElementById('formDescription').value.trim(),
    isPublic: document.getElementById('formIsPublic').checked,
    targetUsers: userSelector.getSelectedUsers(),
    createdBy: auth.currentUser.uid
  };

  if (!formData.title || !formData.dueDate || !formData.description) {
    alert("Please fill in all required fields.");
    return;
  }

  await FormsService.create(formData);
  UIUtils.toggleModal('formModal', false);
  UIUtils.clearFormFields(['formTitle', 'formDueDate', 'formDescription']);
  userSelector.clear();
  displayForms();
};

async function displayForms() {
  try {
    console.log('Fetching forms...');
    const forms = await FormsService.getAll(auth.currentUser.uid);
    console.log('Forms fetched:', forms);
    
    const container = document.getElementById('formsList');
    container.innerHTML = forms.length ? '' : '<div style="color:#aaa;">No forms yet.</div>';
    
    forms.forEach(form => {
      const el = document.createElement('div');
      el.className = 'form-item';
      el.innerHTML = `
        <strong>${form.title}</strong> 
        <span class="form-visibility">${form.isPublic ? '🌎 Public' : '👥 Targeted'}</span>
        <span style="color:#bbccff;">(Due: ${form.dueDate})</span><br>
        <p>${form.description}</p>
      `;
      container.appendChild(el);
    });
  } catch (error) {
    console.error('Error displaying forms:', error);
  }
}

async function displayAnnouncements() {
  try {
    console.log('Fetching announcements...');
    const querySnapshot = await getDocs(collection(db, "announcements"));
    const announcements = [];
    querySnapshot.forEach(doc => announcements.push({ id: doc.id, ...doc.data() }));
    console.log('Announcements fetched:', announcements);

    const container = document.getElementById('announcementsList');
    container.innerHTML = announcements.length ? '' : '<div style="color:#aaa;">No announcements yet.</div>';
    
    announcements.forEach(announcement => {
      const el = document.createElement('div');
      el.className = 'announcement-item';
      el.innerHTML = `
        <strong>${announcement.message}</strong><br>
        <span class="announcement-author">By: ${announcement.author || 'Anonymous'}</span>
        <span class="announcement-time">${new Date(announcement.time).toLocaleDateString()}</span>
      `;
      container.appendChild(el);
    });
  } catch (error) {
    console.error('Error displaying announcements:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Add the settings icon directly in the HTML
  const settingsHtml = `
    <a href="settings.html" class="settings-top">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="nav-icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    </a>`;
  
  document.querySelector('.nepp-root').insertAdjacentHTML('afterbegin', settingsHtml);
  
  // Add click handler for the close button
  const closeBtn = document.querySelector('.modal .close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeFormModal);
  }

  // Add escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeFormModal();
    }
  });
});

document.getElementById('toggleTheme')?.addEventListener('click', (e) => {
  e.preventDefault();
  const isDark = document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

document.getElementById('resetPassword')?.addEventListener('click', async (e) => {
  e.preventDefault();
  if (auth.currentUser) {
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      alert('Password reset email sent! Check your inbox.');
    } catch (error) {
      alert('Error sending reset email: ' + error.message);
    }
  }
});

document.getElementById('signOut')?.addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    await signOut(auth);
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Sign out error:', error);
  }
});

// Add these functions for better modal handling

function openFormModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.style.display = 'flex';
    // Add event listener to close when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeFormModal();
      }
    });
  }
}

function closeFormModal() {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.style.display = 'none';
    // Clear form inputs if needed
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

// Modal click outside handler
window.onclick = function(event) {
  if (event.target === document.getElementById('formModal')) {
    UIUtils.toggleModal('formModal', false);
    UIUtils.clearFormFields(['formTitle', 'formDueDate', 'formAssignedTo', 'formAssignedBy', 'formDescription']);
  }
};