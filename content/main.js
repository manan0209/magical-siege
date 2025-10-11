import { injectKeepEnhancements } from './injectors/keep.js';
import { injectArmoryEnhancements } from './injectors/armory.js';
import { injectGreatHallEnhancements } from './injectors/great-hall.js';
import { injectMarketEnhancements } from './injectors/market.js';
import { injectCastleEnhancements } from './injectors/castle.js';
import { injectGlobalEnhancements } from './injectors/global.js';

const PAGES = {
  KEEP: '/keep',
  ARMORY: '/projects',
  GREAT_HALL: '/great_hall',
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
    if (!this.currentPage) {
      return;
    }

    console.log(`Magical Siege active on: ${this.currentPage}`);

    injectGlobalEnhancements();

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
