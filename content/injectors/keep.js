import { DOMExtractor } from '../utils/dom-extractor.js';
import { TimeUtils } from '../utils/time.js';
import { syncUserData, getLeaderboard, getUserRank } from '../utils/leaderboard.js';

export function injectKeepEnhancements() {
  console.log('Keep page enhancements loading...');
  
  const homeContainer = document.querySelector('.home-container');
  if (!homeContainer) {
    console.log('Home container not found');
    return;
  }
  
  waitForProgressData().then(() => {
    injectEnhancedStats();
    injectWeeklyInsights();
    injectQuickActions();
    injectGlobalRank();
  });
}

function waitForProgressData() {
  return new Promise((resolve) => {
    const checkProgress = () => {
      const progressText = document.querySelector('.home-progress-top');
      if (progressText) {
        resolve();
      } else {
        setTimeout(checkProgress, 100);
      }
    };
    checkProgress();
  });
}

function extractActualProgress() {
  const progressText = document.querySelector('.home-progress-top');
  if (!progressText) return { hours: 0, percent: 0, pillaging: false, pillageTime: '0h 0m' };
  
  const text = progressText.textContent;
  
  
  if (text.includes("you've been pillaging")) {
    const pillageMatch = text.match(/(\d+)h\s*(\d+)m/);
    
    let pillageTime = '0h 0m';
    if (pillageMatch) {
      pillageTime = `${pillageMatch[1]}h ${pillageMatch[2]}m`;
    }
    
    
    const progressBar = document.querySelector('.home-progress-bar');
    let totalHours = 10; 
    
    if (progressBar) {
      const barWidth = progressBar.style.width;
      if (barWidth) {
        const percent = parseFloat(barWidth);
        if (!isNaN(percent) && percent > 0) {
          totalHours = (percent / 100) * 10;
        }
      }
    }
    
    return {
      hours: totalHours,
      percent: (totalHours / 10) * 100,
      pillaging: true,
      pillageTime
    };
  }
  
  
  const percentMatch = text.match(/(\d+\.?\d*)%/);
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1]);
    const hours = (percent / 100) * 10;
    return { hours, percent, pillaging: false, pillageTime: null };
  }
  
  return { hours: 0, percent: 0, pillaging: false, pillageTime: null };
}

function extractTodaysCoding() {
  const todayText = document.querySelector('.home-progress-bottom');
  if (!todayText) return 0;
  
  const text = todayText.textContent;
  const match = text.match(/today you coded (\d+)h\s*(\d+)m/);
  
  if (match) {
    return parseInt(match[1]) + parseInt(match[2]) / 60;
  }
  
  return 0;
}

function injectEnhancedStats() {
  const homeContainer = document.querySelector('.home-container');
  if (!homeContainer) return;
  
  const progress = extractActualProgress();
  const todayHours = extractTodaysCoding();
  const dailyTargetHours = 2; 
  
  const statsCard = document.createElement('div');
  statsCard.className = 'home-card';
  statsCard.style.cssText = 'margin-top: 1rem;';
  
  const hoursNeeded = 10 - progress.hours;
  const isSuccessful = progress.hours >= 10;
  
  const dailyTargetColor = todayHours >= dailyTargetHours ? '#16a34a' : 
                          todayHours >= dailyTargetHours * 0.5 ? '#f59e0b' : '#ef4444';
  
  
  let statsHTML = `
    <div class="home-card-body">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
        <div style="text-align: center;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif;">Hours Left</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: ${isSuccessful ? '#16a34a' : '#3b2a1a'}; font-family: 'Jaini', serif;">
            ${isSuccessful ? 'Successful' : hoursNeeded.toFixed(1) + 'h'}
          </div>
        </div>
        
        <div style="text-align: center;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif;">Daily Target (2h)</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: ${dailyTargetColor}; font-family: 'Jaini', serif;">
            ${todayHours.toFixed(1)}h today
          </div>
        </div>`;
  
  
  if (progress.pillaging && progress.pillageTime) {
    statsHTML += `
        <div style="text-align: center;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif;">Pillage Time</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #16a34a; font-family: 'Jaini', serif;">
            ${progress.pillageTime}
          </div>
        </div>`;
  } else {
    const timeData = TimeUtils.getTimeRemaining();
    statsHTML += `
        <div style="text-align: center;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif;">Time Left</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: ${timeData.days < 2 ? '#ef4444' : '#8B5CF6'}; font-family: 'Jaini', serif;">
            ${timeData.days}d ${timeData.hours}h
          </div>
        </div>`;
  }
  
  statsHTML += `
      </div>
    </div>
  `;
  
  statsCard.innerHTML = statsHTML;
  
  const insertAfter = homeContainer.children[1] || homeContainer.children[0];
  if (insertAfter && insertAfter.nextSibling) {
    homeContainer.insertBefore(statsCard, insertAfter.nextSibling);
  } else {
    homeContainer.appendChild(statsCard);
  }
}

