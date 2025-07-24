import { auth, db } from '/config/firebase-config.js';
import { 
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  await loadForms();
});

// Modify the loadForms function
async function loadForms() {
  const publicList = document.getElementById('publicFormsList');
  const privateList = document.getElementById('privateFormsList');
  
  // Add loading state
  publicList.innerHTML = '<p class="loading">Loading forms...</p>';
  privateList.innerHTML = '<p class="loading">Loading forms...</p>';

  try {
    // Get public forms
    const publicFormsQuery = query(
      collection(db, 'forms'),
      where('type', '==', 'public'),
      orderBy('createdAt', 'desc')
    );
    const publicFormsSnapshot = await getDocs(publicFormsQuery);
    
    if (!publicFormsSnapshot.empty) {
      displayForms(publicFormsSnapshot, 'publicFormsList');
    } else {
      publicList.innerHTML = '<p class="no-forms">No public forms available</p>';
    }

    // Get private forms
    if (auth.currentUser) {
      const privateFormsQuery = query(
        collection(db, 'forms'),
        where('type', '==', 'private'),
        orderBy('createdAt', 'desc')
      );
      const privateFormsSnapshot = await getDocs(privateFormsQuery);
      const userGroupsQuery = query(
        collection(db, 'groups'),
        where('members', 'array-contains', auth.currentUser.uid)
      );
      const userGroups = await getDocs(userGroupsQuery);
      const userGroupIds = userGroups.docs.map(doc => doc.id);
      
      // Filter private forms
      const userPrivateForms = privateFormsSnapshot.docs.filter(doc => 
        userGroupIds.includes(doc.data().group)
      );
      
      if (userPrivateForms.length > 0) {
        displayForms({ docs: userPrivateForms }, 'privateFormsList');
      } else {
        privateList.innerHTML = '<p class="no-forms">No private forms available</p>';
      }
    } else {
      privateList.innerHTML = '<p class="no-forms">Sign in to view private forms</p>';
    }
  } catch (error) {
    console.error("Error loading forms:", error);
    publicList.innerHTML = '<p class="error">Error loading forms. Please try again.</p>';
    privateList.innerHTML = '<p class="error">Error loading forms. Please try again.</p>';
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