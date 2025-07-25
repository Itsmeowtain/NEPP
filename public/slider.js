<<<<<<< HEAD
import { CONSTANTS } from './config/constants.js';

// For homepage hero slider
const slides = document.querySelectorAll('.slide');
let current = 0;
function showNextSlide() {
  slides[current].classList.remove('active');
  current = (current + 1) % slides.length;
  slides[current].classList.add('active');
}
=======
import { CONSTANTS } from './config/constants.js';

// For homepage hero slider
const slides = document.querySelectorAll('.slide');
let current = 0;
function showNextSlide() {
  slides[current].classList.remove('active');
  current = (current + 1) % slides.length;
  slides[current].classList.add('active');
}
>>>>>>> cde9eecef83a6e26d598ee3b0b4203a0e682cda7
setInterval(showNextSlide, CONSTANTS.TIMING.SLIDER_INTERVAL);