function injectWeeklyInsights() {
  const homeContainer = document.querySelector('.home-container');
  if (!homeContainer) return;
  
  const progress = extractActualProgress();
  const insightsCard = document.createElement('div');
  insightsCard.className = 'home-card';
  insightsCard.style.cssText = 'margin-top: 1rem;';
  
  let insight = '';
  let color = '#3b2a1a';
  
  if (progress.pillaging) {
    insight = `Pillaging! Every hour now earns you coins. Keep conquering!`;
    color = '#16a34a';
  } else if (progress.percent >= 90) {
    insight = `Almost there! Just ${(10 - progress.hours).toFixed(1)}h left to secure your place.`;
    color = '#8B5CF6';
  } else if (progress.percent >= 50) {
    insight = `Halfway through! ${(progress.hours).toFixed(1)}h completed, ${(10 - progress.hours).toFixed(1)}h to go.`;
    color = '#3b2a1a';
  } else if (progress.percent >= 25) {
    insight = `Good start! ${(progress.hours).toFixed(1)}h down, ${(10 - progress.hours).toFixed(1)}h remaining.`;
    color = '#3b2a1a';
  } else {
    insight = `Time to code! ${(10 - progress.hours).toFixed(1)}h needed this week.`;
    color = '#ef4444';
  }
  
  insightsCard.innerHTML = `
    <div class="home-card-body">
      <div style="text-align: center; padding: 0.5rem;">
        <div style="font-size: 1.125rem; font-weight: 600; color: ${color}; font-family: 'IM Fell English', serif;">
          ${insight}
        </div>
      </div>
    </div>
  `;
  
  homeContainer.appendChild(insightsCard);
}

function injectQuickActions() {
  const homeContainer = document.querySelector('.home-container');
  if (!homeContainer) return;
  
  const actionsCard = document.createElement('div');
  actionsCard.className = 'home-card';
  actionsCard.style.cssText = 'margin-top: 1rem;';
  
  actionsCard.innerHTML = `
    <div class="home-card-body">
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;">
        <a href="/projects/new" class="submit-button" style="text-decoration: none; font-family: 'IM Fell English', serif;">
          New Project
        </a>
        <a href="/projects" class="submit-button" style="text-decoration: none; background: linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%); font-family: 'IM Fell English', serif;">
          View Projects
        </a>
        <a href="/market" class="submit-button" style="text-decoration: none; background: linear-gradient(135deg, #785437 0%, #9A7B4F 100%); font-family: 'IM Fell English', serif;">
          Visit Market
        </a>
      </div>
    </div>
  `;
  
  homeContainer.appendChild(actionsCard);
}

async function injectGlobalRank() {
  const coffersTitle = document.querySelector('.home-section-title');
  if (!coffersTitle || !coffersTitle.textContent.includes('Your coffers')) return;
  
  let username = 'Anonymous';
  
  const usernameElement = document.querySelector('.user-name');
  if (usernameElement) {
    username = usernameElement.textContent.trim();
  }
  
  if (username === 'Anonymous' || username === 'Unnamed Knight') {
    const profileLink = document.querySelector('a[href^="/profile/"]');
    if (profileLink) {
      const href = profileLink.getAttribute('href');
      const usernameMatch = href.match(/\/profile\/([^\/]+)/);
      if (usernameMatch && usernameMatch[1]) {
        username = decodeURIComponent(usernameMatch[1]);
      }
    }
  }
  
  const coinsMatch = coffersTitle.textContent.match(/(\d+)/);
  const coins = coinsMatch ? parseInt(coinsMatch[1]) : 0;
  
  const progressText = document.querySelector('.home-progress-top');
  let hours = 0;
  if (progressText) {
    const hoursMatch = progressText.textContent.match(/(\d+)h/);
    hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  }
  
  const rankBadge = document.createElement('div');
  rankBadge.id = 'ms-global-rank';
  rankBadge.style.cssText = `
    display: inline-block;
    margin-left: 1rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(109, 40, 217, 0.2));
    border: 2px solid rgba(139, 92, 246, 0.4);
    border-radius: 8px;
    font-size: 0.875rem;
    font-family: 'IM Fell English', serif;
    vertical-align: middle;
  `;
  rankBadge.innerHTML = `<span style="opacity: 0.7;">Syncing...</span>`;
  
  coffersTitle.appendChild(rankBadge);
  
  try {
    const leaderboard = await syncUserData(username, coins, hours);
    
    if (leaderboard) {
      const rank = getUserRank(username, leaderboard);
      const totalUsers = leaderboard.length;
      
      if (rank) {
        rankBadge.innerHTML = `
          <span style="font-weight: 600;">Rank #${rank}</span>
          <span style="opacity: 0.7; margin-left: 0.5rem;">of ${totalUsers}</span>
        `;
      } else {
        rankBadge.innerHTML = `<span style="opacity: 0.7;">Rank unavailable</span>`;
      }
    } else {
      rankBadge.innerHTML = `<span style="opacity: 0.7;">Sync failed</span>`;
    }
  } catch (error) {
    rankBadge.innerHTML = `<span style="opacity: 0.7;">Sync error</span>`;
  }
}
