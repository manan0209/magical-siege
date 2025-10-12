export const DOM = {
  createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.className) {
      element.className = options.className;
    }
    
    if (options.id) {
      element.id = options.id;
    }
    
    if (options.style) {
      Object.assign(element.style, options.style);
    }
    
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    if (options.innerHTML) {
      element.innerHTML = options.innerHTML;
    }
    
    if (options.textContent) {
      element.textContent = options.textContent;
    }
    
    if (options.children) {
      options.children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });
    }
    
    return element;
  },

  waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for ${selector}`));
      }, timeout);
    });
  },

  insertAfter(newNode, referenceNode) {
    if (referenceNode.nextSibling) {
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    } else {
      referenceNode.parentNode.appendChild(newNode);
    }
  },

  createSiegeCard(title, content) {
    const card = this.createElement('div', {
      className: 'home-card'
    });
    
    const body = this.createElement('div', {
      className: 'home-card-body'
    });
    
    if (title) {
      const titleElement = this.createElement('h3', {
        className: 'home-section-title',
        textContent: title
      });
      body.appendChild(titleElement);
    }
    
    if (typeof content === 'string') {
      body.innerHTML += content;
    } else {
      body.appendChild(content);
    }
    
    card.appendChild(body);
    return card;
  },

  createSiegeButton(text, onClick, variant = 'default') {
    const button = this.createElement('button', {
      className: 'submit-button',
      textContent: text
    });
    
    if (variant === 'primary') {
      button.style.background = 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)';
      button.style.color = 'white';
    } else if (variant === 'danger') {
      button.style.background = 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)';
      button.style.color = 'white';
    }
    
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }
};
