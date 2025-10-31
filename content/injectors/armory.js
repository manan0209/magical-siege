import { API } from '../utils/api.js';

let isInjected = false;

export function injectArmoryEnhancements() {
  if (isInjected && document.querySelector('.ms-search-bar')) {
    return;
  }

  waitForProjectCards().then(() => {
    injectSearchBar();
    enhanceProjectCardsWithAPI();
    isInjected = true;
  });
}

function waitForProjectCards() {
  return new Promise((resolve) => {
    const checkCards = () => {
      const projectCards = document.querySelectorAll('.project-card');
      
      if (projectCards.length > 0) {
        resolve();
      } else {
        setTimeout(checkCards, 200);
      }
    };
    checkCards();
  });
}

function extractProjectId(card) {
  const cardId = card.getAttribute('id');
  if (cardId) {
    const match = cardId.match(/project_(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
  }
  
  const overlayLink = card.querySelector('a.project-card-overlay');
  if (overlayLink) {
    const href = overlayLink.getAttribute('href');
    
    const armoryMatch = href.match(/\/armory\/(\d+)/);
    if (armoryMatch && armoryMatch[1]) {
      return parseInt(armoryMatch[1]);
    }
    
    const projectsMatch = href.match(/\/projects\/(\d+)/);
    if (projectsMatch && projectsMatch[1]) {
      return parseInt(projectsMatch[1]);
    }
  }
  
  return null;
}

function extractWeekFromCard(card) {
  const weekBadge = card.querySelector('.project-badge');
  if (weekBadge) {
    const text = weekBadge.textContent.trim();
    const match = text.match(/week\s+(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
  }
  return 0;
}

function injectSearchBar() {
  const projectsGrid = document.querySelector('.projects-grid');
  if (!projectsGrid || document.querySelector('.ms-search-bar')) return;

  const searchContainer = document.createElement('div');
  searchContainer.className = 'ms-search-bar';
  searchContainer.style.cssText = `
    margin-bottom: 1.5rem;
    display: flex;
    gap: 1rem;
    align-items: center;
  `;

  searchContainer.innerHTML = `
    <input 
      type="text" 
      placeholder="Search projects by name, description..." 
      class="ms-search-input"
      style="
        flex: 1;
        padding: 0.75rem 1rem;
        border: 2px solid rgba(59, 42, 26, 0.2);
        border-radius: 8px;
        font-family: 'IM Fell English', serif;
        font-size: 1rem;
        background: white;
        transition: border-color 0.2s;
      "
    />
    <button 
      class="ms-clear-search"
      style="
        padding: 0.75rem 1.25rem;
        border: 2px solid rgba(59, 42, 26, 0.2);
        border-radius: 8px;
        font-family: 'IM Fell English', serif;
        font-size: 0.875rem;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        display: none;
      "
    >
      Clear
    </button>
  `;

  projectsGrid.parentNode.insertBefore(searchContainer, projectsGrid);

  const searchInput = searchContainer.querySelector('.ms-search-input');
  const clearButton = searchContainer.querySelector('.ms-clear-search');

  searchInput.addEventListener('focus', () => {
    searchInput.style.borderColor = 'rgba(59, 130, 246, 0.5)';
  });

  searchInput.addEventListener('blur', () => {
    searchInput.style.borderColor = 'rgba(59, 42, 26, 0.2)';
  });

  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filterProjects(e.target.value);
      clearButton.style.display = e.target.value ? 'block' : 'none';
    }, 300);
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    filterProjects('');
    clearButton.style.display = 'none';
    searchInput.focus();
  });

  clearButton.addEventListener('mouseenter', () => {
    clearButton.style.background = 'rgba(239, 68, 68, 0.1)';
    clearButton.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    clearButton.style.color = '#dc2626';
  });

  clearButton.addEventListener('mouseleave', () => {
    clearButton.style.background = 'white';
    clearButton.style.borderColor = 'rgba(59, 42, 26, 0.2)';
    clearButton.style.color = 'inherit';
  });
}

