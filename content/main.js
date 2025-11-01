import { injectKeepEnhancements } from './injectors/keep.js';
import { injectArmoryEnhancements } from './injectors/armory.js';
import { injectGreatHallEnhancements } from './injectors/great-hall.js';
import { injectMarketEnhancements } from './injectors/market.js';
import { injectCastleEnhancements } from './injectors/castle.js';
import { injectGlobalEnhancements } from './injectors/global.js';
import { injectMagicalMeeple } from './injectors/magical-meeple.js';
import { injectFallTheme } from './injectors/fall-theme.js';

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

function initializeMagicalSiege() {
  try {
    if (magicalSiegeInstance) {
      magicalSiegeInstance = null;
    }
    
    magicalSiegeInstance = new MagicalSiege();
  } catch (error) {
    console.error('[Magical Siege] Error during initialization:', error);
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
  if (theme !== 'magical') return;

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
});
