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
  CASTLE: '/castle',
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
    console.log(`Magical Siege initializing on: ${window.location.pathname}`);
    console.log(`Detected page: ${this.currentPage || 'Unknown'}`);

    injectGlobalEnhancements();
    injectMagicalMeeple();

    if (!this.currentPage) {
      console.log('Page not recognized, but global features active');
      return;
    }

    console.log(`Magical Siege active on: ${this.currentPage}`);

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
      default:
        console.log('Page detected but no enhancements yet');
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new MagicalSiege());
} else {
  new MagicalSiege();
}

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