function filterProjects(query) {
  const projectCards = document.querySelectorAll('.project-card');
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    projectCards.forEach(card => {
      card.style.display = '';
    });
    return;
  }

  let visibleCount = 0;

  projectCards.forEach(card => {
    const title = card.querySelector('.project-title')?.textContent.toLowerCase() || '';
    const description = card.querySelector('.project-description')?.textContent.toLowerCase() || '';
    const author = card.querySelector('.project-header')?.textContent.toLowerCase() || '';

    if (title.includes(lowerQuery) || description.includes(lowerQuery) || author.includes(lowerQuery)) {
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  const existingMessage = document.querySelector('.ms-no-results');
  if (existingMessage) {
    existingMessage.remove();
  }

  if (visibleCount === 0) {
    const projectsGrid = document.querySelector('.projects-grid');
    const noResults = document.createElement('div');
    noResults.className = 'ms-no-results';
    noResults.style.cssText = `
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      font-family: 'IM Fell English', serif;
      font-size: 1.125rem;
    `;
    noResults.textContent = `No projects found for "${query}"`;
    projectsGrid.after(noResults);
  }
}

async function enhanceProjectCardsWithAPI() {
  const projectCards = document.querySelectorAll('.project-card');
  
  const projectData = [];
  const cardProjectMap = new Map();
  
  for (const card of projectCards) {
    const projectId = extractProjectId(card);
    const weekFromDOM = extractWeekFromCard(card);
    
    if (!projectId) continue;
    
    try {
      const data = await API.getProject(projectId);
      
      if (data && data.id) {
        data.week_from_dom = weekFromDOM;
        projectData.push(data);
        cardProjectMap.set(projectId, { card, data });
      }
    } catch (error) {
      console.error(`Failed to fetch project ${projectId}:`, error);
    }
  }
  
  if (projectData.length > 0) {
    sortCardsByWeek(cardProjectMap);
    
    for (const [projectId, { card, data }] of cardProjectMap) {
      await enhanceSingleCard(card, data);
    }
    
    injectProjectSummaryCard(projectData);
  }
}

function sortCardsByWeek(cardProjectMap) {
  const projectsGrid = document.querySelector('.projects-grid');
  if (!projectsGrid) return;
  
  const sortedEntries = Array.from(cardProjectMap.entries()).sort((a, b) => {
    const weekA = a[1].data.week_from_dom || 0;
    const weekB = b[1].data.week_from_dom || 0;
    return weekB - weekA;
  });
  
  sortedEntries.forEach(([projectId, { card }]) => {
    projectsGrid.appendChild(card);
  });
}

async function enhanceSingleCard(card, project) {
  if (card.querySelector('.ms-enhanced')) {
    return;
  }
  
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  
  const hours = project.hours || 0;
  const coinValue = project.coin_value;
  const status = project.status || 'unknown';
  const avgScore = project.average_score;
  const isPaidOut = status === 'finished' && coinValue > 0;
  
  const enhancementContainer = document.createElement('div');
  enhancementContainer.className = 'ms-enhanced';
  enhancementContainer.style.cssText = `
    margin-top: auto;
    padding-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `;
  
  if (hours > 0) {
    const hoursDisplay = document.createElement('div');
    hoursDisplay.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15));
      border: 2px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;
      font-family: 'IM Fell English', serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e40af;
    `;
    
    hoursDisplay.innerHTML = `
      <span style="font-family: 'Jaini', serif; font-size: 1.1rem;">${hours.toFixed(1)}h</span>
      <span>logged</span>
    `;
    
    enhancementContainer.appendChild(hoursDisplay);
  }
  
  if (isPaidOut) {
    const coinsDisplay = document.createElement('div');
    coinsDisplay.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15));
      border: 2px solid rgba(245, 158, 11, 0.3);
      border-radius: 8px;
      font-family: 'IM Fell English', serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: #92400e;
    `;
    
    coinsDisplay.innerHTML = `
      <span style="font-family: 'Jaini', serif; font-size: 1.1rem;">${coinValue}</span>
      <span>coins earned</span>
    `;
    
    enhancementContainer.appendChild(coinsDisplay);
    
    if (avgScore) {
      const scoreDisplay = document.createElement('div');
      scoreDisplay.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem 0.75rem;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(109, 40, 217, 0.15));
        border: 2px solid rgba(139, 92, 246, 0.3);
        border-radius: 8px;
        font-family: 'IM Fell English', serif;
        font-size: 0.875rem;
        font-weight: 600;
        color: #6D28D9;
      `;
      
      const stars = '⭐'.repeat(Math.round(avgScore));
      scoreDisplay.innerHTML = `
        <span style="font-family: 'Jaini', serif; font-size: 1.1rem;">${avgScore.toFixed(1)}</span>
        <span>${stars}</span>
      `;
      
      enhancementContainer.appendChild(scoreDisplay);
    }
  } else if (hours > 0) {
    const predicted = predictCoins(hours);
    const coinsDisplay = document.createElement('div');
    coinsDisplay.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15));
      border: 2px solid rgba(245, 158, 11, 0.3);
      border-radius: 8px;
      font-family: 'IM Fell English', serif;
      font-size: 0.875rem;
      font-weight: 600;
      color: #92400e;
    `;
    
    coinsDisplay.innerHTML = `
      <span style="font-family: 'Jaini', serif; font-size: 1.1rem;">~${predicted}</span>
      <span>coins expected</span>
    `;
    
    enhancementContainer.appendChild(coinsDisplay);
  }
  
  const projectFooter = card.querySelector('.project-footer');
  if (projectFooter) {
    projectFooter.parentNode.insertBefore(enhancementContainer, projectFooter);
  } else {
    card.appendChild(enhancementContainer);
  }
  
  card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = '';
  });
}

