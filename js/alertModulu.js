export function showAlert(message, type = 'info', duration = 3000) {
  const alertBox = document.getElementById('alert');
  const messageBox = document.getElementById('alertMessage');
  const iconBox = document.getElementById('alertIcon');

  const icons = {
    success: '<span class="gg-check"></span>',
    error: '<span class="gg-info !rotate-180"></span>',
    warning: '<span class="gg-warning"></span>',
    info: '<span class="gg-info"></span>',
    clean: '<span class="gg-trash"></span>',
    dark: '<span class="gg-moon"></span>',
    light: '<span class="gg-sun"></span>',
    auto: '<span class="gg-auto"></span>',
    system: '<span class="gg-screen"></span>',
  };

  const bgColors = {
    success: 'bg-success',
    error: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-primary',
    clean: 'bg-danger',
    dark: 'bg-dark',
    light: 'bg-primary',
    auto: 'bg-primary',
    system: 'bg-primary',
  };

  if (messageBox) messageBox.textContent = message;
  if (iconBox) iconBox.innerHTML = icons[type] || '<span class="gg-info"></span>';
  
  const bgClass = bgColors[type] || 'bg-info';
  if (alertBox) alertBox.className = `alert show ${bgClass}`;
  
  clearTimeout(window.alertTimeout);
  window.alertTimeout = setTimeout(hideAlert, duration);
}

export function hideAlert() {
  const alertBox = document.getElementById('alert');
  if (alertBox) {
    alertBox.classList.remove('show');
    alertBox.classList.add('hidden');
  }
}