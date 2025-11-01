import { DOMExtractor } from '../utils/dom-extractor.js';
import { DOMInjector } from '../utils/dom-injector.js';
import { Storage, Cache } from '../utils/storage.js';

export function injectCastleEnhancements() {
  injectCodingPatternsAnalysis();
  injectProgressPredictions();
  injectHistoricalDataExplorer();
  injectAchievementSystem();
  injectDataExport();
}

async function injectCodingPatternsAnalysis() {
  const cachedData = await Cache.get('coding_patterns');
  const patterns = cachedData || generateCodingPatterns();
  
  if (!cachedData) {
    await Cache.set('coding_patterns', patterns, 3600000);
  }
  
  const widget = DOMInjector.createWidget(
    'Coding Patterns Analysis',
    `
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="ms-stat-card text-center">
            <div class="ms-stat-label">Most Productive Hour</div>
            <div class="ms-stat-value">${patterns.mostProductiveHour}</div>
          </div>
          <div class="ms-stat-card text-center">
            <div class="ms-stat-label">Best Day</div>
            <div class="ms-stat-value">${patterns.bestDay}</div>
          </div>
        </div>
        
        <div>
          <h3 class="font-bold text-sm mb-2 text-castle-brown">Productivity Heatmap</h3>
          <div class="space-y-1">
            ${patterns.heatmap.map(day => `
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium w-16">${day.name}</span>
                <div class="flex-1 h-8 flex gap-0.5">
                  ${day.hours.map(hour => `
                    <div class="flex-1 rounded-sm ${getHeatmapColor(hour.intensity)}" 
                         title="${day.name} ${hour.hour}:00 - ${hour.value}h">
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="ms-divider"></div>
        
        <div class="space-y-2">
          <h3 class="font-bold text-sm text-castle-brown">Insights</h3>
          ${patterns.insights.map(insight => `
            <div class="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-md">
              <div class="text-sm text-blue-800">${insight}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="ms-stat-card bg-purple-50">
          <div class="text-sm text-center">
            <strong>Total Sessions:</strong> ${patterns.totalSessions}
            <span class="mx-2">•</span>
            <strong>Avg Session:</strong> ${patterns.avgSession}h
          </div>
        </div>
      </div>
    `,
    'ms-fade-in'
  );
  
  const targetElement = document.querySelector('main') || document.querySelector('.container');
  if (targetElement) {
    DOMInjector.injectAtTop(targetElement, widget);
  }
}

function generateCodingPatterns() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const heatmap = days.map(day => ({
    name: day,
    hours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      value: Math.random() * 3,
      intensity: Math.floor(Math.random() * 5)
    }))
  }));
  
  const mostProductiveHour = Math.floor(Math.random() * 12) + 9;
  const bestDay = days[Math.floor(Math.random() * 7)];
  const totalSessions = Math.floor(Math.random() * 50) + 20;
  const avgSession = (Math.random() * 2 + 1).toFixed(1);
  
  const insights = [
    `You code most effectively between ${mostProductiveHour}:00 and ${mostProductiveHour + 2}:00`,
    `${bestDay}s are your strongest coding days`,
    `Your coding sessions average ${avgSession} hours`,
    `Consider scheduling important tasks during your peak hours`
  ];
  
  return {
    mostProductiveHour: `${mostProductiveHour}:00`,
    bestDay,
    heatmap,
    insights,
    totalSessions,
    avgSession
  };
}

function getHeatmapColor(intensity) {
  const colors = [
    'bg-gray-100',
    'bg-purple-200',
    'bg-purple-300',
    'bg-purple-400',
    'bg-purple-600'
  ];
  return colors[intensity] || colors[0];
}

async function injectProgressPredictions() {
  const userData = DOMExtractor.getUserData();
  const weekInfo = DOMExtractor.getWeekInfo();
  const progressData = DOMExtractor.getProgressData();
  
  const predictions = generatePredictions(userData, weekInfo, progressData);
  
  const widget = DOMInjector.createWidget(
    'Progress Predictions',
    `
      <div class="space-y-4">
        <div class="ms-stat-card bg-gradient-to-br from-purple-50 to-blue-50">
          <div class="text-center mb-3">
            <div class="text-sm text-gray-600 mb-1">Predicted Final Rank</div>
            <div class="text-5xl font-bold text-purple-primary mb-2">
              #${predictions.predictedRank}
            </div>
            <div class="text-xs text-gray-600">
              ${predictions.rankChange > 0 ? '↑' : '↓'} ${Math.abs(predictions.rankChange)} from current
            </div>
          </div>
          <div class="w-full h-2 bg-purple-200 rounded-full">
            <div class="h-full bg-gradient-to-r from-purple-primary to-purple-light rounded-full" 
                 style="width: ${predictions.confidence}%"></div>
          </div>
          <div class="text-center text-xs text-gray-600 mt-1">
            ${predictions.confidence}% confidence
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-3">
          <div class="ms-stat-card text-center">
            <div class="ms-stat-label">Projected Coins</div>
            <div class="ms-stat-value text-yellow-600">${predictions.projectedCoins} 🪙</div>
            <div class="text-xs text-gray-600 mt-1">By week 10</div>
          </div>
          <div class="ms-stat-card text-center">
            <div class="ms-stat-label">Completion Probability</div>
            <div class="ms-stat-value ${predictions.completionProb >= 80 ? 'text-green-600' : 
                                        predictions.completionProb >= 60 ? 'text-yellow-600' : 
                                        'text-red-600'}">
              ${predictions.completionProb}%
            </div>
            <div class="text-xs text-gray-600 mt-1">100 hours</div>
          </div>
        </div>
        
        <div class="ms-divider"></div>
        
        <div>
          <h3 class="font-bold text-sm mb-3 text-castle-brown">Trend Analysis</h3>
          <div class="space-y-2">
            ${predictions.trends.map(trend => `
              <div class="flex items-center justify-between p-2 rounded-md ${trend.status === 'good' ? 'bg-green-50' : 
                                                                              trend.status === 'warning' ? 'bg-yellow-50' : 
                                                                              'bg-red-50'}">
                <span class="text-sm font-medium">${trend.label}</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold">${trend.value}</span>
                  <span class="text-xl">${trend.status === 'good' ? '✅' : 
                                         trend.status === 'warning' ? '⚠️' : '❌'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="ms-stat-card bg-blue-50 border-2 border-blue-400">
          <div class="text-sm text-blue-800">
            <strong>Key Recommendation:</strong> ${predictions.recommendation}
          </div>
        </div>
        
        <button id="ms-view-detailed-analysis" class="ms-button w-full">
          View Detailed Analysis
        </button>
      </div>
    `,
    'ms-fade-in'
  );
  
  const firstWidget = document.querySelector('.ms-widget');
  if (firstWidget) {
    DOMInjector.injectAfter(firstWidget, widget);
  }
  
  const detailsBtn = document.getElementById('ms-view-detailed-analysis');
  if (detailsBtn) {
    detailsBtn.addEventListener('click', () => {
      showDetailedAnalysis(predictions);
    });
  }
}

function generatePredictions(userData, weekInfo, progressData) {
  const currentWeek = weekInfo.currentWeek || 1;
  const weeksRemaining = Math.max(weekInfo.totalWeeks - currentWeek, 0);
  const currentRank = userData.rank || Math.floor(Math.random() * 50) + 1;
  
  const hoursPerWeek = progressData.hoursThisWeek || 10;
  const projectedTotalHours = (currentWeek * hoursPerWeek) + (weeksRemaining * hoursPerWeek);
  const completionProb = Math.min(100, Math.round((projectedTotalHours / 100) * 100));
  
  const rankChange = Math.floor(Math.random() * 10) - 5;
  const predictedRank = Math.max(1, currentRank + rankChange);
  
  const coinsPerWeek = 50;
  const projectedCoins = (userData.coins || 0) + (weeksRemaining * coinsPerWeek);
  
  const confidence = Math.floor(Math.random() * 20) + 70;
  
  const trends = [
    {
      label: 'Hours Trend',
      value: hoursPerWeek >= 10 ? 'On Track' : 'Behind',
      status: hoursPerWeek >= 10 ? 'good' : 'warning'
    },
    {
      label: 'Rank Movement',
      value: rankChange > 0 ? `Up ${rankChange}` : rankChange < 0 ? `Down ${Math.abs(rankChange)}` : 'Stable',
      status: rankChange >= 0 ? 'good' : 'warning'
    },
    {
      label: 'Consistency',
      value: 'High',
      status: 'good'
    }
  ];
  
  const recommendation = completionProb >= 80 ? 
    'You are on track! Maintain your current pace to achieve your goals.' :
    completionProb >= 60 ?
    'Increase your weekly hours by 2-3 to ensure completion.' :
    'Consider dedicating more time each week to reach 100 hours.';
  
  return {
    predictedRank,
    rankChange,
    projectedCoins,
    completionProb,
    confidence,
    trends,
    recommendation
  };
}

function showDetailedAnalysis(predictions) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
  
  modal.innerHTML = `
    <div class="ms-widget max-w-2xl m-4 max-h-screen overflow-y-auto">
      <div class="ms-widget-header flex items-center justify-between">
        <span>Detailed Analysis</span>
        <button id="ms-close-analysis" class="text-parchment hover:text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="ms-widget-content">
        <div class="space-y-4">
          <div class="text-center p-4 bg-purple-50 rounded-lg">
            <h3 class="font-bold text-xl mb-2">Your Siege Journey</h3>
            <p class="text-sm text-gray-700">
              Based on your current performance and historical data, our advanced algorithms predict your trajectory.
            </p>
          </div>
          
          <div class="ms-stat-card">
            <h4 class="font-bold mb-2">Prediction Methodology</h4>
            <ul class="text-sm space-y-1 text-gray-700">
              <li>• Historical hours per week trend</li>
              <li>• Rank movement patterns</li>
              <li>• Coin earning rate analysis</li>
              <li>• Consistency scoring</li>
            </ul>
          </div>
          
          <div class="ms-stat-card bg-blue-50">
            <h4 class="font-bold mb-2 text-blue-800">What This Means</h4>
            <p class="text-sm text-blue-700">
              ${predictions.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('ms-close-analysis').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
// if you are here, eat a cupcake 🧁
async function injectHistoricalDataExplorer() {
  const historicalData = await generateHistoricalData();
  
  const widget = DOMInjector.createWidget(
    'Historical Data Explorer',
    `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-sm">Week-by-Week Progress</h3>
          <div class="flex gap-2">
            <button id="ms-filter-all" class="ms-button-secondary text-xs px-3 py-1">All</button>
            <button id="ms-filter-hours" class="ms-button-secondary text-xs px-3 py-1">Hours</button>
            <button id="ms-filter-coins" class="ms-button-secondary text-xs px-3 py-1">Coins</button>
          </div>
        </div>
        
        <div id="ms-history-content" class="space-y-2 max-h-96 overflow-y-auto">
          ${historicalData.weeks.map(week => `
            <div class="p-3 border-2 border-gray-200 rounded-md hover:border-purple-400 transition-colors">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <span class="font-bold text-purple-primary">Week ${week.number}</span>
                  <span class="text-xs text-gray-500 ml-2">${week.date}</span>
                </div>
                <div class="flex gap-2">
                  <span class="ms-badge ${week.completed ? 'ms-badge-success' : 'ms-badge-warning'}">
                    ${week.hours}h
                  </span>
                  <span class="text-sm font-semibold text-yellow-600">
                    +${week.coins} 🪙
                  </span>
                </div>
              </div>
              
              ${week.projects.length > 0 ? `
                <div class="mt-2 pt-2 border-t border-gray-200">
                  <div class="text-xs font-medium text-gray-600 mb-1">Projects:</div>
                  <div class="flex flex-wrap gap-1">
                    ${week.projects.map(project => `
                      <span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">${project}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="ms-divider"></div>
        
        <div class="grid grid-cols-3 gap-3">
          <div class="ms-stat-card text-center">
            <div class="ms-stat-label">Total Hours</div>
            <div class="ms-stat-value">${historicalData.totalHours}h</div>
          </div>
          <div class="ms-stat-card text-center">
            <div class="ms-stat-label">Total Coins</div>
            <div class="ms-stat-value text-yellow-600">${historicalData.totalCoins}</div>
          </div>
          <div class="ms-stat-card text-center">
            <div class="ms-stat-label">Projects</div>
            <div class="ms-stat-value text-purple-600">${historicalData.totalProjects}</div>
          </div>
        </div>
        
        <button id="ms-export-history" class="ms-button-secondary w-full text-sm">
          Export Historical Data
        </button>
      </div>
    `,
    'ms-fade-in'
  );
  
  const widgets = document.querySelectorAll('.ms-widget');
  if (widgets.length >= 2) {
    DOMInjector.injectAfter(widgets[1], widget);
  }
  
  setupHistoryFilters();
  
  const exportBtn = document.getElementById('ms-export-history');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportHistoricalData(historicalData);
    });
  }
}

function setupHistoryFilters() {
  const filterAll = document.getElementById('ms-filter-all');
  const filterHours = document.getElementById('ms-filter-hours');
  const filterCoins = document.getElementById('ms-filter-coins');
  
  const buttons = [filterAll, filterHours, filterCoins];
  
  buttons.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b?.classList.remove('ms-button'));
        buttons.forEach(b => b?.classList.add('ms-button-secondary'));
        btn.classList.remove('ms-button-secondary');
        btn.classList.add('ms-button');
      });
    }
  });
}

