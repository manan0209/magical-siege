import { DOMExtractor } from '../utils/dom-extractor.js';
import { TimeUtils } from '../utils/time.js';

export function injectKeepEnhancements() {
  console.log('Keep page enhancements loading...');
  
  const homeContainer = document.querySelector('.home-container');
  if (!homeContainer) {
    console.log('Home container not found');
    return;
  }
  
  injectEnhancedStats();
  injectQuickActions();
}

function injectEnhancedStats() {
  const homeContainer = document.querySelector('.home-container');
  if (!homeContainer) return;
  
  const progressData = DOMExtractor.getProgressData();
  const timeData = TimeUtils.getTimeRemaining();
  
  const statsCard = document.createElement('div');
  statsCard.className = 'home-card';
  statsCard.style.cssText = 'margin-top: 1rem;';
  
  statsCard.innerHTML = `
    <div class="home-card-body">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
        <div style="text-align: center;">
          <div style="font-size: 0.875rem; opacity: 0.7;">Hours Needed</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #3b2a1a;">
            ${Math.max(0, progressData.goalHours - progressData.hoursThisWeek).toFixed(1)}h
          </div>
        </div>
        
        <div style="text-align: center;">
          <div style="font-size: 0.875rem; opacity: 0.7;">Daily Target</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #3b2a1a;">
            ${(Math.max(0, progressData.goalHours - progressData.hoursThisWeek) / Math.max(1, timeData.days + (timeData.hours / 24))).toFixed(1)}h/day
          </div>
        </div>
        
        <div style="text-align: center;">
          <div style="font-size: 0.875rem; opacity: 0.7;">Time Remaining</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #8B5CF6;">
            ${timeData.days}d ${timeData.hours}h
          </div>
        </div>
      </div>
    </div>
  `;
  
  homeContainer.insertBefore(statsCard, homeContainer.children[2] || null);
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
        <a href="/projects/new" class="submit-button" style="text-decoration: none;">
          New Project
        </a>
        <a href="/projects" class="submit-button" style="text-decoration: none; background: linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%);">
          View Projects
        </a>
        <a href="/market" class="submit-button" style="text-decoration: none; background: linear-gradient(135deg, #78543 7 0%, #9A7B4F 100%);">
          Visit Market
        </a>
      </div>
    </div>
  `;
  
  homeContainer.appendChild(actionsCard);
}
