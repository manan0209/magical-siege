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
  
  if (isMagicalTheme) {
    console.log('Magical Meeple: Magical theme detected, activating orange meeple');
    activateMagicalMeeple();
  } else {
    console.log('Magical Meeple: Not magical theme, skipping');
  }
}

function activateMagicalMeeple() {
  startMeepleReplacer();
}

function startMeepleReplacer() {
  const orangeMeepleUrl = chrome.runtime.getURL('assets/meeple-orange.png');
  
  window.addEventListener('load', () => {
    if (window.MeepleDisplay) {
      const OriginalMeepleDisplay = window.MeepleDisplay;
      window.MeepleDisplay = function(userData, width, height) {
        if (userData && userData.meeple) {
          userData.meeple.imageSrc = orangeMeepleUrl;
          userData.meeple.color = 'orange';
        }
        return new OriginalMeepleDisplay(userData, width, height);
      };
      Object.setPrototypeOf(window.MeepleDisplay, OriginalMeepleDisplay);
      window.MeepleDisplay.prototype = OriginalMeepleDisplay.prototype;
    }
  });
  
  function replaceMeepleImages() {
    const allImages = document.querySelectorAll('img[src*="meeple"], img[alt*="meeple"]');
    
    allImages.forEach(img => {
      if (img.src.includes('meeple-orange')) return;
      
      console.log('Magical Meeple: Replacing meeple image', img.src);
      img.src = orangeMeepleUrl;
      img.style.filter = 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.6))';
      img.dataset.magicalReplaced = 'true';
    });
    
    const allCanvases = document.querySelectorAll('canvas');
    allCanvases.forEach(canvas => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const parentId = parent.id || '';
      const parentClass = parent.className || '';
      
      if (parentId.includes('meeple') || parentClass.includes('meeple') || 
          parent.querySelector('[id*="meeple"]') || parent.querySelector('[class*="meeple"]')) {
        
        if (parent.dataset.magicalReplaced) return;
        
        console.log('Magical Meeple: Replacing canvas meeple', parent);
        const img = document.createElement('img');
        img.src = orangeMeepleUrl;
        img.style.cssText = `
          width: ${canvas.width || 84}px;
          height: ${canvas.height || 84}px;
          object-fit: contain;
          filter: drop-shadow(0 0 8px rgba(251, 146, 60, 0.6));
        `;
        canvas.replaceWith(img);
        parent.dataset.magicalReplaced = 'true';
      }
    });
    
    addMagicalBadges();
  }
  
  function addMagicalBadges() {
    const avatars = document.querySelectorAll('.meeple-avatar, .navbar .meeple-avatar');
    avatars.forEach(avatar => {
      if (avatar.querySelector('.magical-badge')) return;
      
      const badge = document.createElement('div');
      badge.className = 'magical-badge';
      badge.style.cssText = `
        position: absolute;
        bottom: -8px;
        right: -8px;
        background: linear-gradient(135deg, #FB923C, #F97316);
        color: white;
        font-size: 0.65rem;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-weight: 700;
        border: 2px solid #FCD34D;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        font-family: 'IM Fell English', serif;
        z-index: 10;
      `;
      badge.textContent = 'MAGICAL';
      
      avatar.style.position = 'relative';
      avatar.appendChild(badge);
    });
  }
  
  replaceMeepleImages();
  setTimeout(replaceMeepleImages, 500);
  setTimeout(replaceMeepleImages, 1000);
  setTimeout(replaceMeepleImages, 2000);
  
  const observer = new MutationObserver(() => {
    replaceMeepleImages();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src']
  });
  
  setInterval(replaceMeepleImages, 3000);
}