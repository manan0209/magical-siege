import { DOMExtractor } from '../utils/dom-extractor.js';
import { TimeUtils } from '../utils/time.js';
import { getLeaderboard, getUserRank, clearLeaderboardCache, syncUserData } from '../utils/leaderboard.js';
import { SIGNAL_TYPES, sendSignal, canSendMoreSignals, getDailySentCount } from '../utils/signals.js';

let currentUsername = 'Anonymous';
let isInjected = false;

export function injectKeepEnhancements() {
  const homeContainer = document.querySelector('.home-container');
  if (!homeContainer) {
    return;
  }

  if (isInjected) {
    const existingStats = document.querySelector('.ms-enhanced-stats');
    if (existingStats) {
      return;
    }
  }

  setupUsernameMessageHandler();
  
  waitForProgressData().then(() => {
    injectEnhancedStats();
    injectWeeklyInsights();
    injectQuickActions();
    injectGlobalRank();
    isInjected = true;
  });
}

function setupUsernameMessageHandler() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_USERNAME') {
      sendResponse({ username: currentUsername });
    }
    if (request.type === 'CLEAR_LEADERBOARD_CACHE') {
      clearLeaderboardCache();
      sendResponse({ success: true });
    }
    return true;
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

  if (document.querySelector('.ms-enhanced-stats')) return;
  
  const progress = extractActualProgress();
  const todayHours = extractTodaysCoding();
  const dailyTargetHours = 2; 
  
  const statsCard = document.createElement('div');
  statsCard.className = 'home-card ms-enhanced-stats';
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

  if (document.querySelector('.ms-weekly-insights')) return;
  
  const progress = extractActualProgress();
  const insightsCard = document.createElement('div');
  insightsCard.className = 'home-card ms-weekly-insights';
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

  if (document.querySelector('.ms-quick-actions')) return;
  
  const actionsCard = document.createElement('div');
  actionsCard.className = 'home-card ms-quick-actions';
  actionsCard.style.cssText = 'margin-top: 1rem;';
  
  actionsCard.innerHTML = `
    <div class="home-card-body">
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;">
        <a href="/armory/new" class="submit-button" style="text-decoration: none; font-family: 'IM Fell English', serif;">
          New Project
        </a>
        <a href="/armory" class="submit-button" style="text-decoration: none; background: linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%); font-family: 'IM Fell English', serif;">
          Your Projects
        </a>
        <a href="/armory/explore" class="submit-button" style="text-decoration: none; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); font-family: 'IM Fell English', serif;">
          Explore Projects
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

  const existingBadge = document.getElementById('ms-global-rank');
  if (existingBadge) {
    existingBadge.remove();
  }
  
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
  
  currentUsername = username;
  
  const coinsMatch = coffersTitle.textContent.match(/(\d+)/);
  const coins = coinsMatch ? parseInt(coinsMatch[1]) : 0;
  
  const progressText = document.querySelector('.home-progress-top');
  let hours = 0;
  if (progressText) {
    const hoursMatch = progressText.textContent.match(/(\d+)h/);
    hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  }
  
  syncUserData(username, coins, hours);
  
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
    const leaderboard = await getLeaderboard();
    
    if (leaderboard) {
      const rank = getUserRank(username, leaderboard);
      const totalUsers = leaderboard.length;
      
      if (rank) {
        rankBadge.innerHTML = `
          <span style="font-weight: 600;">Rank #${rank}</span>
          <span style="opacity: 0.7; margin-left: 0.5rem;">of ${totalUsers}</span>
        `;
        
        rankBadge.style.cursor = 'pointer';
        rankBadge.addEventListener('click', () => showLeaderboardModal(leaderboard, username));
      } else {
        // User not in leaderboard yet - they need to earn coins first
        rankBadge.innerHTML = `
          <span style="opacity: 0.7;">Not ranked yet</span>
        `;
        rankBadge.title = 'Complete this week to appear on the leaderboard!';
        rankBadge.style.cursor = 'pointer';
        rankBadge.addEventListener('click', () => showLeaderboardModal(leaderboard, username));
      }
    } else {
      rankBadge.innerHTML = `<span style="opacity: 0.7;">Sync failed</span>`;
    }
  } catch (error) {
    console.error('injectGlobalRank: Error:', error);
    rankBadge.innerHTML = `<span style="opacity: 0.7;">Sync error</span>`;
  }
}

function showLeaderboardModal(leaderboard, currentUser) {
  const existing = document.getElementById('ms-leaderboard-modal');
  if (existing) {
    existing.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'ms-leaderboard-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 2rem;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    font-family: 'IM Fell English', serif;
  `;
  
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  `;
  
  const titleSection = document.createElement('div');
  titleSection.style.cssText = `
    display: flex;
    align-items: center;
    gap: 0.75rem;
  `;
  
  const title = document.createElement('h2');
  title.textContent = '🪙 Coffers Leaderboard';
  title.style.cssText = `
    margin: 0;
    font-family: 'Jaini', serif;
    font-size: 1.75rem;
    color: #3b2a1a;
  `;
  
  const refreshBtn = document.createElement('button');
  refreshBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  `;
  refreshBtn.title = 'Refresh leaderboard';
  refreshBtn.style.cssText = `
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(109, 40, 217, 0.1));
    border: 2px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6D28D9;
    padding: 0;
  `;
  
  refreshBtn.addEventListener('mouseenter', () => {
    refreshBtn.style.background = 'rgba(139, 92, 246, 0.2)';
    refreshBtn.querySelector('svg').style.transform = 'rotate(180deg)';
  });
  
  refreshBtn.addEventListener('mouseleave', () => {
    refreshBtn.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(109, 40, 217, 0.1))';
    refreshBtn.querySelector('svg').style.transform = 'rotate(0deg)';
  });
  
  const svgElement = refreshBtn.querySelector('svg');
  svgElement.style.transition = 'transform 0.3s ease';
  
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    refreshBtn.style.opacity = '0.5';
    
    const svg = refreshBtn.querySelector('svg');
    svg.style.animation = 'spin 1s linear infinite';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    localStorage.removeItem('ms_global_leaderboard');
    localStorage.removeItem('ms_global_leaderboard_timestamp');
    
    const freshLeaderboard = await getLeaderboard();
    modal.remove();
    showLeaderboardModal(freshLeaderboard, currentUser);
    
    showToast('Leaderboard refreshed!', 'success');
  });
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: #666;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  `;
  closeBtn.addEventListener('click', () => modal.remove());
  closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = '#f3f4f6');
  closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'none');
  
  titleSection.appendChild(title);
  titleSection.appendChild(refreshBtn);
  header.appendChild(titleSection);
  header.appendChild(closeBtn);
  
  const signalInfo = document.createElement('div');
  const sentCount = getDailySentCount();
  const remaining = 5 - sentCount;
  signalInfo.style.cssText = `
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(109, 40, 217, 0.1));
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #6D28D9;
  `;
  signalInfo.innerHTML = `
    <strong>Signals remaining today:</strong> ${remaining}/5
    <br>
    <span style="opacity: 0.8; font-size: 0.8rem;">Send signals to motivate fellow siegers!</span>
  `;
  
  const list = document.createElement('div');
  list.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `;
  
  leaderboard.forEach((user, index) => {
    const row = createLeaderboardRow(user, index + 1, currentUser);
    list.appendChild(row);
  });
  
  content.appendChild(header);
  content.appendChild(signalInfo);
  content.appendChild(list);
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function createLeaderboardRow(user, rank, currentUser) {
  const row = document.createElement('div');
  row.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: ${user.username === currentUser ? 'rgba(139, 92, 246, 0.1)' : '#f9fafb'};
    border: 2px solid ${user.username === currentUser ? 'rgba(139, 92, 246, 0.4)' : 'rgba(64,43,32,0.1)'};
    border-radius: 8px;
    transition: all 0.2s;
  `;
  
  const rankBadge = document.createElement('span');
  rankBadge.textContent = `#${rank}`;
  rankBadge.style.cssText = `
    font-weight: 700;
    font-size: 1.1rem;
    color: ${rank <= 3 ? '#d97706' : '#6b7280'};
    min-width: 3rem;
  `;
  
  const userInfo = document.createElement('div');
  userInfo.style.cssText = `
    flex: 1;
    margin: 0 1rem;
  `;
  
  const username = document.createElement('div');
  const displayName = user.username + (user.username === currentUser ? ' (You)' : '');
  username.textContent = displayName;
  
  username.style.cssText = `
    font-weight: 600;
    color: #1f2937;
    font-size: 1rem;
  `;
  
  const stats = document.createElement('div');
  stats.style.cssText = `
    font-size: 0.8rem;
    color: #6b7280;
    margin-top: 0.25rem;
  `;
  
  const sourceBadge = user.source === 'local' 
    ? '<span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 0.5rem;">Extension</span>'
    : '';
  
  stats.innerHTML = `🪙 ${user.coins} coins${sourceBadge}`;
  
  userInfo.appendChild(username);
  userInfo.appendChild(stats);
  
  const actions = document.createElement('div');
  actions.style.cssText = `
    display: flex;
    gap: 0.5rem;
  `;
  
  if (user.username !== currentUser) {
    Object.values(SIGNAL_TYPES).forEach(signalType => {
      const btn = document.createElement('button');
      btn.innerHTML = signalType.icon;
      btn.title = signalType.description;
      btn.style.cssText = `
        width: 36px;
        height: 36px;
        border: 2px solid rgba(139, 92, 246, 0.3);
        background: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(139, 92, 246, 0.8);
      `;
      
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(139, 92, 246, 0.1)';
        btn.style.borderColor = 'rgba(139, 92, 246, 0.6)';
        btn.style.transform = 'scale(1.1)';
        btn.style.color = 'rgba(139, 92, 246, 1)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'white';
        btn.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        btn.style.transform = 'scale(1)';
        btn.style.color = 'rgba(139, 92, 246, 0.8)';
      });
      
      btn.addEventListener('click', async () => {
        if (!canSendMoreSignals()) {
          showToast('Daily signal limit reached (5/day)', 'error');
          return;
        }
        
        btn.disabled = true;
        btn.style.opacity = '0.5';
        
        try {
          await sendSignal(currentUser, user.username, signalType.id);
          showToast(`${signalType.label} sent to ${user.username}!`, 'success');
          
          const modal = document.getElementById('ms-leaderboard-modal');
          if (modal) {
            const leaderboard = await getLeaderboard();
            modal.remove();
            showLeaderboardModal(leaderboard, currentUser);
          }
        } catch (error) {
          showToast(error.message, 'error');
          btn.disabled = false;
          btn.style.opacity = '1';
        }
      });
      
      actions.appendChild(btn);
    });
  }
  
  row.appendChild(rankBadge);
  row.appendChild(userInfo);
  row.appendChild(actions);
  
  return row;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
    color: white;
    border-radius: 8px;
    font-family: 'IM Fell English', serif;
    font-size: 0.95rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 10001;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
