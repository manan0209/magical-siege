import { DOMExtractor } from '../utils/dom-extractor.js';
import { DOMInjector } from '../utils/dom-injector.js';
import { TimeUtils } from '../utils/time.js';
import { injectXRayButtons } from './xray-scanner.js';

export function injectGreatHallEnhancements() {
  if (document.getElementById('ms-voting-banner')) {
    return;
  }

  injectVotingTimerBanner();
  
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        const dialogueBox = document.querySelector('.dialogue-box[data-visible="true"]');
        if (dialogueBox && mutation.type === 'attributes') {
          setTimeout(() => {
            injectDialogueXRay();
          }, 100);
        }
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-visible']
  });
}

function injectVotingTimerBanner() {
  const isVoting = TimeUtils.isVotingDay();
  
  if (!isVoting) {
    return;
  }
  
  const votingEndTime = TimeUtils.getVotingPeriodEnd();
  const now = new Date();
  const timeLeft = votingEndTime - now;
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  const votedProjects = document.querySelectorAll('.project-card.voted, [data-voted="true"]').length;
  const totalProjects = document.querySelectorAll('.project-card, [data-project]').length;
  const votingProgress = totalProjects > 0 ? ((votedProjects / totalProjects) * 100).toFixed(0) : 0;
  
  const banner = document.createElement('div');
  banner.id = 'ms-voting-banner';
  banner.className = 'ms-countdown fixed top-16 left-0 right-0 z-40 shadow-lg';
  
  function updateBanner() {
    const endTime = TimeUtils.getVotingPeriodEnd();
    const timeRemaining = endTime - new Date();
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    const urgencyClass = hours < 1 ? 'animate-pulse' : '';
    
    banner.innerHTML = `
      <div class="${urgencyClass} flex items-center justify-between px-6 py-3">
        <div class="flex items-center gap-4">
          <div>
            <div class="text-sm opacity-75">Voting Period Active</div>
            <div class="font-bold text-lg">${hours}h ${minutes}m remaining</div>
          </div>
          <div class="h-8 w-px bg-white opacity-30"></div>
          <div>
            <div class="text-sm opacity-75">Your Progress</div>
            <div class="font-bold">${votedProjects} / ${totalProjects} projects</div>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="w-48">
            <div class="w-full h-2 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div class="h-full bg-yellow-300 transition-all duration-300" style="width: ${votingProgress}%"></div>
            </div>
            <div class="text-xs text-center mt-1">${votingProgress}% complete</div>
          </div>
          <button id="ms-refresh-votes" class="ms-button-secondary text-sm px-4 py-1">
            Refresh
          </button>
        </div>
      </div>
    `;
  }
  
  updateBanner();
  setInterval(updateBanner, 60000);
  
  document.body.appendChild(banner);
  
  const refreshBtn = document.getElementById('ms-refresh-votes');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      location.reload();
    });
  }
}

function enhanceProjectCards() {
  const projectCards = document.querySelectorAll('.project-card, [data-project], .voting-project-card');
  
  if (projectCards.length === 0) {
    return;
  }

  const mainContainer = document.querySelector('.voting-panel, .projects-grid, main') || document.body;
  injectXRayButtons(mainContainer, '.project-card, [data-project], .voting-project-card');
  
  projectCards.forEach((card, index) => {
    if (card.dataset.msEnhanced) {
      return;
    }
    
    card.dataset.msEnhanced = 'true';
    card.style.position = 'relative';
    
    const repoUrl = card.querySelector('a[href*="github.com"]')?.href || 
                   card.querySelector('[data-repo-url]')?.dataset.repoUrl;
    const demoUrl = card.querySelector('a[href*="demo"], [data-demo-url]')?.href ||
                   card.querySelector('[data-demo-url]')?.dataset.demoUrl;
    
    const quickActions = document.createElement('div');
    quickActions.className = 'absolute top-2 right-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity duration-200';
    quickActions.style.zIndex = '10';
    
    quickActions.innerHTML = `
      ${repoUrl ? `
        <a href="${repoUrl}" target="_blank" 
           class="ms-button text-xs px-3 py-1 flex items-center gap-1"
           title="View Repository">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Repo
        </a>
      ` : ''}
      ${demoUrl ? `
        <a href="${demoUrl}" target="_blank" 
           class="ms-button text-xs px-3 py-1 flex items-center gap-1"
           title="View Live Demo">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
          Demo
        </a>
      ` : ''}
    `;
    
    card.style.overflow = 'visible';
    card.appendChild(quickActions);
    
    card.addEventListener('mouseenter', () => {
      quickActions.style.opacity = '1';
    });
    
    card.addEventListener('mouseleave', () => {
      quickActions.style.opacity = '0';
    });
    
    detectTechnology(card);
  });
}

let cachedVotes = null;

