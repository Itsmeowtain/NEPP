import { auth, db } from '/config/firebase-config.js';
import { 
  collection,
  addDoc,
  getDocs, Timestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";


let currentFormType = 'public';
let questions = [];

// Initialize event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Form type selector
  document.querySelectorAll('.form-type-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.form-type-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentFormType = button.dataset.type;
      document.getElementById('groupSelector').style.display = 
        currentFormType === 'private' ? 'block' : 'none';
    });
  });

  // Question type buttons
  document.querySelectorAll('.question-type-btn').forEach(button => {
    button.addEventListener('click', () => {
      addQuestion(button.textContent.trim());
    });
  });

  // Cancel button event listener
  document.getElementById('cancelForm').addEventListener('click', () => {
    window.location.href = 'forms.html';
  });
});

// Load groups for the selector
async function loadGroups() {
  const groupsSelect = document.getElementById('group');
  try {
    const querySnapshot = await getDocs(collection(db, 'groups'));
    querySnapshot.forEach((doc) => {
      const group = doc.data();
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = group.name;
      groupsSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading groups:", error);
  }
}

// Add question function with improved functionality
function addQuestion(type) {
  const questionNumber = questions.length + 1;
  const questionData = {
    type: type,
    question: '',
    required: false,
    options: type === 'Multiple Choice' || type === 'Checkboxes' ? [''] : [],
    correctAnswer: type === 'Multiple Choice' ? '' : null,
    id: Date.now()
  };
  
  questions.push(questionData);
  
  const questionHTML = `
    <div class="question-card" data-id="${questionData.id}">
      <div class="question-header">
        <h4>Question ${questionNumber}</h4>
        <button type="button" class="delete-question-btn" onclick="deleteQuestion(${questionData.id})">Delete</button>
      </div>
      <div class="question-content">
        <input type="text" class="question-text" placeholder="Enter your question" required>
        <div class="question-options">
          ${getQuestionTypeHTML(type, questionData.id)}
        </div>
        <label class="required-toggle">
          <input type="checkbox" class="required-checkbox">
          Required
        </label>
      </div>
    </div>
  `;
  
  document.getElementById('questionsContainer').insertAdjacentHTML('beforeend', questionHTML);
}

function getQuestionTypeHTML(type, id) {
  switch (type.trim()) {
    case 'Multiple Choice':
      return `
        <div class="options-list" data-id="${id}">
          <div class="option-item">
            <input type="text" placeholder="Option 1" required>
            <input type="radio" name="correct-${id}" class="correct-option" style="width: 20px; height: 20px; margin: 0 10px;">
            <label style="color: #FFD600; margin-right: 10px;">Correct</label>
            <button type="button" class="remove-option-btn">Remove</button>
          </div>
          <button type="button" class="add-option-btn">Add Option</button>
        </div>
      `;
    case 'Checkboxes':
      return `
        <div class="options-list" data-id="${id}">
          <div class="option-item">
            <input type="text" placeholder="Option 1" required>
            <input type="checkbox" class="checkbox-option" style="width: 20px; height: 20px; margin: 0 10px;">
            <button type="button" class="remove-option-btn">Remove</button>
          </div>
          <button type="button" class="add-option-btn">Add Option</button>
        </div>
      `;
    case 'Short Answer':
      return '<input type="text" disabled placeholder="Short answer text">';
    case 'Long Answer':
      return '<textarea disabled placeholder="Long answer text"></textarea>';
    case 'File Upload':
      return `
        <div class="file-upload-config">
          <label>Allowed file types:</label>
          <div class="file-types">
            <label><input type="checkbox" value="pdf"> PDF</label>
            <label><input type="checkbox" value="image"> Images</label>
            <label><input type="checkbox" value="doc"> Documents</label>
          </div>
          <label>Max file size (MB):</label>
          <input type="number" min="1" max="50" value="10" class="file-size-limit">
        </div>
      `;
    case 'Poll':
      return `
        <div class="options-list" data-id="${id}">
          <div class="option-item">
            <input type="text" placeholder="Option 1" required>
            <button type="button" class="remove-option-btn">Remove</button>
          </div>
          <button type="button" class="add-option-btn">Add Option</button>
        </div>
      `;
    case 'Linear Scale':
      return `
        <div class="linear-scale-config">
          <div class="scale-inputs">
            <div>
              <label>Start:</label>
              <input type="number" min="0" max="10" value="0" class="scale-start">
            </div>
            <div>
              <label>End:</label>
              <input type="number" min="0" max="10" value="5" class="scale-end">
            </div>
          </div>
          <div class="scale-labels">
            <input type="text" placeholder="Start label (e.g., Poor)" class="scale-start-label">
            <input type="text" placeholder="End label (e.g., Excellent)" class="scale-end-label">
          </div>
        </div>
      `;
    default:
      return '';
  }
}

// Delete question function
window.deleteQuestion = function(id) {
  const questionElement = document.querySelector(`.question-card[data-id="${id}"]`);
  if (questionElement) {
    questionElement.remove();
    questions = questions.filter(q => q.id !== id);
    updateQuestionNumbers();
  }
};

function updateQuestionNumbers() {
  document.querySelectorAll('.question-card').forEach((card, index) => {
    card.querySelector('h4').textContent = `Question ${index + 1}`;
  });
}

// Add event delegation for dynamically added elements
document.getElementById('questionsContainer').addEventListener('click', (e) => {
  if (e.target.classList.contains('add-option-btn')) {
    const optionsList = e.target.closest('.options-list');
    const questionId = optionsList.dataset.id;
    const optionsCount = optionsList.querySelectorAll('.option-item').length;
    const newOption = document.createElement('div');
    newOption.className = 'option-item';
    
    if (optionsList.querySelector('.correct-option')) {
      // Multiple Choice
      newOption.innerHTML = `
        <input type="text" placeholder="Option ${optionsCount + 1}" required>
        <input type="radio" name="correct-${questionId}" class="correct-option" style="width: 20px; height: 20px; margin: 0 10px;">
        <label style="color: #FFD600; margin-right: 10px;">Correct</label>
        <button type="button" class="remove-option-btn">Remove</button>
      `;
    } else if (optionsList.querySelector('.checkbox-option')) {
      // Checkboxes
      newOption.innerHTML = `
        <input type="text" placeholder="Option ${optionsCount + 1}" required>
        <input type="checkbox" class="checkbox-option" style="width: 20px; height: 20px; margin: 0 10px;">
        <button type="button" class="remove-option-btn">Remove</button>
      `;
    } else {
      // Poll or other
      newOption.innerHTML = `
        <input type="text" placeholder="Option ${optionsCount + 1}" required>
        <button type="button" class="remove-option-btn">Remove</button>
      `;
    }
    
    optionsList.insertBefore(newOption, e.target);
  } else if (e.target.classList.contains('remove-option-btn')) {
    const optionItem = e.target.closest('.option-item');
    const optionsList = optionItem.parentElement;
    if (optionsList.querySelectorAll('.option-item').length > 1) {
      optionItem.remove();
    }
  }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  loadGroups();
});

// Form submission handler
document.getElementById('createFormForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Gather all question data
  const formQuestions = [];
  document.querySelectorAll('.question-card').forEach(card => {
    const id = card.dataset.id;
    const question = {
      id: id,
      type: questions.find(q => q.id.toString() === id).type,
      question: card.querySelector('.question-text').value,
      required: card.querySelector('.required-checkbox').checked
    };

    // Handle different question types
    const optionsList = card.querySelector('.options-list');
    if (optionsList) {
      question.options = Array.from(optionsList.querySelectorAll('.option-item input[type="text"]'))
        .map(input => input.value);
      
      if (question.type === 'Multiple Choice') {
        const correctOption = optionsList.querySelector('input[type="radio"]:checked');
        question.correctAnswer = correctOption ? 
          Array.from(optionsList.querySelectorAll('.option-item')).indexOf(correctOption.closest('.option-item')) : -1;
      }
    }

    if (question.type === 'File Upload') {
      const config = card.querySelector('.file-upload-config');
      question.fileTypes = Array.from(config.querySelectorAll('.file-types input:checked'))
        .map(input => input.value);
      question.maxFileSize = parseInt(config.querySelector('.file-size-limit').value);
    }

    if (question.type === 'Linear Scale') {
      const config = card.querySelector('.linear-scale-config');
      question.scaleStart = parseInt(config.querySelector('.scale-start').value);
      question.scaleEnd = parseInt(config.querySelector('.scale-end').value);
      question.startLabel = config.querySelector('.scale-start-label').value;
      question.endLabel = config.querySelector('.scale-end-label').value;
    }

    formQuestions.push(question);
  });

  try {
  const formData = {
  title: document.getElementById('formTitle').value,
  description: document.getElementById('formDescription').value,
  dueDate: Timestamp.fromDate(new Date(document.getElementById('dueDate').value)),
  type: currentFormType,
  createdBy: auth.currentUser.uid,
  creatorName: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous',
  createdAt: Timestamp.now(),
  questions: formQuestions,
  group: currentFormType === 'private' ? document.getElementById('group').value : null
  };

    await addDoc(collection(db, 'forms'), formData);
    window.location.href = 'forms.html';
  } catch (error) {
    console.error('Error creating form:', error);
    alert('Error creating form: ' + error.message);
  }
});

if (!formData.title || formQuestions.length === 0 || !formData.dueDate) {
  alert('Please complete all required fields including at least one question.');
  return;
}