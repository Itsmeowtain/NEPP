# Sidebar Component Refactor

This document explains the new sidebar component system that eliminates code duplication across HTML pages.

## Overview

The sidebar has been refactored into a reusable component that automatically:
- Loads sidebar HTML content from a single source
- Handles user authentication state
- Updates user information display
- Highlights the current page
- Provides shared authentication state across all modules

## Files Created

### 1. `public/components/sidebar.html`
Contains the complete sidebar HTML markup including:
- Logo
- Navigation links
- User information section

### 2. `public/components/sidebar.js`
JavaScript module that:
- Loads sidebar HTML dynamically
- Manages sidebar behavior
- Handles current page highlighting
- Updates user info when auth state changes

### 3. `public/utils/auth-manager.js`
Global authentication manager that:
- Provides centralized auth state management
- Allows multiple modules to subscribe to auth changes
- Eliminates duplicate auth listeners across pages

## How to Use

### For New HTML Pages

1. Replace the sidebar content with an empty container:
```html
<aside class="sidebar">
  <!-- Sidebar content will be loaded here by sidebar.js -->
</aside>
```

2. Add the sidebar script before your page-specific script:
```html
<script type="module" src="/components/sidebar.js"></script>
<script type="module" src="/your-page.js"></script>
```

### For JavaScript Modules

1. Import the auth manager for user state:
```javascript
import authManager from './utils/auth-manager.js';
```

2. Subscribe to auth changes:
```javascript
authManager.onAuthStateChanged((user) => {
  if (user) {
    this.currentUser = user;
    // Handle authenticated user
  } else {
    // Handle unauthenticated state
  }
});
```

3. Get current user anytime:
```javascript
const currentUser = authManager.getCurrentUser();
```

## Updated Files

### `public/announcements.html`
- Replaced sidebar HTML with empty container
- Added sidebar.js import

### `public/resources.html`
- Replaced sidebar HTML with empty container
- Added sidebar.js import

### `public/resources.js`
- Removed duplicate `updateSidebarUser()` method
- Updated to use global auth manager
- Simplified auth listener setup

## Benefits

1. **DRY Principle**: Sidebar HTML and logic defined once
2. **Consistency**: All pages use identical sidebar
3. **Maintainability**: Update sidebar in one place
4. **Performance**: Shared auth state prevents duplicate listeners
5. **Scalability**: Easy to add new pages

## Next Steps

Apply the same pattern to remaining HTML files:
- `dashboard.html`
- `groups.html`
- `forms.html`
- `events.html`
- `profile.html`

For each file:
1. Replace sidebar content with empty container
2. Add sidebar.js import
3. Update corresponding JS file to use auth manager
4. Remove duplicate sidebar-related methods

## Active Page Highlighting

The sidebar automatically highlights the current page by:
1. Getting the current page filename from `window.location.pathname`
2. Adding the `active` class to matching navigation links
3. You can style active links in your CSS:

```css
.sidebar-item.active {
  background-color: var(--primary-color);
  color: white;
}
```