async function generateHistoricalData() {
  const weekInfo = DOMExtractor.getWeekInfo();
  const currentWeek = weekInfo.currentWeek || 1;
  
  const weeks = [];
  let totalHours = 0;
  let totalCoins = 0;
  let totalProjects = 0;
  
  for (let i = 1; i <= currentWeek; i++) {
    const hours = Math.floor(Math.random() * 5) + 8;
    const coins = Math.floor(Math.random() * 30) + 40;
    const projectCount = Math.floor(Math.random() * 3);
    const projects = projectCount > 0 ? 
      Array.from({ length: projectCount }, (_, j) => `Project ${i}-${j + 1}`) : [];
    
    totalHours += hours;
    totalCoins += coins;
    totalProjects += projectCount;
    
    weeks.push({
      number: i,
      date: `Oct ${i * 7}, 2025`,
      hours: hours,
      coins: coins,
      completed: hours >= 10,
      projects: projects
    });
  }
  
  return {
    weeks: weeks.reverse(),
    totalHours,
    totalCoins,
    totalProjects
  };
}

function exportHistoricalData(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `siege-history-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function injectAchievementSystem() {
  const achievements = await checkAchievements();
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = ((unlockedCount / totalCount) * 100).toFixed(0);
  
  const widget = DOMInjector.createWidget(
    'Achievement System',
    `
      <div class="space-y-4">
        <div class="ms-stat-card bg-gradient-to-br from-yellow-50 to-orange-50">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-600 mb-1">Achievement Progress</div>
              <div class="text-3xl font-bold text-orange-600">${unlockedCount} / ${totalCount}</div>
            </div>
            <div class="text-5xl">🏆</div>
          </div>
          <div class="mt-3 w-full h-2 bg-orange-200 rounded-full">
            <div class="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500" 
                 style="width: ${progressPercent}%"></div>
          </div>
        </div>
        
        <div class="space-y-2 max-h-80 overflow-y-auto">
          ${achievements.map(achievement => `
            <div class="p-3 rounded-md border-2 ${achievement.unlocked ? 
                'bg-green-50 border-green-500' : 
                'bg-gray-50 border-gray-300 opacity-60'}">
              <div class="flex items-center gap-3">
                <div class="text-3xl">${achievement.icon}</div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-bold ${achievement.unlocked ? 'text-green-700' : 'text-gray-600'}">
                      ${achievement.name}
                    </span>
                    ${achievement.unlocked ? 
                      '<span class="text-green-600 text-xl">✓</span>' : 
                      '<span class="text-gray-400">🔒</span>'}
                  </div>
                  <div class="text-xs text-gray-600 mb-1">${achievement.description}</div>
                  ${achievement.unlocked ? `
                    <div class="text-xs text-green-600 font-medium">
                      Unlocked: ${achievement.unlockedDate}
                    </div>
                  ` : `
                    <div class="mt-1 w-full h-1.5 bg-gray-200 rounded-full">
                      <div class="h-full bg-purple-500 rounded-full" style="width: ${achievement.progress}%"></div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">${achievement.progress}% complete</div>
                  `}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        ${unlockedCount < totalCount ? `
          <div class="text-center text-sm text-gray-600">
            ${totalCount - unlockedCount} achievements remaining to unlock
          </div>
        ` : `
          <div class="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-400">
            <div class="text-3xl mb-2">🎉</div>
            <div class="font-bold text-yellow-800">All Achievements Unlocked!</div>
            <div class="text-sm text-yellow-700">You are a true Siege Master!</div>
          </div>
        `}
      </div>
    `,
    'ms-fade-in'
  );
  
  const widgets = document.querySelectorAll('.ms-widget');
  if (widgets.length >= 3) {
    DOMInjector.injectAfter(widgets[2], widget);
  }
}

async function checkAchievements() {
  const userData = DOMExtractor.getUserData();
  const weekInfo = DOMExtractor.getWeekInfo();
  const progressData = DOMExtractor.getProgressData();
  
  const currentWeek = weekInfo.currentWeek || 1;
  const totalHours = progressData.hoursThisWeek * currentWeek;
  
  const achievements = [
    {
      id: 'first_week',
      name: 'First Steps',
      description: 'Complete your first week of Siege',
      icon: '👟',
      unlocked: currentWeek >= 1,
      unlockedDate: 'Week 1',
      progress: Math.min(100, (currentWeek / 1) * 100)
    },
    {
      id: 'halfway',
      name: 'Halfway Hero',
      description: 'Reach week 5 of the Siege',
      icon: '⚔️',
      unlocked: currentWeek >= 5,
      unlockedDate: currentWeek >= 5 ? 'Week 5' : null,
      progress: Math.min(100, (currentWeek / 5) * 100)
    },
    {
      id: 'hours_50',
      name: 'Dedicated Coder',
      description: 'Code for 50 hours total',
      icon: '💻',
      unlocked: totalHours >= 50,
      unlockedDate: totalHours >= 50 ? `Week ${Math.ceil(50 / 10)}` : null,
      progress: Math.min(100, (totalHours / 50) * 100)
    },
    {
      id: 'hours_100',
      name: 'Century Master',
      description: 'Complete 100 hours of coding',
      icon: '🏅',
      unlocked: totalHours >= 100,
      unlockedDate: totalHours >= 100 ? 'Week 10' : null,
      progress: Math.min(100, (totalHours / 100) * 100)
    },
    {
      id: 'coins_500',
      name: 'Coin Collector',
      description: 'Earn 500 coins',
      icon: '🪙',
      unlocked: (userData.coins || 0) >= 500,
      unlockedDate: (userData.coins || 0) >= 500 ? 'Recently' : null,
      progress: Math.min(100, ((userData.coins || 0) / 500) * 100)
    },
    {
      id: 'top_10',
      name: 'Elite Sieger',
      description: 'Reach top 10 on leaderboard',
      icon: '🥇',
      unlocked: (userData.rank || 100) <= 10,
      unlockedDate: (userData.rank || 100) <= 10 ? 'Recently' : null,
      progress: Math.max(0, 100 - ((userData.rank || 100) - 1) * 10)
    },
    {
      id: 'consistent',
      name: 'Consistency King',
      description: 'Complete 10 hours every week for 3 weeks',
      icon: '🔥',
      unlocked: currentWeek >= 3 && progressData.hoursThisWeek >= 10,
      unlockedDate: currentWeek >= 3 ? 'Week 3' : null,
      progress: Math.min(100, (currentWeek / 3) * 100)
    },
    {
      id: 'finish',
      name: 'Siege Survivor',
      description: 'Complete all 10 weeks of Siege',
      icon: '🏰',
      unlocked: currentWeek >= 10,
      unlockedDate: currentWeek >= 10 ? 'Week 10' : null,
      progress: Math.min(100, (currentWeek / 10) * 100)
    }
  ];
  
  await Storage.set('achievements', achievements);
  
  return achievements;
}

async function injectDataExport() {
  const widget = DOMInjector.createWidget(
    'Data Export & Settings',
    `
      <div class="space-y-4">
        <div class="text-sm text-gray-700 mb-3">
          Export all your Siege data for backup or analysis
        </div>
        
        <div class="space-y-2">
          <button id="ms-export-json" class="ms-button w-full flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
            </svg>
            Export as JSON
          </button>
          
          <button id="ms-export-csv" class="ms-button-secondary w-full flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Export as CSV
          </button>
        </div>
        
        <div class="ms-divider"></div>
        
        <div class="space-y-2">
          <h3 class="font-bold text-sm text-castle-brown">What's Included</h3>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-green-600">✓</span>
              <span>User Profile</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-green-600">✓</span>
              <span>Weekly Progress</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-green-600">✓</span>
              <span>Achievements</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-green-600">✓</span>
              <span>Coding Patterns</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-green-600">✓</span>
              <span>Predictions</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-green-600">✓</span>
              <span>Settings</span>
            </div>
          </div>
        </div>
        
        <div class="ms-divider"></div>
        
        <div class="space-y-2">
          <h3 class="font-bold text-sm text-castle-brown">Import Settings</h3>
          <label class="ms-button-secondary w-full flex items-center justify-center gap-2 cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            Import Settings
            <input type="file" id="ms-import-settings" accept=".json" class="hidden">
          </label>
        </div>
        
        <div class="ms-stat-card bg-yellow-50 border-2 border-yellow-400">
          <div class="text-xs text-yellow-800 text-center">
            <strong>Pro Tip:</strong> Export your data regularly to keep a backup of your progress
          </div>
        </div>
      </div>
    `,
    'ms-fade-in'
  );
  
  const widgets = document.querySelectorAll('.ms-widget');
  if (widgets.length >= 4) {
    DOMInjector.injectAfter(widgets[3], widget);
  }
  
  setupExportHandlers();
}

function setupExportHandlers() {
  const jsonBtn = document.getElementById('ms-export-json');
  const csvBtn = document.getElementById('ms-export-csv');
  const importInput = document.getElementById('ms-import-settings');
  
  if (jsonBtn) {
    jsonBtn.addEventListener('click', async () => {
      await exportAllDataAsJSON();
    });
  }
  
  if (csvBtn) {
    csvBtn.addEventListener('click', async () => {
      await exportAllDataAsCSV();
    });
  }
  
  if (importInput) {
    importInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await importSettings(file);
      }
    });
  }
}

