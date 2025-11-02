let meepleObserver = null;
let replacementIntervals = [];
let currentlyActive = false;

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

function checkThemeAndActivate() {
  const isMagicalTheme = document.body.classList.contains('ms-theme-magical') ||
                        document.body.getAttribute('data-ms-theme') === 'magical';
  
  if (isMagicalTheme && !currentlyActive) {
    activateMagicalMeeple();
  } else if (!isMagicalTheme && currentlyActive) {
    deactivateMagicalMeeple();
  }
}

function deactivateMagicalMeeple() {
  currentlyActive = false;
  
  if (meepleObserver) {
    meepleObserver.disconnect();
    meepleObserver = null;
  }
  
  replacementIntervals.forEach(interval => clearInterval(interval));
  replacementIntervals = [];
}

function activateMagicalMeeple() {
  if (currentlyActive) return;
  currentlyActive = true;
  
  startMeepleReplacer();
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
    if (currentlyActive) {
      replaceUserMeepleOnly();
    }
  });
  
  meepleObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  const interval = setInterval(() => {
    if (currentlyActive) {
      replaceUserMeepleOnly();
    }
  }, 3000);
  
  replacementIntervals.push(interval);
}