function extractVotesFromPage() {
  if (cachedVotes) return cachedVotes;
  
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    const content = script.textContent;
    if (content.includes('const votes = ')) {
      const match = content.match(/const votes = (\[[\s\S]*?\]);/);
      if (match) {
        try {
          cachedVotes = JSON.parse(match[1]);
          return cachedVotes;
        } catch (e) {
          console.warn('Failed to parse votes:', e);
        }
      }
    }
  }
  return null;
}

function getCurrentStep() {
  const dialogueText = document.querySelector('.dialogue-text, #dialogueText')?.textContent || '';
  
  if (dialogueText.includes('four diplomats')) {
    return 1;
  }
  
  if (dialogueText.includes('vote on each project') || dialogueText.includes('allocate your stars')) {
    return 6;
  }
  
  const votes = extractVotesFromPage();
  if (!votes) return null;
  
  for (let i = 0; i < votes.length; i++) {
    const vote = votes[i];
    if (vote.project) {
      const projectName = vote.project.name;
      const projectDescription = vote.project.description || '';
      
      if (dialogueText.includes(projectName)) {
        return i + 2;
      }
      
      if (projectDescription && dialogueText.includes(projectDescription.substring(0, 50))) {
        return i + 2;
      }
    }
  }
  
  return null;
}

function injectDialogueXRay() {
  const dialogueBox = document.querySelector('.dialogue-box[data-visible="true"]');
  if (!dialogueBox) return;
  
  const existingBtn = dialogueBox.querySelector('.xray-scan-btn');
  if (existingBtn) {
    existingBtn.remove();
  }
  
  const dialogueActions = dialogueBox.querySelector('#dialogueActions, .actions');
  if (!dialogueActions) return;
  
  const viewCodeBtn = Array.from(dialogueActions.querySelectorAll('button')).find(btn => 
    btn.textContent.toLowerCase().includes('view code')
  );
  
  if (!viewCodeBtn) return;
  
  const votes = extractVotesFromPage();
  if (!votes) {
    console.log('[X-RAY] No votes found');
    return;
  }
  
  const currentStep = getCurrentStep();
  console.log('[X-RAY] Current step:', currentStep);
  
  if (!currentStep || currentStep < 2 || currentStep > 5) return;
  
  const voteIndex = currentStep - 2;
  const vote = votes[voteIndex];
  
  console.log('[X-RAY] Vote index:', voteIndex, 'Vote:', vote);
  
  if (!vote || !vote.project || !vote.project.repo_url) return;
  
  const repoUrl = vote.project.repo_url;
  
  console.log('[X-RAY] Repo URL:', repoUrl);
  
  if (!repoUrl.includes('github.com')) return;
  
  const xrayBtn = document.createElement('button');
  xrayBtn.className = 'xray-scan-btn xray-dialogue-btn';
  xrayBtn.textContent = '[X-RAY]';
  xrayBtn.dataset.repoUrl = repoUrl;
  xrayBtn.title = 'Scan repository structure';
  xrayBtn.style.cssText = `
    position: absolute !important;
    top: 8px !important;
    right: 8px !important;
    z-index: 100 !important;
    margin: 0 !important;
    padding: 4px 8px !important;
    width: auto !important;
    height: auto !important;
    min-width: auto !important;
  `;
  
  dialogueBox.appendChild(xrayBtn);
}

function detectTechnology(card) {
  const text = card.textContent.toLowerCase();
  const description = card.querySelector('.description, .project-description')?.textContent.toLowerCase() || text;
  
  const technologies = [];
  
  const techPatterns = {
    'React': /react/i,
    'Vue': /vue\.?js/i,
    'Next.js': /next\.?js/i,
    'Node.js': /node\.?js|express/i,
    'Python': /python|django|flask/i,
    'TypeScript': /typescript/i,
    'JavaScript': /javascript|js/i,
    'Tailwind': /tailwind/i,
    'PostgreSQL': /postgres|postgresql/i,
    'MongoDB': /mongo/i,
    'AI/ML': /ai|machine learning|ml|neural|gpt/i,
    'Game': /game|unity|godot/i
  };
  
  for (const [tech, pattern] of Object.entries(techPatterns)) {
    if (pattern.test(description)) {
      technologies.push(tech);
    }
  }
  
  if (technologies.length > 0) {
    const techBadges = document.createElement('div');
    techBadges.className = 'mt-2 flex flex-wrap gap-1';
    
    techBadges.innerHTML = technologies.slice(0, 4).map(tech => `
      <span class="ms-badge ms-badge-info text-xs px-2 py-0.5">${tech}</span>
    `).join('');
    
    const descriptionEl = card.querySelector('.description, .project-description');
    if (descriptionEl) {
      descriptionEl.appendChild(techBadges);
    }
  }
}
