export const Notifications = {
  show(message, options = {}) {
    const {
      duration = 3000,
      type = 'info',
      position = 'top-right'
    } = options;
    
    const notification = document.createElement('div');
    notification.className = 'ms-notification';
    notification.style.cssText = this.getPositionStyles(position);
    
    const colors = {
      info: '#8B5CF6',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626'
    };
    
    notification.innerHTML = `
      <div style="
        background: rgba(255,255,255,0.95);
        border: 2px solid ${colors[type]};
        border-radius: 12px;
        padding: 1rem 1.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'IM Fell English', serif;
        color: #3b2a1a;
        animation: slideIn 0.3s ease;
      ">
        ${message}
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },

  getPositionStyles(position) {
    const positions = {
      'top-right': 'position: fixed; top: 2rem; right: 2rem; z-index: 10000;',
      'top-left': 'position: fixed; top: 2rem; left: 2rem; z-index: 10000;',
      'bottom-right': 'position: fixed; bottom: 2rem; right: 2rem; z-index: 10000;',
      'bottom-left': 'position: fixed; bottom: 2rem; left: 2rem; z-index: 10000;',
      'top-center': 'position: fixed; top: 2rem; left: 50%; transform: translateX(-50%); z-index: 10000;'
    };
    
    return positions[position] || positions['top-right'];
  }
};
