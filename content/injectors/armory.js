import { DOMExtractor } from '../utils/dom-extractor.js';
import { DOMInjector } from '../utils/dom-injector.js';

export function injectArmoryEnhancements() {
  console.log('Armory upgraded, my liege!');
  
  injectTechTreeVisualization();
  injectUpgradeRecommendations();
}

function injectTechTreeVisualization() {
  const techTree = extractTechTreeData();
  
  if (!techTree || techTree.length === 0) {
    return;
  }
  
  const unlockedCount = techTree.filter(tech => tech.unlocked).length;
  const totalCount = techTree.length;
  const progressPercent = ((unlockedCount / totalCount) * 100).toFixed(0);
  
  const categories = {};
  techTree.forEach(tech => {
    if (!categories[tech.category]) {
      categories[tech.category] = {
        name: tech.category,
        items: [],
        unlocked: 0,
        total: 0
      };
    }
    categories[tech.category].items.push(tech);
    categories[tech.category].total++;
    if (tech.unlocked) {
      categories[tech.category].unlocked++;
    }
  });
  
  const categoriesHtml = Object.values(categories).map(category => {
    const categoryPercent = ((category.unlocked / category.total) * 100).toFixed(0);
    const statusClass = category.unlocked === category.total ? 'bg-green-100 border-green-600' :
                       category.unlocked > 0 ? 'bg-yellow-100 border-yellow-600' :
                       'bg-gray-100 border-gray-400';
    
    return `
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-lg text-castle-brown">${category.name}</h3>
          <span class="text-sm font-semibold text-purple-primary">${category.unlocked}/${category.total}</span>
        </div>
        <div class="ms-progress-bar mb-3">
          <div class="ms-progress-fill" style="width: ${categoryPercent}%"></div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          ${category.items.map(tech => `
            <div class="p-3 rounded-md border-2 ${tech.unlocked ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300 opacity-60'}">
              <div class="flex items-center justify-between mb-1">
                <span class="font-semibold text-sm ${tech.unlocked ? 'text-green-700' : 'text-gray-600'}">${tech.name}</span>
                ${tech.unlocked ? '<span class="text-green-600">✓</span>' : '<span class="text-gray-400">🔒</span>'}
              </div>
              ${tech.cost ? `<div class="text-xs text-gray-600">${tech.cost} coins</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
  
  const widget = DOMInjector.createWidget(
    'Tech Tree Overview',
    `
      <div class="space-y-4">
        <div class="ms-stat-card bg-purple-50">
          <div class="flex items-center justify-between">
            <div>
              <div class="ms-stat-label">Overall Progress</div>
              <div class="ms-stat-value">${unlockedCount} / ${totalCount}</div>
            </div>
            <div class="text-right">
              <div class="text-3xl font-bold text-purple-primary">${progressPercent}%</div>
              <div class="text-xs text-gray-600">Complete</div>
            </div>
          </div>
        </div>
        
        <div class="ms-divider"></div>
        
        ${categoriesHtml}
      </div>
    `,
    'ms-fade-in'
  );
  
  const targetElement = document.querySelector('main') || document.querySelector('.container');
  if (targetElement) {
    DOMInjector.injectAtTop(targetElement, widget);
  }
}

function extractTechTreeData() {
  const techItems = [];
  
  const techElements = document.querySelectorAll('[data-tech], .tech-item, .upgrade-item');
  
  techElements.forEach(element => {
    const nameEl = element.querySelector('.tech-name, .upgrade-name, h3, h4');
    const costEl = element.querySelector('.cost, .price');
    const isUnlocked = element.classList.contains('unlocked') || 
                      element.classList.contains('purchased') ||
                      element.querySelector('.unlocked, .purchased');
    
    const categoryEl = element.closest('[data-category]') || 
                      element.querySelector('[data-category]');
    const category = categoryEl ? 
                    (categoryEl.dataset.category || categoryEl.textContent.trim()) :
                    'General';
    
    if (nameEl) {
      techItems.push({
        name: nameEl.textContent.trim(),
        cost: costEl ? parseInt(costEl.textContent.match(/\d+/)?.[0]) : null,
        unlocked: isUnlocked,
        category: category,
        element: element
      });
    }
  });
  
  return techItems;
}

function injectUpgradeRecommendations() {
  const userData = DOMExtractor.getUserData();
  const techTree = extractTechTreeData();
  
  if (!userData.coins || !techTree || techTree.length === 0) {
    return;
  }
  
  const availableUpgrades = techTree.filter(tech => 
    !tech.unlocked && tech.cost && tech.cost <= userData.coins
  ).sort((a, b) => a.cost - b.cost);
  
  const recommendedUpgrades = availableUpgrades.slice(0, 5);
  
  const futureUpgrades = techTree.filter(tech => 
    !tech.unlocked && tech.cost && tech.cost > userData.coins
  ).sort((a, b) => a.cost - b.cost).slice(0, 3);
  
  if (recommendedUpgrades.length === 0 && futureUpgrades.length === 0) {
    return;
  }
  
  const widget = DOMInjector.createWidget(
    'Upgrade Recommendations',
    `
      <div class="space-y-4">
        ${recommendedUpgrades.length > 0 ? `
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-green-700">Available Now</h3>
              <span class="ms-badge ms-badge-success">${recommendedUpgrades.length} Ready</span>
            </div>
            <div class="space-y-2">
              ${recommendedUpgrades.map(tech => {
                const coinsAfter = userData.coins - tech.cost;
                const affordability = ((tech.cost / userData.coins) * 100).toFixed(0);
                
                return `
                  <div class="p-3 bg-green-50 border-2 border-green-500 rounded-md hover:bg-green-100 transition-colors cursor-pointer">
                    <div class="flex items-center justify-between">
                      <div class="flex-1">
                        <div class="font-semibold text-green-800">${tech.name}</div>
                        <div class="text-xs text-green-600">${tech.category}</div>
                      </div>
                      <div class="text-right">
                        <div class="font-bold text-green-700">${tech.cost} 🪙</div>
                        <div class="text-xs text-gray-600">${coinsAfter} left</div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
        
        ${futureUpgrades.length > 0 ? `
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-blue-700">Coming Soon</h3>
              <span class="ms-badge ms-badge-info">Save Up</span>
            </div>
            <div class="space-y-2">
              ${futureUpgrades.map(tech => {
                const coinsNeeded = tech.cost - userData.coins;
                const progressPercent = ((userData.coins / tech.cost) * 100).toFixed(0);
                
                return `
                  <div class="p-3 bg-blue-50 border-2 border-blue-400 rounded-md">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex-1">
                        <div class="font-semibold text-blue-800">${tech.name}</div>
                        <div class="text-xs text-blue-600">${tech.category}</div>
                      </div>
                      <div class="text-right">
                        <div class="font-bold text-blue-700">${tech.cost} 🪙</div>
                        <div class="text-xs text-red-600">Need ${coinsNeeded} more</div>
                      </div>
                    </div>
                    <div class="w-full h-1.5 bg-blue-200 rounded-full">
                      <div class="h-full bg-blue-500 rounded-full" style="width: ${progressPercent}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
        
        ${recommendedUpgrades.length === 0 && futureUpgrades.length === 0 ? `
          <div class="text-center py-8 text-gray-600">
            <div class="text-4xl mb-2">🎉</div>
            <div class="font-semibold">All upgrades unlocked!</div>
            <div class="text-sm">You are a true master of the Armory</div>
          </div>
        ` : ''}
      </div>
    `,
    'ms-fade-in'
  );
  
  //well leavin a comment here to say hello, to anyone cheking this out
  //hope you have a great day!

  const techTreeWidget = document.querySelector('.ms-widget');
  if (techTreeWidget) {
    DOMInjector.injectAfter(techTreeWidget, widget);
  }
}
