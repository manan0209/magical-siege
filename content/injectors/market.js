import { DOMExtractor } from '../utils/dom-extractor.js';
import { DOMInjector } from '../utils/dom-injector.js';
import { Cache } from '../utils/storage.js';

export function injectMarketEnhancements() {
  injectPurchaseAdvisor();
  injectSmartRecommendations();
}

async function injectPurchaseAdvisor() {
  const userData = DOMExtractor.getUserData();
  const weekInfo = DOMExtractor.getWeekInfo();
  
  if (!userData.coins) {
    return;
  }
  
  const currentWeek = weekInfo.currentWeek || 1;
  const weeksRemaining = Math.max(weekInfo.totalWeeks - currentWeek, 0);
  
  const averageCoinsPerWeek = 50;
  const projectedTotalCoins = userData.coins + (weeksRemaining * averageCoinsPerWeek);
  
  const marketItems = extractMarketItems();
  const affordableNow = marketItems.filter(item => item.cost <= userData.coins).length;
  const affordableLater = marketItems.filter(item => 
    item.cost > userData.coins && item.cost <= projectedTotalCoins
  ).length;
  
  const sidebar = document.createElement('div');
  sidebar.id = 'ms-purchase-advisor';
  sidebar.className = 'fixed right-4 top-20 w-80 ms-widget ms-fade-in';
  sidebar.style.zIndex = '30';
  
  sidebar.innerHTML = `
    <div class="ms-widget-header">
      Purchase Advisor
    </div>
    <div class="ms-widget-content space-y-4">
      <div class="ms-stat-card bg-yellow-50">
        <div class="flex items-center justify-between">
          <div>
            <div class="ms-stat-label">Current Balance</div>
            <div class="ms-stat-value text-yellow-600">${userData.coins} 🪙</div>
          </div>
          ${userData.rank ? `
            <div class="text-right">
              <div class="text-xs text-gray-600">Rank</div>
              <div class="text-xl font-bold text-purple-primary">#${userData.rank}</div>
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div class="ms-stat-card text-center">
          <div class="ms-stat-label">Weeks Left</div>
          <div class="ms-stat-value">${weeksRemaining}</div>
        </div>
        <div class="ms-stat-card text-center">
          <div class="ms-stat-label">Projected</div>
          <div class="ms-stat-value text-green-600">~${projectedTotalCoins}</div>
        </div>
      </div>
      
      <div class="ms-divider"></div>
      
      <div class="space-y-2">
        <h3 class="font-bold text-sm text-castle-brown">Shopping Power</h3>
        <div class="flex items-center justify-between py-2 px-3 bg-green-50 rounded-md">
          <span class="text-sm font-medium">Affordable Now</span>
          <span class="ms-badge ms-badge-success">${affordableNow} items</span>
        </div>
        <div class="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-md">
          <span class="text-sm font-medium">By Siege End</span>
          <span class="ms-badge ms-badge-info">${affordableLater} more</span>
        </div>
      </div>
      
      <div class="ms-stat-card bg-purple-50">
        <div class="text-sm text-center text-purple-700">
          <strong>Avg. coins/week:</strong> ~${averageCoinsPerWeek} 🪙
          <div class="text-xs mt-1 text-gray-600">Based on typical earning rate</div>
        </div>
      </div>
      
      <button id="ms-optimize-purchases" class="ms-button w-full">
        Optimize My Purchases
      </button>
    </div>
  `;
  
  document.body.appendChild(sidebar);
  
  const optimizeBtn = document.getElementById('ms-optimize-purchases');
  if (optimizeBtn) {
    optimizeBtn.addEventListener('click', () => {
      showOptimizationModal(userData, marketItems, weeksRemaining);
    });
  }
}

function extractMarketItems() {
  const items = [];
  
  const itemElements = document.querySelectorAll('[data-market-item], .market-item, .shop-item');
  
  itemElements.forEach(element => {
    const nameEl = element.querySelector('.item-name, h3, h4');
    const costEl = element.querySelector('.cost, .price');
    const categoryEl = element.closest('[data-category]') || element.querySelector('[data-category]');
    
    if (nameEl && costEl) {
      items.push({
        name: nameEl.textContent.trim(),
        cost: parseInt(costEl.textContent.match(/\d+/)?.[0]) || 0,
        category: categoryEl ? categoryEl.dataset.category : 'General',
        element: element
      });
    }
  });
  
  return items;
}

function injectSmartRecommendations() {
  const userData = DOMExtractor.getUserData();
  const weekInfo = DOMExtractor.getWeekInfo();
  const marketItems = extractMarketItems();
  
  if (!userData.coins || marketItems.length === 0) {
    return;
  }
  
  const currentWeek = weekInfo.currentWeek || 1;
  const weeksRemaining = Math.max(weekInfo.totalWeeks - currentWeek, 0);
  
  const recommendations = generateSmartRecommendations(
    userData.coins, 
    marketItems, 
    weeksRemaining
  );
  
  if (recommendations.length === 0) {
    return;
  }
  
  const widget = DOMInjector.createWidget(
    'Smart Recommendations',
    `
      <div class="space-y-4">
        <div class="text-sm text-gray-700 mb-3">
          Based on your current balance and projected earnings, here are the optimal purchases:
        </div>
        
        ${recommendations.map((rec, index) => `
          <div class="ms-stat-card ${rec.priority === 'high' ? 'border-green-500 bg-green-50' : 
                                      rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' : 
                                      'border-blue-500 bg-blue-50'}">
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <div class="font-bold text-lg ${rec.priority === 'high' ? 'text-green-700' : 
                                                 rec.priority === 'medium' ? 'text-yellow-700' : 
                                                 'text-blue-700'}">${rec.name}</div>
                <div class="text-xs text-gray-600">${rec.category}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-xl">${rec.cost} 🪙</div>
                ${rec.canAfford ? 
                  '<span class="ms-badge ms-badge-success text-xs">Affordable</span>' :
                  `<span class="ms-badge ms-badge-warning text-xs">Week ${rec.affordableWeek}</span>`
                }
              </div>
            </div>
            <div class="text-sm ${rec.priority === 'high' ? 'text-green-600' : 
                                   rec.priority === 'medium' ? 'text-yellow-600' : 
                                   'text-blue-600'}">
              ${rec.reason}
            </div>
          </div>
        `).join('')}
        
        <div class="ms-divider"></div>
        
        <div class="text-center">
          <button id="ms-see-all-paths" class="ms-button-secondary text-sm">
            See Alternative Paths
          </button>
        </div>
      </div>
    `,
    'ms-fade-in'
  );
  
  const targetElement = document.querySelector('main') || document.querySelector('.container');
  if (targetElement) {
    DOMInjector.injectAtTop(targetElement, widget);
  }
  
  const seeAllBtn = document.getElementById('ms-see-all-paths');
  if (seeAllBtn) {
    seeAllBtn.addEventListener('click', () => {
      showAlternativePaths(userData, marketItems, weeksRemaining);
    });
  }
}

function generateSmartRecommendations(currentCoins, items, weeksRemaining) {
  const avgCoinsPerWeek = 50;
  const recommendations = [];
  
  const affordableNow = items.filter(item => item.cost <= currentCoins)
                             .sort((a, b) => a.cost - b.cost);
  
  if (affordableNow.length > 0) {
    const bestValue = affordableNow[Math.floor(affordableNow.length / 2)];
    recommendations.push({
      ...bestValue,
      priority: 'high',
      canAfford: true,
      reason: 'Best value for your current budget. Purchase now to maximize benefits.',
      affordableWeek: 'Now'
    });
  }
  
  const futureItems = items.filter(item => item.cost > currentCoins)
                           .sort((a, b) => a.cost - b.cost)
                           .slice(0, 3);
  
  futureItems.forEach(item => {
    const coinsNeeded = item.cost - currentCoins;
    const weeksToAfford = Math.ceil(coinsNeeded / avgCoinsPerWeek);
    
    if (weeksToAfford <= weeksRemaining) {
      recommendations.push({
        ...item,
        priority: weeksToAfford <= 2 ? 'medium' : 'low',
        canAfford: false,
        reason: `Save for ${weeksToAfford} week${weeksToAfford > 1 ? 's' : ''} to unlock. High impact item.`,
        affordableWeek: weeksToAfford
      });
    }
  });
  
  return recommendations.slice(0, 4);
}

function showOptimizationModal(userData, items, weeksRemaining) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
  
  const weekPlan = generateWeekByWeekPlan(userData.coins, items, weeksRemaining);
  
  modal.innerHTML = `
    <div class="ms-widget max-w-3xl m-4 max-h-screen overflow-y-auto">
      <div class="ms-widget-header flex items-center justify-between">
        <span>Optimized Purchase Plan</span>
        <button id="ms-close-optimization" class="text-parchment hover:text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="ms-widget-content">
        <div class="space-y-3">
          ${weekPlan.map((week, index) => `
            <div class="p-3 ${index === 0 ? 'bg-purple-50' : 'bg-gray-50'} rounded-md">
              <div class="font-bold mb-2">Week ${week.weekNumber}</div>
              <div class="space-y-1">
                ${week.purchases.map(purchase => `
                  <div class="flex justify-between text-sm">
                    <span>${purchase.name}</span>
                    <span class="font-semibold">${purchase.cost} 🪙</span>
                  </div>
                `).join('')}
                <div class="border-t pt-1 mt-1 flex justify-between text-xs text-gray-600">
                  <span>Balance After</span>
                  <span class="font-semibold">${week.balanceAfter} 🪙</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('ms-close-optimization').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function showAlternativePaths(userData, items, weeksRemaining) {
}

function generateWeekByWeekPlan(startingCoins, items, weeksRemaining) {
  const avgCoinsPerWeek = 50;
  const plan = [];
  let currentCoins = startingCoins;
  
  const affordableItems = items.filter(item => item.cost <= startingCoins + (weeksRemaining * avgCoinsPerWeek))
                               .sort((a, b) => a.cost - b.cost);
  
  let itemIndex = 0;
  
  for (let week = 1; week <= Math.min(weeksRemaining, 4); week++) {
    currentCoins += avgCoinsPerWeek;
    const weekPurchases = [];
    
    while (itemIndex < affordableItems.length && affordableItems[itemIndex].cost <= currentCoins) {
      const item = affordableItems[itemIndex];
      weekPurchases.push(item);
      currentCoins -= item.cost;
      itemIndex++;
    }
    
    if (weekPurchases.length > 0 || week === 1) {
      plan.push({
        weekNumber: week,
        purchases: weekPurchases,
        balanceAfter: currentCoins
      });
    }
  }
  
  return plan;
}
