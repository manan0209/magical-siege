import { injectKeepEnhancements } from './injectors/keep.js';
import { injectArmoryEnhancements } from './injectors/armory.js';
import { injectGreatHallEnhancements } from './injectors/great-hall.js';
import { injectMarketEnhancements } from './injectors/market.js';
import { injectCastleEnhancements } from './injectors/castle.js';
import { injectGlobalEnhancements } from './injectors/global.js';
import { injectMagicalMeeple } from './injectors/magical-meeple.js';
import { injectFallTheme } from './injectors/fall-theme.js';
import { injectSpookyDoor } from './injectors/spooky-door.js';
import { injectTreasuryGrid } from './injectors/treasury-grid.js';
import { initXRayScanner } from './injectors/xray-scanner.js';

const PAGES = {
  KEEP: '/keep',
  ARMORY: '/armory',
  GREAT_HALL: '/great-hall',
  MARKET: '/market',
  CHAMBERS: '/chambers'
};

class MagicalSiege {
  constructor() {
    this.currentPage = this.detectPage();
    this.init();
  }

  detectPage() {
    const path = window.location.pathname;
    
    for (const [key, value] of Object.entries(PAGES)) {
      if (path.startsWith(value)) {
        return key;
      }
    }
    
    return null;
  }

  async init() {
    injectGlobalEnhancements();
    injectMagicalMeeple();
    injectSpookyDoor();
    injectTreasuryGrid();
    initXRayScanner();

    if (!this.currentPage) {
      return;
    }

    switch (this.currentPage) {
      case 'KEEP':
        await this.enhanceKeep();
        break;
      case 'ARMORY':
        await this.enhanceArmory();
        break;
      case 'GREAT_HALL':
        await this.enhanceGreatHall();
        break;
      case 'MARKET':
        await this.enhanceMarket();
        break;
      case 'CASTLE':
        await this.enhanceCastle();
        break;
    }
  }

  async enhanceKeep() {
    injectKeepEnhancements();
    injectFallTheme();
  }

  async enhanceArmory() {
    injectArmoryEnhancements();
  }

  async enhanceGreatHall() {
    injectGreatHallEnhancements();
  }

  async enhanceMarket() {
    injectMarketEnhancements();
  }

  async enhanceCastle() {
    injectCastleEnhancements();
  }
}

let magicalSiegeInstance = null;

function isExtensionValid() {
  try {
    return chrome?.runtime?.id !== undefined;
  } catch {
    return false;
  }
}

function initializeMagicalSiege() {
  if (!isExtensionValid()) {
    return;
  }
  
  try {
    if (magicalSiegeInstance) {
      magicalSiegeInstance = null;
    }
    
    magicalSiegeInstance = new MagicalSiege();
  } catch (error) {
    if (!error.message?.includes('Extension context invalidated')) {
      console.error('[Magical Siege] Error during initialization:', error);
    }
  }
}

function waitForDOM(callback, maxAttempts = 50) {
  let attempts = 0;
  
  const check = () => {
    attempts++;
    
    if (document.body && document.querySelector('main')) {
      callback();
    } else if (attempts < maxAttempts) {
      requestAnimationFrame(check);
    } else {
      callback();
    }
  };
  
  check();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => waitForDOM(initializeMagicalSiege));
} else {
  waitForDOM(initializeMagicalSiege);
}

document.addEventListener('turbo:load', () => {
  waitForDOM(initializeMagicalSiege);
});

document.addEventListener('turbo:render', () => {
});

document.addEventListener('turbo:before-cache', () => {
  if (magicalSiegeInstance) {
    magicalSiegeInstance = null;
  }
});

document.addEventListener('click', (e) => {
  const theme = document.body.className.match(/ms-theme-(\w+)/)?.[1];
  
  if (theme === 'magical') {
    const x = e.clientX;
    const y = e.clientY;

    const ripple = document.createElement('div');
    ripple.className = 'magical-ripple';
    ripple.style.left = `${x - 10}px`;
    ripple.style.top = `${y - 10}px`;
    document.body.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);

    for (let i = 0; i < 6; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'magical-sparkle';
      
      const angle = (Math.PI * 2 * i) / 6;
      const distance = 40 + Math.random() * 40;
      const sparkleX = Math.cos(angle) * distance;
      const sparkleY = Math.sin(angle) * distance;
      
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      sparkle.style.setProperty('--sparkle-x', `${sparkleX}px`);
      sparkle.style.setProperty('--sparkle-y', `${sparkleY}px`);
      
      document.body.appendChild(sparkle);
      
      setTimeout(() => sparkle.remove(), 800);
    }
  } else if (theme === 'space') {
    const x = e.clientX;
    const y = e.clientY;

    const laser = document.createElement('div');
    laser.className = 'space-laser';
    laser.style.left = `${x}px`;
    laser.style.top = `${y}px`;
    document.body.appendChild(laser);

    setTimeout(() => laser.remove(), 300);

    const hitCard = checkCollisionWithFallingProjects(x, y);
    
    if (hitCard) {
      destroyFallingCard(hitCard, x, y);
    } else {
      const impact = document.createElement('div');
      impact.className = 'space-laser-impact';
      impact.style.left = `${x}px`;
      impact.style.top = `${y}px`;
      document.body.appendChild(impact);

      setTimeout(() => impact.remove(), 500);

      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'space-particle';
        
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 30 + Math.random() * 20;
        const particleX = Math.cos(angle) * distance;
        const particleY = Math.sin(angle) * distance;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--particle-x', `${particleX}px`);
        particle.style.setProperty('--particle-y', `${particleY}px`);
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 600);
      }
    }
  }
});

function checkCollisionWithFallingProjects(x, y) {
  const fallingCards = document.querySelectorAll('.ms-falling-card');
  
  for (const card of fallingCards) {
    const rect = card.getBoundingClientRect();
    
    if (x >= rect.left && x <= rect.right) {
      return card;
    }
  }
  
  return null;
}

function destroyFallingCard(card, x, y) {
  const rect = card.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  card.style.transition = 'all 0.3s ease-out';
  card.style.transform = 'scale(0) rotate(180deg)';
  card.style.opacity = '0';
  
  const explosion = document.createElement('div');
  explosion.className = 'space-explosion';
  explosion.style.left = `${centerX}px`;
  explosion.style.top = `${centerY}px`;
  document.body.appendChild(explosion);
  
  setTimeout(() => explosion.remove(), 600);
  
  for (let i = 0; i < 16; i++) {
    const fragment = document.createElement('div');
    fragment.className = 'space-fragment';
    
    const angle = (Math.PI * 2 * i) / 16;
    const distance = 60 + Math.random() * 40;
    const fragmentX = Math.cos(angle) * distance;
    const fragmentY = Math.sin(angle) * distance;
    
    fragment.style.left = `${centerX}px`;
    fragment.style.top = `${centerY}px`;
    fragment.style.setProperty('--fragment-x', `${fragmentX}px`);
    fragment.style.setProperty('--fragment-y', `${fragmentY}px`);
    
    document.body.appendChild(fragment);
    
    setTimeout(() => fragment.remove(), 800);
  }
  
  setTimeout(() => card.remove(), 300);
}
