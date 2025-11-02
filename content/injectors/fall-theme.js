import { API } from '../utils/api.js';

let projectsData = [];
let fallingInterval = null;
let isActive = false;

//I am kinda using the api to fetch projects with coins and then making them fall, its cool i like how it turned out after so many hit and trials, ig it make it cool :hehe:

export function injectFallTheme() {
  if (window.location.pathname !== '/keep') return;
  
  const theme = document.body.getAttribute('data-ms-theme') || 'default';
  if (theme === 'dark') return;
  
  setTimeout(() => {
    loadAndStartFalling();
  }, 1500);
  
  setupThemeListener();
}

function setupThemeListener() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-ms-theme') {
        const theme = document.body.getAttribute('data-ms-theme') || 'default';
        if (theme === 'dark') {
          stopFallingProjects();
        } else if (!isActive) {
          loadAndStartFalling();
        }
      }
    });
  });
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-ms-theme']
  });
}

async function loadAndStartFalling() {
  if (isActive) return;
  isActive = true;
  
  try {
    const response = await API.getAllProjects();
    if (response && response.projects) {
      projectsData = response.projects
        .filter(p => p.status === 'finished' && p.coin_value > 0)
        .sort((a, b) => (b.coin_value || 0) - (a.coin_value || 0));
      
      if (projectsData.length > 0) {
        injectStyles();
        startFallingProjects();
      }
    }
  } catch (error) {
    console.error('[Falling Cards] Error:', error);
  }
}

function injectStyles() {
  if (document.getElementById('ms-falling-cards-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'ms-falling-cards-styles';
  style.textContent = `
    @keyframes cardFall {
      0% { 
        transform: translateY(-120px) translateX(0) rotate(0deg); 
        opacity: 0; 
      }
      5% { opacity: 1; }
      100% { 
        transform: translateY(calc(100vh + 120px)) translateX(var(--drift)) rotate(var(--rotation)); 
        opacity: 0.9; 
      }
    }
    
    .ms-falling-card {
      position: fixed;
      width: 160px;
      background: rgba(247, 234, 214, 0.95);
      border: 3px solid rgba(120, 84, 55, 0.8);
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      z-index: 999999;
      animation: cardFall var(--duration) ease-in-out forwards;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      pointer-events: auto;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .ms-falling-card:hover {
      animation-play-state: paused;
      box-shadow: 0 12px 36px rgba(120, 84, 55, 0.7);
      z-index: 9999999;
      filter: brightness(1.1);
    }
    
    .ms-falling-card-name {
      font-family: 'IM Fell English', serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: #3d2817;
      margin-bottom: 0.5rem;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.3;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
    }
    
    .ms-falling-card-coins {
      font-family: 'Jaini', serif;
      font-size: 1.2rem;
      font-weight: 700;
      color: #785437;
      text-align: center;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
    }
    
    .ms-project-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(8px);
    }
    
    .ms-project-modal-content {
      background: #f7ead6;
      border: 3px solid #785437;
      border-radius: 16px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    
    .ms-project-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }
    
    .ms-project-modal-title {
      font-family: 'Jaini', serif;
      font-size: 1.8rem;
      color: #3d2817;
      margin: 0;
    }
    
    .ms-project-modal-close {
      background: #785437;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #f7ead6;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-weight: 700;
      transition: background 0.2s;
    }
    
    .ms-project-modal-close:hover {
      background: #5a3d28;
    }
    
    .ms-project-modal-coins {
      background: #785437;
      color: #f7ead6;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-family: 'Jaini', serif;
      font-weight: 700;
      display: inline-block;
      margin-bottom: 1rem;
    }
    
    .ms-project-modal-description {
      color: #3d2817;
      font-family: 'IM Fell English', serif;
      line-height: 1.6;
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .ms-project-modal-links {
      display: flex;
      gap: 1rem;
    }
    
    .ms-project-modal-link {
      flex: 1;
      padding: 0.75rem;
      background: #785437;
      border: none;
      border-radius: 8px;
      color: #f7ead6;
      text-decoration: none;
      font-family: 'IM Fell English', serif;
      text-align: center;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .ms-project-modal-link:hover {
      background: #5a3d28;
    }
  `;
  document.head.appendChild(style);
}

function startFallingProjects() {
  for (let i = 0; i < 2; i++) {
    setTimeout(() => createCard(), i * 2000);
  }
  
  fallingInterval = setInterval(() => {
    if (Math.random() > 0.4) {
      createCard();
    }
  }, 5000);
}

function stopFallingProjects() {
  if (fallingInterval) {
    clearInterval(fallingInterval);
    fallingInterval = null;
  }
  
  const existingCards = document.querySelectorAll('.ms-falling-card');
  existingCards.forEach(card => card.remove());
  
  isActive = false;
}

function createCard() {
  if (projectsData.length === 0) return;
  
  const project = projectsData[Math.floor(Math.random() * projectsData.length)];
  const card = document.createElement('div');
  card.className = 'ms-falling-card';
  
  const startX = Math.random() * (window.innerWidth - 160);
  const drift = (Math.random() - 0.5) * 200;
  const rotation = (Math.random() - 0.5) * 360;
  const duration = 12 + Math.random() * 8;
  
  card.style.setProperty('--drift', drift + 'px');
  card.style.setProperty('--rotation', rotation + 'deg');
  card.style.setProperty('--duration', duration + 's');
  card.style.left = startX + 'px';
  card.style.top = '-120px';
  
  card.innerHTML = `
    <div class="ms-falling-card-name">${project.name}</div>
    <div class="ms-falling-card-coins">${project.coin_value} coins</div>
  `;
  
  card.addEventListener('click', () => {
    showModal(project);
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 300);
  });
  
  document.body.appendChild(card);
  
  setTimeout(() => {
    if (card.parentNode) card.remove();
  }, duration * 1000 + 1000);
}

function showModal(project) {
  const existing = document.querySelector('.ms-project-modal');
  if (existing) existing.remove();
  
  const modal = document.createElement('div');
  modal.className = 'ms-project-modal';
  
  const githubLink = project.repo_url 
    ? `<a href="${project.repo_url}" target="_blank" class="ms-project-modal-link">GitHub</a>` 
    : '';
  const demoLink = project.demo_url 
    ? `<a href="${project.demo_url}" target="_blank" class="ms-project-modal-link">Demo</a>` 
    : '';
  
  modal.innerHTML = `
    <div class="ms-project-modal-content">
      <div class="ms-project-modal-header">
        <h2 class="ms-project-modal-title">${project.name}</h2>
        <button class="ms-project-modal-close">×</button>
      </div>
      <div class="ms-project-modal-coins">${project.coin_value} coins</div>
      <p class="ms-project-modal-description">${project.description || 'A mysterious project from the Siege...'}</p>
      <div class="ms-project-modal-links">
        ${githubLink}
        ${demoLink}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  modal.querySelector('.ms-project-modal-close').addEventListener('click', () => {
    modal.remove();
  });
}

//signin off :cupcakes :)