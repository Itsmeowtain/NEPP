
import { auth, db } from './config/firebase-config.js';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

let currentFormType = 'public';
let questions = [];
let formId = null;

// Get form ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
formId = urlParams.get('id');

if (!formId) {
  window.location.href = 'forms.html';
}

// Initialize event listeners and load form data
document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.currentUser) {
    showAuthAlert();
    return;
  }

  // Load existing form data
  await loadFormData();

  // Add the same event listeners as in create-form.js
  // ... (copy the event listeners from create-form.js)
});

async function loadFormData() {
  try {
    const formDoc = await getDoc(doc(db, 'forms', formId));
    if (!formDoc.exists()) {
      alert('Form not found');
      window.location.href = 'forms.html';
      return;
    }

    const formData = formDoc.data();
    
    // Populate form fields
    document.getElementById('formTitle').value = formData.title;
    document.getElementById('formDescription').value = formData.description;
    document.getElementById('dueDate').value = formData.dueDate.toDate().toISOString().slice(0, 16);
    
    // Set form type
    currentFormType = formData.type;
    document.querySelector(`.form-type-btn[data-type="${currentFormType}"]`).classList.add('active');
    
    if (currentFormType === 'private') {
      document.getElementById('groupSelector').style.display = 'block';
      document.getElementById('group').value = formData.group;
    }

    // Load questions
    questions = formData.questions;
    questions.forEach(question => {
      addQuestion(question.type, question);
    });

  } catch (error) {
    console.error('Error loading form:', error);
    alert('Error loading form: ' + error.message);
  }
}

// Add the same helper functions as in create-form.js
// ... (copy the helper functions from create-form.js)

// Modify the form submission handler for updating instead of creating
document.getElementById('editFormForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!auth.currentUser) {
    showAuthAlert();
    return;
  }

  const formData = {
    title: document.getElementById('formTitle').value,
    description: document.getElementById('formDescription').value,
    dueDate: Timestamp.fromDate(new Date(document.getElementById('dueDate').value)),
    type: currentFormType,
    group: currentFormType === 'private' ? document.getElementById('group').value : null,
    questions: questions,
  };

  try {
    const formRef = doc(db, 'forms', formId);
    await updateDoc(formRef, formData);
    window.location.href = 'forms.html';
  } catch (error) {
    console.error('Error updating form:', error);
    alert('Error updating form: ' + error.message);
  }
});

// In your forms.js file, update the edit button click handler
formCard.querySelector('.edit-form-btn').addEventListener('click', () => {
  window.location.href = `edit-form.html?id=${doc.id}`;
});

function addQuestion(type, existingQuestion = null) {
  const questionDiv = document.createElement('div');
  questionDiv.className = 'question-container';
  
  const questionData = existingQuestion || {
    type: type,
    question: '',
    required: false,
    options: type === 'Multiple Choice' || type === 'Checkboxes' ? ['Option 1'] : [],
    scale: type === 'Linear Scale' ? { min: 1, max: 5, minLabel: 'Low', maxLabel: 'High' } : null
  };

  questionDiv.innerHTML = `
    <div class="question-header">
      <input type="text" class="question-title-input" placeholder="Question" 
        value="${questionData.question}" required>
      <div class="question-controls">
        <label class="required-toggle">
          <input type="checkbox" ${questionData.required ? 'checked' : ''}>
          Required
        </label>
        <button type="button" class="delete-question-btn">Delete</button>
      </div>
    </div>
    ${generateQuestionInputs(type, questionData)}
  `;

  // Add event listeners for the question
  const deleteBtn = questionDiv.querySelector('.delete-question-btn');
  deleteBtn.addEventListener('click', () => {
    questionDiv.remove();
    updateQuestions();
  });

  const requiredToggle = questionDiv.querySelector('.required-toggle input');
  requiredToggle.addEventListener('change', updateQuestions);

  // Add options management for multiple choice and checkboxes
  if (type === 'Multiple Choice' || type === 'Checkboxes') {
    setupOptionManagement(questionDiv);
  }

  document.getElementById('questionsContainer').appendChild(questionDiv);
  updateQuestions();
}

function generateQuestionInputs(type, data) {
  switch (type) {
    case 'Multiple Choice':
    case 'Checkboxes':
      return `
        <div class="options-container">
          ${(data.options || []).map(option => `
            <div class="option-row">
              <input type="text" class="option-input" value="${option}">
              <button type="button" class="delete-option-btn">Delete</button>
            </div>
          `).join('')}
          <button type="button" class="add-option-btn">Add Option</button>
        </div>
      `;
    case 'Linear Scale':
      const scale = data.scale || { min: 1, max: 5, minLabel: 'Low', maxLabel: 'High' };
      return `
        <div class="scale-settings">
          <div class="scale-inputs">
            <label>Min: <input type="number" class="scale-min" value="${scale.min}"></label>
            <label>Max: <input type="number" class="scale-max" value="${scale.max}"></label>
          </div>
          <div class="scale-labels">
            <label>Min Label: <input type="text" class="scale-min-label" value="${scale.minLabel}"></label>
            <label>Max Label: <input type="text" class="scale-max-label" value="${scale.maxLabel}"></label>
          </div>
        </div>
      `;
    default:
      return '';
  }
}

// Add event listeners for form type buttons
document.querySelectorAll('.form-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.form-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFormType = btn.dataset.type;
    document.getElementById('groupSelector').style.display = 
      currentFormType === 'private' ? 'block' : 'none';
    updateFormState();
  });
});

// Add event listeners for question type buttons
document.querySelectorAll('.question-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    addQuestion(btn.dataset.type);
  });
});

function setupOptionManagement(questionDiv) {
  const optionsContainer = questionDiv.querySelector('.options-container');
  
  // Add new option
  optionsContainer.querySelector('.add-option-btn').addEventListener('click', () => {
    const optionRow = document.createElement('div');
    optionRow.className = 'option-row';
    optionRow.innerHTML = `
      <input type="text" class="option-input" value="New Option">
      <button type="button" class="delete-option-btn">Delete</button>
    `;
    optionsContainer.insertBefore(optionRow, optionsContainer.lastElementChild);
    updateQuestions();
  });

  // Delete option
  optionsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-option-btn')) {
      e.target.parentElement.remove();
      updateQuestions();
    }
  });
}