export function injectArmoryEnhancements() {
  console.log('Armory page enhancements loading...');
  
  waitForProjectCards().then(() => {
    console.log('Project cards detected, enhancing...');
    enhanceProjectCards();
    injectProjectSummaryCard();
  });
}

function waitForProjectCards() {
  return new Promise((resolve) => {
    const checkCards = () => {
      const projectCards = document.querySelectorAll('.project-card');
      console.log('Checking for project cards...', projectCards.length);
      
      if (projectCards.length > 0) {
        console.log('Found project cards:', projectCards.length);
        resolve();
      } else {
        setTimeout(checkCards, 200);
      }
    };
    checkCards();
  });
}

function extractProjectHours(card) {
  const timeElement = card.querySelector('.project-time');
  if (timeElement) {
    const text = timeElement.textContent;
    const hourMatch = text.match(/(\d+)h\s*(\d+)m/);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1]);
      const minutes = parseInt(hourMatch[2]);
      return hours + (minutes / 60);
    }
  }
  
  const text = card.textContent || '';
  const patterns = [
    /Time spent:\s*(\d+)h\s*(\d+)m/i,
    /(\d+)h\s*(\d+)m/,
    /(\d+)h/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        return parseInt(match[1]) + (parseInt(match[2]) / 60);
      }
      return parseInt(match[1]);
    }
  }
  
  return 0;
}

function predictCoins(hours) {
  const REVIEWER_BONUS_MULTIPLIER = 2;
  const STARS_MULTIPLIER = 3;
  const TOTAL_MULTIPLIER = REVIEWER_BONUS_MULTIPLIER + STARS_MULTIPLIER;
  
  return hours * TOTAL_MULTIPLIER;
}

function enhanceProjectCards() {
  const projectCards = document.querySelectorAll('.project-card');
  console.log('Enhancing project cards:', projectCards.length);
  
  let enhancedCount = 0;
  
  projectCards.forEach(card => {
    if (card.querySelector('.ms-coin-prediction')) {
      return;
    }
    
    const hours = extractProjectHours(card);
    console.log('Extracted hours:', hours, 'from card');
    
    if (hours > 0) {
      const predictedCoins = predictCoins(hours);
      
      const predictionBadge = document.createElement('div');
      predictionBadge.className = 'ms-coin-prediction';
      predictionBadge.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border: 2px solid rgba(64, 43, 32, 0.75);
        border-radius: 8px;
        margin-top: 0.75rem;
        font-family: 'IM Fell English', serif;
        font-size: 0.875rem;
        font-weight: 600;
        color: #3b2a1a;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      `;
      
      predictionBadge.innerHTML = `
        <span style="font-family: 'Jaini', serif; font-size: 1.25rem;">${predictedCoins}</span>
        <span>coins expected</span>
      `;
      
      const projectFooter = card.querySelector('.project-footer');
      if (projectFooter) {
        projectFooter.parentNode.insertBefore(predictionBadge, projectFooter);
      } else {
        card.appendChild(predictionBadge);
      }
      
      enhancedCount++;
      
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
  });
  
  console.log('Enhanced', enhancedCount, 'project cards');
}

function injectProjectSummaryCard() {
  const projectCards = document.querySelectorAll('.project-card');
  
  let totalProjects = 0;
  let totalHours = 0;
  let totalPredictedCoins = 0;
  
  projectCards.forEach(card => {
    const hours = extractProjectHours(card);
    if (hours > 0) {
      totalProjects++;
      totalHours += hours;
      totalPredictedCoins += predictCoins(hours);
    }
  });
  
  console.log('Summary:', totalProjects, 'projects,', totalHours.toFixed(1), 'hours,', totalPredictedCoins, 'coins');
  
  if (totalProjects === 0) {
    console.log('No projects found for summary');
    return;
  }
  
  const avgHoursPerProject = (totalHours / totalProjects).toFixed(1);
  const avgCoinsPerProject = Math.round(totalPredictedCoins / totalProjects);
  
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
            Expected Coins
          </div>
          <div style="font-size: 2rem; font-weight: 700; color: #d97706; font-family: 'Jaini', serif;">
            ${totalPredictedCoins}
          </div>
        </div>
        
        <div style="text-align: center; padding: 0.75rem; background: rgba(34, 197, 94, 0.1); border: 2px solid rgba(34, 197, 94, 0.3); border-radius: 8px;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif; margin-bottom: 0.25rem;">
            Avg per Project
          </div>
          <div style="font-size: 1.25rem; font-weight: 700; color: #16a34a; font-family: 'Jaini', serif;">
            ${avgHoursPerProject}h / ${avgCoinsPerProject}c
          </div>
        </div>
      </div>
      
      <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(59, 42, 26, 0.05); border-radius: 8px; text-align: center;">
        <div style="font-size: 0.875rem; font-family: 'IM Fell English', serif; color: #3b2a1a; line-height: 1.4;">
          Prediction based on 6x multiplier (2x reviewer bonus + 3x stars avg)
        </div>
      </div>
    </div>
  `;
  
  const firstProjectCard = document.querySelector('.project-card');
  if (firstProjectCard && firstProjectCard.parentNode) {
    console.log('Inserting summary card before first project');
    firstProjectCard.parentNode.insertBefore(summaryCard, firstProjectCard);
  }
}
