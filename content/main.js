import { injectKeepEnhancements } from './injectors/keep.js';
import { injectArmoryEnhancements } from './injectors/armory.js';
import { injectGreatHallEnhancements } from './injectors/great-hall.js';
import { injectMarketEnhancements } from './injectors/market.js';
import { injectCastleEnhancements } from './injectors/castle.js';
import { injectGlobalEnhancements } from './injectors/global.js';

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
