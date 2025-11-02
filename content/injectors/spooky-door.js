let doorActive = false;
let positionUpdateHandler = null;

export function injectSpookyDoor() {
  setupThemeListener();
  setTimeout(checkAndInjectDoor, 100);
}

function checkAndInjectDoor() {
  const isKeepPage = window.location.pathname === '/keep';
  const isDarkTheme = (document.body.getAttribute('data-ms-theme') || 'default') === 'dark';
  
  if (!isKeepPage || !isDarkTheme) {
    removeDoorElement();
    return;
  }
  
  if (!document.getElementById('ms-spooky-door')) {
    createDoorElement();
  }
}

function setupThemeListener() {
  const observer = new MutationObserver(() => checkAndInjectDoor());
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-ms-theme']
  });
}

function createDoorElement() {
  if (doorActive) return;
  doorActive = true;
  
  const checkCastle = setInterval(() => {
    const castleEnd = document.querySelector('#castleEnd');
    if (castleEnd) {
      clearInterval(checkCastle);
      positionDoorOnCastle(castleEnd);
      setupPositionUpdates(castleEnd);
    }
  }, 100);
  
  setTimeout(() => clearInterval(checkCastle), 5000);
}

function setupPositionUpdates(castleEnd) {
  positionUpdateHandler = () => {
    const door = document.getElementById('ms-spooky-door');
    if (door && castleEnd) {
      const rect = castleEnd.getBoundingClientRect();
      door.style.left = `${rect.left + rect.width / 2 - 40}px`;
      door.style.top = `${rect.top + 10}px`;
    }
  };
  
  window.addEventListener('resize', positionUpdateHandler);
  window.addEventListener('scroll', positionUpdateHandler);
  
  const observer = new MutationObserver(positionUpdateHandler);
  observer.observe(castleEnd, {
    attributes: true,
    attributeFilter: ['x', 'y']
  });
}

function positionDoorOnCastle(castleEnd) {
  const doorUrl = chrome.runtime.getURL('door.png');
  
  const door = document.createElement('div');
  door.id = 'ms-spooky-door';
  
  const rect = castleEnd.getBoundingClientRect();
  const castleWidth = rect.width;
  
  door.style.cssText = `
    position: fixed;
    left: ${rect.left + castleWidth / 2 - 40}px;
    top: ${rect.top + 10}px;
    width: 80px;
    height: 100px;
    background-image: url('${doorUrl}');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    cursor: pointer;
    z-index: 10000;
    transition: transform 0.3s ease, filter 0.3s ease;
    filter: brightness(1) drop-shadow(0 0 15px rgba(139, 0, 0, 0.8));
    pointer-events: auto;
  `;
  
  door.addEventListener('mouseenter', () => {
    door.style.transform = 'scale(1.1)';
    door.style.filter = 'brightness(1.2) drop-shadow(0 0 20px rgba(139, 0, 0, 1))';
  });
  
  door.addEventListener('mouseleave', () => {
    door.style.transform = 'scale(1)';
    door.style.filter = 'brightness(1) drop-shadow(0 0 15px rgba(139, 0, 0, 0.8))';
  });
  
  door.addEventListener('click', () => {
    openDoor();
  });
  
  document.body.appendChild(door);
}

function removeDoorElement() {
  const door = document.getElementById('ms-spooky-door');
  if (door) door.remove();
  
  if (positionUpdateHandler) {
    window.removeEventListener('resize', positionUpdateHandler);
    window.removeEventListener('scroll', positionUpdateHandler);
    positionUpdateHandler = null;
  }
  
  doorActive = false;
}

function openDoor() {
  const soundUrl = chrome.runtime.getURL('door-creak.mp3');
  const videoUrl = chrome.runtime.getURL('follow-red-dot.mp4');
  
  const audio = new Audio(soundUrl);
  audio.volume = 0.5;
  audio.play();
  
  const blackScreen = document.createElement('div');
  blackScreen.id = 'ms-black-screen';
  blackScreen.style.cssText = `
    position: fixed;
    inset: 0;
    background: #000000;
    z-index: 999999;
    opacity: 0;
    transition: opacity 1s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const storyContainer = document.createElement('div');
  storyContainer.style.cssText = `
    color: #8B0000;
    font-family: 'Jaini', serif;
    font-size: 3.5rem;
    text-align: center;
    opacity: 0;
    transition: opacity 1.5s ease;
    text-shadow: 0 0 20px rgba(139, 0, 0, 0.8);
    max-width: 80%;
    line-height: 1.6;
  `;
  
  const storyLines = [
    'Explore the castle...',
    'Keep your focus on the red dot...',
    "It's you exploring..."
  ];
  
  let currentLine = 0;
  
  blackScreen.appendChild(storyContainer);
  document.body.appendChild(blackScreen);
  
  setTimeout(() => blackScreen.style.opacity = '1', 10);
  
  function showNextLine() {
    if (currentLine < storyLines.length) {
      storyContainer.style.opacity = '0';
      
      setTimeout(() => {
        storyContainer.textContent = storyLines[currentLine++];
        storyContainer.style.opacity = '1';
        setTimeout(showNextLine, 2500);
      }, 500);
    } else {
      storyContainer.style.opacity = '0';
      setTimeout(() => playJumpscareVideo(blackScreen, videoUrl), 1000);
    }
  }
  
  setTimeout(showNextLine, 1000);
}

function playJumpscareVideo(blackScreen, videoUrl) {
  blackScreen.innerHTML = '';
  
  const video = document.createElement('video');
  video.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: contain;
  `;
  video.src = videoUrl;
  video.preload = 'auto';
  video.muted = false;
  video.volume = 0.7;
  video.playsInline = true;
  
  blackScreen.appendChild(video);
  
  video.addEventListener('loadeddata', () => {
    video.play().catch(() => {
      video.muted = true;
      video.play();
    });
  });
  
  const closeVideo = () => {
    video.pause();
    blackScreen.style.opacity = '0';
    setTimeout(() => blackScreen.remove(), 1000);
  };
  
  video.addEventListener('ended', closeVideo);
  blackScreen.style.cursor = 'pointer';
  blackScreen.addEventListener('click', closeVideo);
  
  video.load();
}