function predictCoins(hours) {
  const REVIEWER_BONUS_MULTIPLIER = 2;
  const STARS_MULTIPLIER = 3;
  const TOTAL_MULTIPLIER = REVIEWER_BONUS_MULTIPLIER + STARS_MULTIPLIER;
  
  let baseCoins = 0;
  
  if (hours <= 10) {
    baseCoins = 5;
  } else {
    const extraHours = hours - 10;
    baseCoins = 5 + (extraHours * 2);
  }
  
  return Math.round(baseCoins * TOTAL_MULTIPLIER);
}

function injectProjectSummaryCard(projects) {
  const existingSummary = document.querySelector('.ms-summary-card');
  if (existingSummary) {
    existingSummary.remove();
  }
  
  let totalProjects = projects.length;
  let totalHours = 0;
  let totalCoins = 0;
  let avgScoreSum = 0;
  let scoredProjects = 0;
  let latestWeek = 0;
  
  projects.forEach(project => {
    const hours = project.hours || 0;
    const coinValue = parseFloat(project.coin_value) || 0;
    const status = project.status || 'unknown';
    const avgScore = project.average_score;
    const weekNumber = project.week_from_dom || 0;
    const isPaidOut = status === 'finished' && coinValue > 0;
    
    if (weekNumber > latestWeek) {
      latestWeek = weekNumber;
    }
    
    if (hours > 0) {
      totalHours += hours;
    }
    
    if (isPaidOut && coinValue > 0) {
      totalCoins += parseFloat(coinValue);
    } else if (hours > 0) {
      totalCoins += predictCoins(hours);
    }
    
    if (avgScore && isPaidOut) {
      avgScoreSum += avgScore;
      scoredProjects++;
    }
  });
  
  if (totalProjects === 0) {
    return;
  }
  
  const weeksLeft = Math.max(0, 14 - latestWeek);
  const overallAvgScore = scoredProjects > 0 ? (avgScoreSum / scoredProjects).toFixed(1) : null;
  
  const summaryCard = document.createElement('div');
  summaryCard.className = 'home-card ms-summary-card';
  summaryCard.style.cssText = 'margin-bottom: 1.5rem; max-width: 100%;';
  
  summaryCard.innerHTML = `
    <div class="home-card-body" style="padding: 1.5rem;">
      <h3 style="font-family: 'Jaini', serif; font-size: 1.5rem; margin-bottom: 1rem; color: #3b2a1a; text-align: center;">
        Project Summary
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem;">
        <div style="text-align: center; padding: 0.75rem; background: rgba(139, 92, 246, 0.1); border: 2px solid rgba(139, 92, 246, 0.3); border-radius: 8px;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif; margin-bottom: 0.25rem;">
            Total Projects
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: #6D28D9; font-family: 'Jaini', serif;">
            ${totalProjects}
          </div>
        </div>
        
        <div style="text-align: center; padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border: 2px solid rgba(59, 130, 246, 0.3); border-radius: 8px;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif; margin-bottom: 0.25rem;">
            Total Hours
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: #2563eb; font-family: 'Jaini', serif;">
            ${totalHours.toFixed(1)}h
          </div>
        </div>
        
        <div style="text-align: center; padding: 0.75rem; background: rgba(245, 158, 11, 0.1); border: 2px solid rgba(245, 158, 11, 0.3); border-radius: 8px;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif; margin-bottom: 0.25rem;">
            Total Coins
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: #d97706; font-family: 'Jaini', serif;">
            ${totalCoins}
          </div>
        </div>
        
        <div style="text-align: center; padding: 0.75rem; background: rgba(34, 197, 94, 0.1); border: 2px solid rgba(34, 197, 94, 0.3); border-radius: 8px;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif; margin-bottom: 0.25rem;">
            Weeks Left
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: #16a34a; font-family: 'Jaini', serif;">
            ${weeksLeft}
          </div>
          <div style="font-size: 0.75rem; opacity: 0.6; font-family: 'IM Fell English', serif; margin-top: 0.25rem;">
            14 - ${latestWeek}
          </div>
        </div>
        
        ${overallAvgScore ? `
          <div style="text-align: center; padding: 0.75rem; background: rgba(168, 85, 247, 0.1); border: 2px solid rgba(168, 85, 247, 0.3); border-radius: 8px;">
            <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif; margin-bottom: 0.25rem;">
              Avg Score
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: #7c3aed; font-family: 'Jaini', serif;">
              ${overallAvgScore} ${'⭐'.repeat(Math.round(parseFloat(overallAvgScore)))}
            </div>
          </div>
        ` : ''}
      </div>
      
      <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(59, 42, 26, 0.05); border-radius: 8px; text-align: center;">
        <div style="font-size: 0.875rem; font-family: 'IM Fell English', serif; color: #3b2a1a; line-height: 1.4;">
          Expected coins based on 6x multiplier (2x reviewer bonus + 3x stars avg)
        </div>
      </div>
    </div>
  `;
  
  const projectsGrid = document.querySelector('.projects-grid');
  if (projectsGrid && projectsGrid.parentNode) {
    projectsGrid.parentNode.insertBefore(summaryCard, projectsGrid);
  }
}