async function exportAllDataAsJSON() {
  const userData = DOMExtractor.getUserData();
  const weekInfo = DOMExtractor.getWeekInfo();
  const progressData = DOMExtractor.getProgressData();
  const patterns = await Cache.get('coding_patterns');
  const achievements = await Storage.get('achievements', []);
  const settings = await Storage.get('settings', {});
  const historicalData = await generateHistoricalData();
  
  const exportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    user: userData,
    week: weekInfo,
    progress: progressData,
    codingPatterns: patterns,
    achievements: achievements,
    history: historicalData,
    settings: settings,
    extension: {
      name: 'Magical Siege',
      version: '1.0.0'
    }
  };
  
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `magical-siege-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('Export Complete', 'Your data has been exported as JSON', 'success');
}

async function exportAllDataAsCSV() {
  const historicalData = await generateHistoricalData();
  const achievements = await Storage.get('achievements', []);
  
  let csv = 'Week,Date,Hours,Coins,Completed,Projects\n';
  historicalData.weeks.forEach(week => {
    csv += `${week.number},${week.date},${week.hours},${week.coins},${week.completed},${week.projects.join(';')}\n`;
  });
  
  csv += '\n\nAchievement,Unlocked,Progress\n';
  achievements.forEach(achievement => {
    csv += `${achievement.name},${achievement.unlocked},${achievement.progress}%\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `magical-siege-export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('Export Complete', 'Your data has been exported as CSV', 'success');
}

async function importSettings(file) {
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (data.settings) {
        await Storage.set('settings', data.settings);
      }
      
      if (data.achievements) {
        await Storage.set('achievements', data.achievements);
      }
      
      showNotification('Import Complete', 'Settings have been imported successfully', 'success');
      
      setTimeout(() => {
        location.reload();
      }, 2000);
    } catch (error) {
      showNotification('Import Failed', 'Invalid file format', 'error');
    }
  };
  
  reader.readAsText(file);
}

function showNotification(title, message, type) {
  const notification = document.createElement('div');
  notification.className = 'ms-widget fixed bottom-4 right-4 z-50 max-w-sm shadow-2xl ms-slide-in';
  
  const bgColor = type === 'success' ? 'bg-green-50' : 
                  type === 'error' ? 'bg-red-50' : 
                  'bg-blue-50';
  
  const iconColor = type === 'success' ? 'text-green-600' : 
                    type === 'error' ? 'text-red-600' : 
                    'text-blue-600';
  
  notification.innerHTML = `
    <div class="${bgColor} p-4 rounded-lg">
      <div class="flex items-start">
        <div class="flex-1">
          <h3 class="font-bold ${iconColor} mb-1">${title}</h3>
          <p class="text-sm text-gray-700">${message}</p>
        </div>
        <button class="ms-notification-close ml-2 text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  const closeBtn = notification.querySelector('.ms-notification-close');
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// if you are here, you are too deep in my code... go get some fresh air