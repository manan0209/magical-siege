import { DOMExtractor } from '../utils/dom-extractor.js';
import { TimeUtils } from '../utils/time.js';

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
  if (!progressText) return { hours: 0, percent: 0 };
  
  const text = progressText.textContent;
  
  if (text.includes("you've been pillaging")) {
    const match = text.match(/(\d+)h\s*(\d+)m/);
    if (match) {
      return {
        hours: parseInt(match[1]) + parseInt(match[2]) / 60,
        percent: 100,
        pillaging: true
      };
    }
  }
  
  const percentMatch = text.match(/(\d+\.?\d*)%/);
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1]);
    const hours = (percent / 100) * 10;
    return { hours, percent, pillaging: false };
  }
  
  return { hours: 0, percent: 0, pillaging: false };
}

function injectEnhancedStats() {
  const homeContainer = document.querySelector('.home-container');
  if (!homeContainer) return;
  
  const progress = extractActualProgress();
  const timeData = TimeUtils.getTimeRemaining();
  
  const statsCard = document.createElement('div');
  statsCard.className = 'home-card';
  statsCard.style.cssText = 'margin-top: 1rem;';
  
  const hoursNeeded = Math.max(0, 10 - progress.hours);
  const daysLeft = timeData.days + (timeData.hours / 24);
  const dailyTarget = daysLeft > 0 ? hoursNeeded / daysLeft : hoursNeeded;
  
  statsCard.innerHTML = `
    <div class="home-card-body">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
        <div style="text-align: center;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif;">Hours Left</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #3b2a1a; font-family: 'Jaini', serif;">
            ${hoursNeeded.toFixed(1)}h
          </div>
        </div>
        
        <div style="text-align: center;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif;">Daily Target</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: ${dailyTarget > 5 ? '#ef4444' : '#3b2a1a'}; font-family: 'Jaini', serif;">
            ${dailyTarget.toFixed(1)}h/day
          </div>
        </div>
        
        <div style="text-align: center;">
          <div style="font-size: 0.875rem; opacity: 0.7; font-family: 'IM Fell English', serif;">Time Left</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: ${timeData.days < 2 ? '#ef4444' : '#8B5CF6'}; font-family: 'Jaini', serif;">
            ${timeData.days}d ${timeData.hours}h
          </div>
        </div>
      </div>
    </div>
  `;
  
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
