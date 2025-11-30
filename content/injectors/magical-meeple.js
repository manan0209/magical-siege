let meepleObserver = null;
let replacementIntervals = [];
let currentTheme = null;

export function injectMagicalMeeple() {
  //lol olive haha, its free nowwww :hehe: pls dont kill me for this :hehe:

  checkThemeAndActivate();
  
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        checkThemeAndActivate();
      }
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-ms-theme') {
        checkThemeAndActivate();
      }
    }
  });
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'data-ms-theme']
  });
}

// I'll add a free cosmetic each remaining week now!! you get free hat this week :hehe: :p
function getCurrentTheme() {
  const dataTheme = document.body.getAttribute('data-ms-theme');
  if (dataTheme) return dataTheme;
  
  if (document.body.classList.contains('ms-theme-magical')) return 'magical';
  if (document.body.classList.contains('ms-theme-dark')) return 'dark';
  if (document.body.classList.contains('ms-theme-space')) return 'space';
  if (document.body.classList.contains('ms-theme-winter')) return 'winter';
  
  return 'default';
}

function checkThemeAndActivate() {
  const newTheme = getCurrentTheme();
  
  if (newTheme !== currentTheme) {
    deactivateMagicalMeeple();
    currentTheme = newTheme;
    
    if (newTheme === 'magical') {
      activateMagicalMeeple();
    } else if (newTheme === 'default') {
      activateDefaultCosmetics();
    } else if (newTheme === 'winter') {
      activateWinterCosmetics();
    }
  }
}

function deactivateMagicalMeeple() {
  if (meepleObserver) {
    meepleObserver.disconnect();
    meepleObserver = null;
  }
  
  replacementIntervals.forEach(interval => clearInterval(interval));
  replacementIntervals = [];
  
  document.querySelectorAll('[data-free-cosmetic]').forEach(el => el.remove());
}

function activateMagicalMeeple() {
  startMeepleReplacer();
}

function activateDefaultCosmetics() {
  startCowboyHatInjector();
}

function activateWinterCosmetics() {
  startSailorHatInjector();
}

function startMeepleReplacer() {
  const orangeMeepleUrl = chrome.runtime.getURL('assets/meeple-orange.png');
  
  function replaceUserMeepleOnly() {
    const navbarMeeple = document.querySelector('#navbar-meeple-container img[src*="meeple"]');
    if (navbarMeeple && !navbarMeeple.src.includes('meeple-orange')) {
      navbarMeeple.src = orangeMeepleUrl;
      navbarMeeple.style.filter = 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.6))';
      navbarMeeple.dataset.magicalReplaced = 'true';
    }
    
    const homeMeepleContainers = [
      document.querySelector('#home-meeple-container'),
      document.querySelector('#home-meeple-container-2')
    ];
    
    homeMeepleContainers.forEach(container => {
      if (!container) return;
      
      const meepleImg = container.querySelector('img[src*="meeple"]');
      if (meepleImg && !meepleImg.src.includes('meeple-orange')) {
        meepleImg.src = orangeMeepleUrl;
        meepleImg.style.filter = 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.6))';
        meepleImg.dataset.magicalReplaced = 'true';
      }
      
      const canvas = container.querySelector('canvas');
      if (canvas && !container.dataset.magicalReplaced) {
        const img = document.createElement('img');
        img.src = orangeMeepleUrl;
        img.style.cssText = `
          width: ${canvas.width || 84}px;
          height: ${canvas.height || 84}px;
          object-fit: contain;
          filter: drop-shadow(0 0 8px rgba(251, 146, 60, 0.6));
        `;
        canvas.replaceWith(img);
        container.dataset.magicalReplaced = 'true';
      }
    });
  }
  
  replaceUserMeepleOnly();
  setTimeout(replaceUserMeepleOnly, 500);
  setTimeout(replaceUserMeepleOnly, 1000);
  
  meepleObserver = new MutationObserver(() => {
    if (currentTheme === 'magical') {
      replaceUserMeepleOnly();
    }
  });
  
  meepleObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  const interval = setInterval(() => {
    if (currentTheme === 'magical') {
      replaceUserMeepleOnly();
    }
  }, 3000);
  
  replacementIntervals.push(interval);
}


