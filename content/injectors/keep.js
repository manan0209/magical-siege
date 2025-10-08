import { DOMExtractor } from '../utils/dom-extractor.js';
import { DOMInjector } from '../utils/dom-injector.js';
import { TimeUtils } from '../utils/time.js';

export function injectKeepEnhancements() {
  console.log('Keep enhancements loaded, my liege!');
  
  injectProgressTracker();
  injectDeadlineCountdown();
  injectProjectSnapshot();
  injectQuickStats();
}

// makin keep awesome :hehe:

function injectProgressTracker() {
  const progressData = DOMExtractor.getProgressData();
  const timeRemaining = TimeUtils.getTimeRemaining();
  const weekInfo = DOMExtractor.getWeekInfo();
  
  const hoursCompleted = progressData.hoursThisWeek;
  const hoursGoal = progressData.goalHours;
  const progressPercentage = Math.min((hoursCompleted / hoursGoal) * 100, 100);
  const hoursRemaining = Math.max(hoursGoal - hoursCompleted, 0);
  
  const statusClass = hoursCompleted >= hoursGoal ? 'ms-badge-success' : 
                      hoursCompleted >= hoursGoal * 0.5 ? 'ms-badge-warning' : 
                      'ms-badge-danger';
  
  const statusText = hoursCompleted >= hoursGoal ? 'Goal Reached' : 
                     hoursCompleted >= hoursGoal * 0.5 ? 'In Progress' : 
                     'Behind Schedule';
  
  const widget = DOMInjector.createWidget(
    'Enhanced Progress Tracker',
    `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="ms-stat-card flex-1 mr-3">
            <div class="ms-stat-label">Hours This Week</div>
            <div class="ms-stat-value">${hoursCompleted.toFixed(1)}h</div>
          </div>
          <div class="ms-stat-card flex-1">
            <div class="ms-stat-label">Remaining</div>
            <div class="ms-stat-value">${hoursRemaining.toFixed(1)}h</div>
          </div>
        </div>

        <div>
          <div class="flex justify-between mb-2">
            <span class="text-sm font-semibold">Week ${weekInfo.currentWeek || '?'} Progress</span>
            <span class="text-sm font-bold text-purple-primary">${progressPercentage.toFixed(0)}%</span>
          </div>
          <div class="ms-progress-bar">
            <div class="ms-progress-fill" style="width: ${progressPercentage}%"></div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span class="ms-badge ${statusClass}">${statusText}</span>
          <span class="text-sm text-gray-600">
            ${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m until deadline
          </span>
        </div>

        ${hoursCompleted < hoursGoal ? `
          <div class="ms-stat-card bg-purple-50">
            <div class="text-sm text-purple-700">
              <strong>Quick Math:</strong> You need <strong>${(hoursRemaining / Math.max(timeRemaining.days, 1)).toFixed(1)} hours/day</strong> 
              to reach your goal by Monday midnight.
            </div>
          </div>
        ` : ''}
      </div>
    `,
    'ms-fade-in'
  );

  const targetElement = document.querySelector('main') || document.querySelector('.container');
  if (targetElement) {
    DOMInjector.injectAtTop(targetElement, widget);
  }
}

function injectDeadlineCountdown() {
  const timeRemaining = TimeUtils.getTimeRemaining();
  const isVoting = TimeUtils.isVotingDay();
  
  const countdownWidget = document.createElement('div');
  countdownWidget.id = 'ms-deadline-countdown';
  countdownWidget.className = 'ms-countdown ms-slide-in';
  
  function updateCountdown() {
    const time = TimeUtils.getTimeRemaining();
    const formatted = TimeUtils.formatTimeRemaining(time);
    const urgencyClass = time.totalHours < 24 ? 'animate-pulse' : '';
    
    countdownWidget.innerHTML = `
      <div class="${urgencyClass}">
        <div class="ms-countdown-label">
          ${isVoting ? 'Voting Period Ends In' : 'Week Deadline In'}
        </div>
        <div class="ms-countdown-value">
          ${formatted}
        </div>
        <div class="text-xs mt-2 opacity-75">
          ${isVoting ? 'Cast your votes now!' : 'Monday 12:00 AM EST'}
        </div>
      </div>
    `;
  }
  
  updateCountdown();
  setInterval(updateCountdown, 60000);
  
  const progressTracker = document.querySelector('.ms-widget');
  if (progressTracker) {
    DOMInjector.injectAfter(progressTracker, countdownWidget);
  }
}

