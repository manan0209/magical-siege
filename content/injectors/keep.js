import { DOMExtractor } from '../utils/dom-extractor.js';
import { DOMInjector } from '../utils/dom-injector.js';
import { TimeUtils } from '../utils/time.js';

export function injectKeepEnhancements() {
  console.log('Keep enhancements loaded');
  
  injectProgressTracker();
}

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
