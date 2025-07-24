export function createSidebar(activePage) {
  const navItems = [
    { href: 'dashboard.html', icon: 'dashboard.png', text: 'Dashboard' },
    { href: 'announcements.html', icon: 'announcements.png', text: 'Announcements' },
    { href: 'groups.html', icon: 'groups.png', text: 'Groups' },
    { href: 'resources.html', icon: 'resources.png', text: 'Resources' },
    { href: 'quizzes.html', icon: 'quizzes.png', text: 'Quizzes' },
    { href: 'events.html', icon: 'events.png', text: 'Events' },
    { href: 'profile.html', icon: 'profile.png', text: 'Profile' }
  ];

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';

  const navHTML = navItems.map(item => `
    <a class="sidebar-item ${item.href.includes(activePage) ? 'active' : ''}" href="${item.href}">
      <span class="sidebar-icon">
        <img src="/images/icons/${item.icon}" alt="${item.text}" class="nav-icon">
      </span>
      ${item.text}
    </a>
  `).join('');

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <img src="/images/logo.png" alt="NEPP Logo">
    </div>
    <nav class="sidebar-nav">
      ${navHTML}
    </nav>
    <div class="sidebar-user">
      <span class="sidebar-user-badge">
        <img src="/images/icons/verified.png" alt="Verified" class="verified-icon">
      </span>
      <div>
        <span class="sidebar-user-name" id="sidebar-user-name">NEPP User</span>
        <span class="sidebar-user-verified">Verified</span>
      </div>
    </div>
  `;

  return sidebar;
}