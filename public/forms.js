import { auth, db } from '/config/firebase-config.js';
import { 
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  setDoc,
  arrayUnion,
  arrayRemove,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Initialize the page with loading states
document.addEventListener('DOMContentLoaded', () => {
  const containers = ['publicFormsList', 'privateFormsList', 'userFormsList', 'bookmarkedFormsList'];
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = '<p class="loading">Loading forms...</p>';
    }
  });
});

// Auth state observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadForms();
    await loadBookmarkedForms();
  } else {
    // Handle not signed in state
    const containers = ['privateFormsList', 'userFormsList', 'bookmarkedFormsList'];
    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = '<p class="no-forms">Please sign in to view forms</p>';
      }
    });
    // Still load public forms
    await loadPublicForms();
  }
});

// Separate public forms loading
async function loadPublicForms() {
  try {
    const publicQuery = query(
      collection(db, 'forms'),
      where('type', '==', 'public'),
      orderBy('createdAt', 'desc')
    );
    const publicSnapshot = await getDocs(publicQuery);
    displayForms(publicSnapshot, 'publicFormsList');
  } catch (error) {
    console.error("Error loading public forms:", error);
    const container = document.getElementById('publicFormsList');
    if (container) {
      container.innerHTML = '<p class="error">Error loading public forms</p>';
    }
  }
}

// Main forms loading function
async function loadForms() {
  if (!auth.currentUser) return;

  try {
    // Load public forms
    await loadPublicForms();

    // Load user's groups first
    const userGroupsQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', auth.currentUser.uid)
    );
    
    const userGroups = await getDocs(userGroupsQuery);
    const userGroupIds = userGroups.docs.map(doc => doc.id);

    // Load private forms
    if (userGroupIds.length > 0) {
      const privateFormsQuery = query(
        collection(db, 'forms'),
        where('type', '==', 'private'),
        where('group', 'in', userGroupIds), // Use 'in' operator instead of multiple queries
        orderBy('createdAt', 'desc')
      );
      const privateFormsSnapshot = await getDocs(privateFormsQuery);
      displayForms(privateFormsSnapshot, 'privateFormsList');
    } else {
      const container = document.getElementById('privateFormsList');
      if (container) {
        container.innerHTML = '<p class="no-forms">No private forms available</p>';
      }
    }

    // Load user's created forms
    const userFormsQuery = query(
      collection(db, 'forms'),
      where('createdBy', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const userFormsSnapshot = await getDocs(userFormsQuery);
    displayForms(userFormsSnapshot, 'userFormsList');

  } catch (error) {
    console.error("Error loading forms:", error);
    const containers = ['privateFormsList', 'userFormsList'];
    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = `<p class="error">Error: ${error.message}</p>`;
      }
    });
  }
}

function displayForms(snapshot, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ''; // Clear existing content

  if (snapshot.empty) {
    container.innerHTML = '<p class="no-forms">No forms available</p>';
    return;
  }

let debounceTimer;
document.querySelector('.forms-search input').addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const searchTerm = e.target.value.toLowerCase();
    const formCards = document.querySelectorAll('.form-card');
    formCards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const description = card.querySelector('.form-description').textContent.toLowerCase();
      card.style.display = title.includes(searchTerm) || description.includes(searchTerm) ? 'block' : 'none';
    });
  }, 300); // 300ms debounce
});

  snapshot.forEach(doc => {
    const form = doc.data();
    const formDate = form.createdAt.toDate().toLocaleDateString();
    const dueDate = form.createdAt.toDate().toLocaleDateString();

    const formCard = document.createElement('div');
    formCard.className = 'form-card';
    formCard.innerHTML = `
      <h3>${form.title}</h3>
      <p class="form-description">${form.description || 'No description provided'}</p>
      <div class="form-meta">
        <span class="form-date">Created: ${formDate}</span>
        <span class="form-due">Due: ${dueDate}</span>
      </div>
      <div class="form-creator">
        <span class="creator-name">By: ${form.creatorName || 'Unknown'}</span>
      </div>
      <div class="form-actions">
        <button class="view-form-btn" data-form-id="${doc.id}">View Form</button>
        ${auth.currentUser?.uid === form.createdBy ? `
          <button class="edit-form-btn" data-form-id="${doc.id}">Edit</button>
          <button class="delete-form-btn" data-form-id="${doc.id}">Delete</button>
        ` : ''}
      </div>
    `;

    // Add click event for viewing the form
    formCard.querySelector('.view-form-btn').addEventListener('click', () => {
      window.location.href = `view-form.html?id=${doc.id}`;
    });

    // Add click events for edit and delete if they exist
    const editBtn = formCard.querySelector('.edit-form-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.location.href = `edit-form.html?id=${doc.id}`;
      });
    }

    const deleteBtn = formCard.querySelector('.delete-form-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this form?')) {
          deleteForm(doc.id);
        }
      });
    }

    container.appendChild(formCard);
  });
}

// Implement delete form functionality
async function deleteForm(formId) {
  try {
    await deleteDoc(doc(db, 'forms', formId));
    await loadForms(); // Reload forms after deletion
  } catch (error) {
    console.error("Error deleting form:", error);
    alert("Failed to delete form. Please try again.");
  }
}

// Implement search functionality
document.querySelector('.forms-search input').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const formCards = document.querySelectorAll('.form-card');
  
  formCards.forEach(card => {
    const title = card.querySelector('h3').textContent.toLowerCase();
    const description = card.querySelector('.form-description').textContent.toLowerCase();
    const isVisible = title.includes(searchTerm) || description.includes(searchTerm);
    card.style.display = isVisible ? 'block' : 'none';
  });
});

// Add create form button navigation
document.getElementById('createFormBtn').addEventListener('click', () => {
  window.location.href = 'create-form.html';
});

// Add this at the end of the file
document.getElementById('viewResultsBtn').addEventListener('click', () => {
  const userForms = document.querySelectorAll('#userFormsList .form-card');
  if (userForms.length === 0) {
    alert('You have no forms to view results for');
    return;
  }

  // If user has forms, show a dialog to select which form to view
  const dialog = document.createElement('div');
  dialog.className = 'form-select-dialog';
  dialog.innerHTML = `
    <div class="dialog-content">
      <h2>Select a Form</h2>
      <div class="form-list">
        ${Array.from(userForms).map(form => `
          <button class="form-select-btn" data-form-id="${form.querySelector('[data-form-id]').dataset.formId}">
            ${form.querySelector('h3').textContent}
          </button>
        `).join('')}
      </div>
      <button class="cancel-btn">Cancel</button>
    </div>
  `;

  document.body.appendChild(dialog);

  dialog.addEventListener('click', (e) => {
    if (e.target.classList.contains('form-select-btn')) {
      const formId = e.target.dataset.formId;
      window.location.href = `form-results.html?id=${formId}`;
    } else if (e.target.classList.contains('cancel-btn') || e.target === dialog) {
      dialog.remove();
    }
  });
});