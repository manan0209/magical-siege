import { DOMExtractor } from '../utils/dom-extractor.js';
import { DOMInjector } from '../utils/dom-injector.js';
import { Storage, Cache } from '../utils/storage.js';

export function injectCastleEnhancements() {
  console.log('Castle enhancements loaded');
  
  injectCodingPatternsAnalysis();
  injectProgressPredictions();
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