function startCowboyHatInjector() {
  const cowboyHatUrl = chrome.runtime.getURL('assets/cowboyHat.png');
  
  function addCowboyHat() {
    const navbarContainer = document.querySelector('#navbar-meeple-container') || 
                           document.querySelector('.navbar .meeple-avatar');
    
    if (!navbarContainer) return;
    if (navbarContainer.querySelector('[data-free-cosmetic="Cowboy Hat"]')) return;

    const baseMeeple = navbarContainer.querySelector('img[src*="meeple"]');
    if (!baseMeeple) return;

    const hatImg = document.createElement('img');
    hatImg.src = cowboyHatUrl;
    hatImg.alt = 'Cowboy Hat';
    hatImg.dataset.freeCosmetic = 'Cowboy Hat';
    hatImg.style.position = 'absolute';
    hatImg.style.top = baseMeeple.style.top || '0px';
    hatImg.style.left = baseMeeple.style.left || '0px';
    hatImg.style.width = baseMeeple.style.width || `${baseMeeple.offsetWidth || 84}px`;
    hatImg.style.height = baseMeeple.style.height || `${baseMeeple.offsetHeight || 84}px`;
    hatImg.style.objectFit = 'contain';
    hatImg.style.pointerEvents = 'none';
    hatImg.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))';
    
    const baseZIndex = parseInt(baseMeeple.style.zIndex) || 1;
    hatImg.style.zIndex = `${baseZIndex + 1}`;
    
    navbarContainer.appendChild(hatImg);
  }
  
  addCowboyHat();
  setTimeout(addCowboyHat, 500);
  setTimeout(addCowboyHat, 1000);
  
  meepleObserver = new MutationObserver(() => {
    if (currentTheme === 'default') {
      addCowboyHat();
    }
  });
  
  meepleObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  const interval = setInterval(() => {
    if (currentTheme === 'default') {
      addCowboyHat();
    }
  }, 3000);
  
  replacementIntervals.push(interval);
}

function startSailorHatInjector() {
  const sailorHatUrl = chrome.runtime.getURL('assets/sailorHat.png');
  
  function addSailorHat() {
    const navbarContainer = document.querySelector('#navbar-meeple-container') || 
                           document.querySelector('.navbar .meeple-avatar');
    
    if (!navbarContainer) return;
    if (navbarContainer.querySelector('[data-free-cosmetic="Sailor Hat"]')) return;

    const baseMeeple = navbarContainer.querySelector('img[src*="meeple"]');
    if (!baseMeeple) return;

    const hatImg = document.createElement('img');
    hatImg.src = sailorHatUrl;
    hatImg.alt = 'Sailor Hat';
    hatImg.dataset.freeCosmetic = 'Sailor Hat';
    hatImg.style.position = 'absolute';
    hatImg.style.top = baseMeeple.style.top || '0px';
    hatImg.style.left = baseMeeple.style.left || '0px';
    hatImg.style.width = baseMeeple.style.width || `${baseMeeple.offsetWidth || 84}px`;
    hatImg.style.height = baseMeeple.style.height || `${baseMeeple.offsetHeight || 84}px`;
    hatImg.style.objectFit = 'contain';
    hatImg.style.pointerEvents = 'none';
    hatImg.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))';
    
    const baseZIndex = parseInt(baseMeeple.style.zIndex) || 1;
    hatImg.style.zIndex = `${baseZIndex + 1}`;
    
    navbarContainer.appendChild(hatImg);
  }
  
  addSailorHat();
  setTimeout(addSailorHat, 500);
  setTimeout(addSailorHat, 1000);
  
  meepleObserver = new MutationObserver(() => {
    if (currentTheme === 'winter') {
      addSailorHat();
    }
  });
  
  meepleObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  const interval = setInterval(() => {
    if (currentTheme === 'winter') {
      addSailorHat();
    }
  }, 3000);
  
  replacementIntervals.push(interval);
}