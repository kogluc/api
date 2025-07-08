export function applyTheme(theme) {
  localStorage.setItem('theme', theme);
  
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else if (theme === 'light') {
    document.body.classList.remove('dark-mode');
  } else if (theme === 'auto') {
    const hour = new Date().getHours();
    if (hour > 6 && hour < 18) {
      document.body.classList.remove('dark-mode');
    } else {
      document.body.classList.add('dark-mode');
    }
  } else if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}

// Tema seçenekleri için dropdown yönetimi
export function setupThemeDropdown() {
  const themeDropdown = document.getElementById('themeDropdown');
  const themeOptions = document.querySelectorAll('.theme-option');
  
  if (!themeDropdown) return;

  let dropdownTimeout;
  let isDesktop = window.matchMedia("(min-width: 768px)").matches;

  function handleScreenChange(e) {
    isDesktop = e.matches;
    
    themeDropdown.removeEventListener('mouseenter', handleMouseEnter);
    themeDropdown.removeEventListener('mouseleave', handleMouseLeave);
    document.removeEventListener('click', handleDocumentClick);
    themeDropdown.removeEventListener('click', handleThemeDropdownClick);

    if (isDesktop) {
      themeDropdown.addEventListener('mouseenter', handleMouseEnter);
      themeDropdown.addEventListener('mouseleave', handleMouseLeave);
      themeDropdown.addEventListener('click', (e) => e.preventDefault());
    } else {
      themeDropdown.addEventListener('click', handleThemeDropdownClick);
      document.addEventListener('click', handleDocumentClick);
    }
  }

  function handleMouseEnter() {
    clearTimeout(dropdownTimeout);
    themeDropdown.classList.add('show');
  }

  function handleMouseLeave() {
    dropdownTimeout = setTimeout(() => {
      themeDropdown.classList.remove('show');
    }, 300);
  }

  function handleThemeDropdownClick(e) {
    e.stopPropagation();
    themeDropdown.classList.toggle('show');
  }

  function handleDocumentClick(e) {
    if (!themeDropdown.contains(e.target)) {
      themeDropdown.classList.remove('show');
    }
  }

  // İlk ayar
  const mediaQuery = window.matchMedia('(min-width: 768px)');
  mediaQuery.addEventListener('change', handleScreenChange);
  handleScreenChange(mediaQuery);

  // Tema seçenekleri
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const selectedTheme = option.getAttribute('data-theme');
      localStorage.setItem('theme', selectedTheme);
      applyTheme(selectedTheme);
      
      themeOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
    });
  });
}