// Example like functionality for announcements
// Add this to your announcements.js file

class AnnouncementLikes {
  constructor() {
    this.initializeLikeButtons();
  }

  initializeLikeButtons() {
    // Add like buttons to existing announcements
    document.querySelectorAll('.announcement-item').forEach(item => {
      this.addLikeButton(item);
    });
  }

  addLikeButton(announcementElement) {
    const announcementId = announcementElement.dataset.id;
    if (!announcementId) return;

    // Create like button if it doesn't exist
    let likeButton = announcementElement.querySelector('.like-button');
    if (!likeButton) {
      likeButton = document.createElement('button');
      likeButton.className = 'like-button';
      likeButton.innerHTML = `
        <span class="like-icon">👍</span>
        <span class="like-count">0</span>
      `;
      announcementElement.appendChild(likeButton);

      // Add click event
      likeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleLike(announcementId, likeButton);
      });
    }

    // Load current like status
    this.loadLikeStatus(announcementId, likeButton);
  }

  async toggleLike(announcementId, button) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const announcementRef = doc(db, 'announcements', announcementId);
      const announcementDoc = await getDoc(announcementRef);
      
      if (!announcementDoc.exists()) return;

      const data = announcementDoc.data();
      const likes = data.likes || [];
      const likeCount = data.likeCount || 0;
      const userLiked = likes.includes(user.uid);

      let newLikes, newLikeCount;
      if (userLiked) {
        // Remove like
        newLikes = likes.filter(uid => uid !== user.uid);
        newLikeCount = Math.max(0, likeCount - 1);
        button.classList.remove('liked');
      } else {
        // Add like
        newLikes = [...likes, user.uid];
        newLikeCount = likeCount + 1;
        button.classList.add('liked');
      }

      // Update Firestore
      await updateDoc(announcementRef, {
        likes: newLikes,
        likeCount: newLikeCount
      });

      // Update UI
      const countElement = button.querySelector('.like-count');
      if (countElement) {
        countElement.textContent = newLikeCount;
      }

    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  async loadLikeStatus(announcementId, button) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const announcementRef = doc(db, 'announcements', announcementId);
      const announcementDoc = await getDoc(announcementRef);
      
      if (!announcementDoc.exists()) return;

      const data = announcementDoc.data();
      const likes = data.likes || [];
      const likeCount = data.likeCount || 0;
      const userLiked = likes.includes(user.uid);

      // Update button state
      if (userLiked) {
        button.classList.add('liked');
      } else {
        button.classList.remove('liked');
      }

      // Update count
      const countElement = button.querySelector('.like-count');
      if (countElement) {
        countElement.textContent = likeCount;
      }

    } catch (error) {
      console.error('Error loading like status:', error);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const likeManager = new AnnouncementLikes();
});