function injectProjectSnapshot() {
  const projects = DOMExtractor.getProjectData();
  const weekInfo = DOMExtractor.getWeekInfo();
  
  if (projects.length === 0) {
    return;
  }
  
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => 
    p.status.toLowerCase().includes('complete') || 
    p.status.toLowerCase().includes('done') ||
    p.status.toLowerCase().includes('submitted')
  ).length;
  
  const inProgressProjects = projects.filter(p => 
    p.status.toLowerCase().includes('progress') ||
    p.status.toLowerCase().includes('working') ||
    p.status.toLowerCase().includes('active')
  ).length;
  
  const projectsList = projects.slice(0, 5).map(project => {
    const statusBadge = project.status.toLowerCase().includes('complete') ? 'ms-badge-success' :
                       project.status.toLowerCase().includes('progress') ? 'ms-badge-warning' :
                       'ms-badge-info';
    
    return `
      <div class="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
        <span class="font-medium text-sm truncate flex-1">${project.name}</span>
        <span class="ms-badge ${statusBadge} ml-2 text-xs">${project.status}</span>
      </div>
    `;
  }).join('');
  
  const widget = DOMInjector.createWidget(
    'Project Snapshot',
    `
      <div class="space-y-4">
        <div class="grid grid-cols-3 gap-3">
          <div class="ms-stat-card text-center">
            <div class="ms-stat-label">Total</div>
            <div class="ms-stat-value">${totalProjects}</div>
          </div>
          <div class="ms-stat-card text-center">
            <div class="ms-stat-label">Completed</div>
            <div class="ms-stat-value text-green-600">${completedProjects}</div>
          </div>
          <div class="ms-stat-card text-center">
            <div class="ms-stat-label">In Progress</div>
            <div class="ms-stat-value text-yellow-600">${inProgressProjects}</div>
          </div>
        </div>

        <div class="ms-divider"></div>

        <div>
          <h3 class="font-bold text-sm mb-3 text-castle-brown">Recent Projects</h3>
          <div class="space-y-1">
            ${projectsList}
          </div>
          ${projects.length > 5 ? `
            <div class="text-center mt-3">
              <span class="text-xs text-gray-500">+${projects.length - 5} more projects</span>
            </div>
          ` : ''}
        </div>
      </div>
    `,
    'ms-fade-in'
  );
  
  const countdownWidget = document.getElementById('ms-deadline-countdown');
  if (countdownWidget) {
    DOMInjector.injectAfter(countdownWidget, widget);
  }
}

function injectQuickStats() {
  const userData = DOMExtractor.getUserData();
  const weekInfo = DOMExtractor.getWeekInfo();
  const progressData = DOMExtractor.getProgressData();
  
  const currentWeek = weekInfo.currentWeek || 0;
  const totalWeeks = weekInfo.totalWeeks;
  const weeksRemaining = Math.max(totalWeeks - currentWeek, 0);
  const siegeProgress = currentWeek > 0 ? ((currentWeek / totalWeeks) * 100).toFixed(0) : 0;
  
  const averageHoursPerWeek = currentWeek > 0 ? (progressData.hoursThisWeek / currentWeek).toFixed(1) : progressData.hoursThisWeek.toFixed(1);
  const projectedTotal = currentWeek > 0 ? (averageHoursPerWeek * totalWeeks).toFixed(0) : (progressData.hoursThisWeek * totalWeeks).toFixed(0);
  
  const widget = DOMInjector.createWidget(
    'Quick Stats',
    `
      <div class="grid grid-cols-2 gap-4">
        <div class="ms-stat-card">
          <div class="ms-stat-label">Current Week</div>
          <div class="ms-stat-value">${currentWeek} / ${totalWeeks}</div>
          <div class="text-xs text-gray-600 mt-1">${weeksRemaining} weeks left</div>
        </div>

        <div class="ms-stat-card">
          <div class="ms-stat-label">Siege Progress</div>
          <div class="ms-stat-value">${siegeProgress}%</div>
          <div class="w-full h-2 bg-gray-200 rounded-full mt-2">
            <div class="h-full bg-gradient-to-r from-purple-primary to-purple-light rounded-full" 
                 style="width: ${siegeProgress}%"></div>
          </div>
        </div>

        ${userData.coins !== null ? `
          <div class="ms-stat-card">
            <div class="ms-stat-label">Total Coins</div>
            <div class="ms-stat-value text-yellow-600">${userData.coins}</div>
            ${userData.rank ? `<div class="text-xs text-gray-600 mt-1">Rank #${userData.rank}</div>` : ''}
          </div>
        ` : ''}

        <div class="ms-stat-card">
          <div class="ms-stat-label">Avg Hours/Week</div>
          <div class="ms-stat-value">${averageHoursPerWeek}h</div>
          <div class="text-xs text-gray-600 mt-1">~${projectedTotal}h total</div>
        </div>

        ${userData.name ? `
          <div class="ms-stat-card col-span-2 bg-gradient-to-r from-purple-50 to-blue-50">
            <div class="text-center">
              <div class="text-sm text-gray-600 mb-1">Sieger</div>
              <div class="text-xl font-bold text-purple-primary">${userData.name}</div>
            </div>
          </div>
        ` : ''}
      </div>
    `,
    'ms-fade-in'
  );
  
  const projectSnapshot = document.querySelectorAll('.ms-widget')[2];
  if (projectSnapshot) {
    DOMInjector.injectAfter(projectSnapshot, widget);
  }
}
