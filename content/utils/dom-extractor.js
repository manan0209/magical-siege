export const DOMExtractor = {
  getUserData() {
    const data = {
      name: null,
      coins: null,
      rank: null,
      slackId: null
    };

    const nameElement = document.querySelector('[data-user-name]') || 
                       document.querySelector('.user-name');
    if (nameElement) {
      data.name = nameElement.textContent.trim();
    }

    const coinsText = document.body.textContent;
    const coinsMatch = coinsText.match(/(\d+)\s*coins?/i);
    if (coinsMatch) {
      data.coins = parseInt(coinsMatch[1]);
    }

    const rankMatch = coinsText.match(/rank[:\s]*#?(\d+)/i);
    if (rankMatch) {
      data.rank = parseInt(rankMatch[1]);
    }

    return data;
  },

  getWeekInfo() {
    const weekText = document.body.textContent;
    const weekMatch = weekText.match(/week\s+(\d+)/i);
    
    return {
      currentWeek: weekMatch ? parseInt(weekMatch[1]) : null,
      totalWeeks: 10
    };
  },

  getProgressData() {
    const progressText = document.body.textContent;
    const hoursMatch = progressText.match(/(\d+\.?\d*)\s*h/i);
    
    return {
      hoursThisWeek: hoursMatch ? parseFloat(hoursMatch[1]) : 0,
      goalHours: 10
    };
  },

  getProjectData() {
    const projects = [];
    const projectElements = document.querySelectorAll('[data-project], .project-card, .project-item');
    
    projectElements.forEach(element => {
      const nameEl = element.querySelector('.project-name, h3, h2');
      const statusEl = element.querySelector('.status, .project-status');
      
      if (nameEl) {
        projects.push({
          name: nameEl.textContent.trim(),
          status: statusEl ? statusEl.textContent.trim() : 'unknown',
          element: element
        });
      }
    });

    return projects;
  },

  getLeaderboardData() {
    const leaderboard = [];
    const leaderboardItems = document.querySelectorAll('.leaderboard-item, [data-leaderboard-entry]');
    
    leaderboardItems.forEach((item, index) => {
      const nameEl = item.querySelector('.name, .user-name');
      const coinsEl = item.querySelector('.coins, .coin-count');
      
      if (nameEl) {
        leaderboard.push({
          rank: index + 1,
          name: nameEl.textContent.trim(),
          coins: coinsEl ? parseInt(coinsEl.textContent.match(/\d+/)?.[0]) : null
        });
      }
    });

    return leaderboard;
  },

  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  },

  observeChanges(selector, callback) {
    const element = document.querySelector(selector);
    if (!element) return null;

    const observer = new MutationObserver((mutations) => {
      callback(mutations);
    });

    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return observer;
  }
};
