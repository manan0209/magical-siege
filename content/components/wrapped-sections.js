import { SIEGE_COLORS } from '../utils/siege-theme.js';
import { ACHIEVEMENT_RARITIES } from '../utils/achievements.js';

export function renderHeroSection(data) {
  const percentile = data.rankings.percentile || 0;
  const rank = data.rankings.rank || 'Unranked';
  
  return `
    <div class="siege-wrapped-section siege-wrapped-hero">
      <div class="siege-wrapped-hero-content">
        <h1 class="siege-wrapped-hero-title">Your Siege Journey</h1>
        <p class="siege-wrapped-hero-subtitle">A Chronicle of ${data.aggregates.weeksParticipated} Weeks in Battle</p>
        
        <div class="siege-wrapped-hero-stats">
          <div class="siege-wrapped-hero-stat">
            <span class="siege-wrapped-hero-stat-value">${data.aggregates.totalProjects}</span>
            <span class="siege-wrapped-hero-stat-label">Projects Forged</span>
          </div>
          <div class="siege-wrapped-hero-stat">
            <span class="siege-wrapped-hero-stat-value">${data.aggregates.totalHours}</span>
            <span class="siege-wrapped-hero-stat-label">Hours in Battle</span>
          </div>
          <div class="siege-wrapped-hero-stat">
            <span class="siege-wrapped-hero-stat-value">${data.aggregates.totalCoins}</span>
            <span class="siege-wrapped-hero-stat-label">Coins Earned</span>
          </div>
        </div>

        <div class="siege-wrapped-hero-rank">
          <div class="siege-wrapped-rank-badge">
            <span class="siege-wrapped-rank-number">#${rank}</span>
            <span class="siege-wrapped-rank-label">Leaderboard Rank</span>
          </div>
          <p class="siege-wrapped-rank-percentile">
            Top ${percentile.toFixed(1)}% of all defenders
          </p>
        </div>
      </div>
    </div>
  `;
}

export function renderStatsOverview(data) {
  const efficiency = data.aggregates.efficiency || 0;
  const avgScore = data.aggregates.avgScore || 0;
  const completionRate = data.aggregates.completionRate || 0;
  const consistency = data.patterns.consistencyScore || 0;

  return `
    <div class="siege-wrapped-section siege-wrapped-stats">
      <h2 class="siege-wrapped-section-title">Battle Statistics</h2>
      <p class="siege-wrapped-section-subtitle">Your performance across the siege</p>

      <div class="siege-wrapped-stats-grid">
        <div class="siege-wrapped-stat-card">
          <div class="siege-wrapped-stat-icon">⚔️</div>
          <div class="siege-wrapped-stat-value">${data.aggregates.avgHoursPerWeek.toFixed(1)}</div>
          <div class="siege-wrapped-stat-label">Avg Hours/Week</div>
        </div>

        <div class="siege-wrapped-stat-card">
          <div class="siege-wrapped-stat-value">${efficiency.toFixed(1)}</div>
          <div class="siege-wrapped-stat-label">Coins/Hour</div>
        </div>

        <div class="siege-wrapped-stat-card">
          <div class="siege-wrapped-stat-value">${avgScore.toFixed(2)}</div>
          <div class="siege-wrapped-stat-label">Avg Rating</div>
        </div>

        <div class="siege-wrapped-stat-card">
          <div class="siege-wrapped-stat-icon">✓</div>
          <div class="siege-wrapped-stat-value">${completionRate.toFixed(0)}%</div>
          <div class="siege-wrapped-stat-label">Completion Rate</div>
        </div>

        <div class="siege-wrapped-stat-card">
          <div class="siege-wrapped-stat-value">${consistency.toFixed(0)}%</div>
          <div class="siege-wrapped-stat-label">Consistency</div>
        </div>

        <div class="siege-wrapped-stat-card">
          <div class="siege-wrapped-stat-value">${data.voting.totalReviewsReceived}</div>
          <div class="siege-wrapped-stat-label">Reviews Received</div>
        </div>
      </div>
    </div>
  `;
}

export function renderTimelineSection(data) {
  if (!data.timeline || data.timeline.length === 0) {
    return `
      <div class="siege-wrapped-section">
        <h2 class="siege-wrapped-section-title">Weekly Timeline</h2>
        <p class="siege-wrapped-empty-state">No timeline data available</p>
      </div>
    `;
  }

  const maxHours = Math.max(...data.timeline.map(w => w.hours), 1);
  const maxCoins = Math.max(...data.timeline.map(w => w.coins), 1);

  const timelineHTML = data.timeline.map(week => {
    const hoursPercent = (week.hours / maxHours) * 100;
    const coinsPercent = (week.coins / maxCoins) * 100;

    return `
      <div class="siege-wrapped-timeline-item">
        <div class="siege-wrapped-timeline-week">Week ${week.week}</div>
        <div class="siege-wrapped-timeline-bars">
          <div class="siege-wrapped-timeline-bar-row">
            <span class="siege-wrapped-timeline-bar-label">Hours</span>
            <div class="siege-wrapped-timeline-bar">
              <div class="siege-wrapped-timeline-bar-fill" style="width: ${hoursPercent}%; background: ${SIEGE_COLORS.accentBlue};"></div>
            </div>
            <span class="siege-wrapped-timeline-bar-value">${week.hours}h</span>
          </div>
          <div class="siege-wrapped-timeline-bar-row">
            <span class="siege-wrapped-timeline-bar-label">Coins</span>
            <div class="siege-wrapped-timeline-bar">
              <div class="siege-wrapped-timeline-bar-fill" style="width: ${coinsPercent}%; background: ${SIEGE_COLORS.accentGold};"></div>
            </div>
            <span class="siege-wrapped-timeline-bar-value">${week.coins}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="siege-wrapped-section siege-wrapped-timeline">
      <h2 class="siege-wrapped-section-title">Your Journey Through Time</h2>
      <p class="siege-wrapped-section-subtitle">Week-by-week progress</p>
      
      <div class="siege-wrapped-timeline-container">
        ${timelineHTML}
      </div>
    </div>
  `;
}

export function renderBestProjectsSection(data) {
  const { bestProject, highestCoinProject, highestRatedProject } = data.aggregates;

  if (!bestProject && !highestCoinProject && !highestRatedProject) {
    return `
      <div class="siege-wrapped-section">
        <h2 class="siege-wrapped-section-title">Notable Projects</h2>
        <p class="siege-wrapped-empty-state">No projects to highlight yet</p>
      </div>
    `;
  }

  return `
    <div class="siege-wrapped-section siege-wrapped-highlights">
      <h2 class="siege-wrapped-section-title">Your Greatest Achievements</h2>
      <p class="siege-wrapped-section-subtitle">Projects that stood out</p>

      <div class="siege-wrapped-highlights-grid">
        ${highestRatedProject ? `
          <div class="siege-wrapped-highlight-card">
            <h3 class="siege-wrapped-highlight-title">Most Acclaimed</h3>
            <p class="siege-wrapped-highlight-project">${highestRatedProject.name}</p>
            <p class="siege-wrapped-highlight-stat">${highestRatedProject.score.toFixed(2)} stars</p>
            <p class="siege-wrapped-highlight-week">Week ${highestRatedProject.week}</p>
          </div>
        ` : ''}

        ${highestCoinProject ? `
          <div class="siege-wrapped-highlight-card">
            <h3 class="siege-wrapped-highlight-title">Most Rewarding</h3>
            <p class="siege-wrapped-highlight-project">${highestCoinProject.name}</p>
            <p class="siege-wrapped-highlight-stat">${highestCoinProject.coins} coins</p>
            <p class="siege-wrapped-highlight-week">Week ${highestCoinProject.week}</p>
          </div>
        ` : ''}

        ${bestProject ? `
          <div class="siege-wrapped-highlight-card">
            <h3 class="siege-wrapped-highlight-title">Overall Champion</h3>
            <p class="siege-wrapped-highlight-project">${bestProject.name}</p>
            <p class="siege-wrapped-highlight-stat">Best balanced project</p>
            <p class="siege-wrapped-highlight-week">Week ${bestProject.week}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

export function renderAchievementsSection(data) {
  if (!data.achievements || data.achievements.length === 0) {
    return `
      <div class="siege-wrapped-section">
        <h2 class="siege-wrapped-section-title">Achievements</h2>
        <p class="siege-wrapped-empty-state">No achievements unlocked yet</p>
      </div>
    `;
  }

  const rarityOrder = [
    ACHIEVEMENT_RARITIES.LEGENDARY,
    ACHIEVEMENT_RARITIES.EPIC,
    ACHIEVEMENT_RARITIES.RARE,
    ACHIEVEMENT_RARITIES.UNCOMMON,
    ACHIEVEMENT_RARITIES.COMMON
  ];

  const sortedAchievements = [...data.achievements].sort((a, b) => {
    return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
  });

  const achievementsHTML = sortedAchievements.map(achievement => {
    const rarityClass = `siege-wrapped-badge-${achievement.rarity}`;
    
    return `
      <div class="siege-wrapped-achievement-card ${rarityClass}">
        <div class="siege-wrapped-achievement-header">
          <span class="siege-wrapped-achievement-rarity">${achievement.rarity}</span>
        </div>
        <h3 class="siege-wrapped-achievement-name">${achievement.name}</h3>
        <p class="siege-wrapped-achievement-desc">${achievement.description}</p>
      </div>
    `;
  }).join('');

  const stats = data.achievementStats || {
    unlocked: data.achievements.length,
    total: 27,
    percentage: 0
  };

  return `
    <div class="siege-wrapped-section siege-wrapped-achievements">
      <h2 class="siege-wrapped-section-title">Achievements Unlocked</h2>
      <p class="siege-wrapped-section-subtitle">${stats.unlocked} of ${stats.total} achievements (${stats.percentage.toFixed(0)}%)</p>

      <div class="siege-wrapped-achievements-grid">
        ${achievementsHTML}
      </div>
    </div>
  `;
}

export function renderFinalSection(data) {
  const totalParticipants = data.rankings.totalParticipants || 0;
  const weeksLeft = Math.max(0, 14 - data.aggregates.weeksParticipated);

  return `
    <div class="siege-wrapped-section siege-wrapped-final">
      <h1 class="siege-wrapped-final-title">Your Siege Legacy</h1>
      
      <div class="siege-wrapped-final-summary">
        <p class="siege-wrapped-final-text">
          You've spent <strong>${data.aggregates.totalHours} hours</strong> crafting 
          <strong>${data.aggregates.totalProjects} projects</strong> and earned 
          <strong>${data.aggregates.totalCoins} coins</strong> in the great siege.
        </p>
        
        ${data.rankings.rank > 0 ? `
          <p class="siege-wrapped-final-text">
            You stand at <strong>rank #${data.rankings.rank}</strong> among 
            <strong>${totalParticipants} defenders</strong>, placing you in the 
            <strong>top ${data.rankings.percentile.toFixed(1)}%</strong>.
          </p>
        ` : ''}

        ${weeksLeft > 0 ? `
          <p class="siege-wrapped-final-text">
            With <strong>${weeksLeft} weeks remaining</strong>, your legend continues to grow.
          </p>
        ` : `
          <p class="siege-wrapped-final-text">
            You've completed the full siege. Your name will be remembered in the annals of history.
          </p>
        `}
      </div>

      <div class="siege-wrapped-final-cta">
        <p class="siege-wrapped-final-thanks">
          Thank you for being part of the Siege.
        </p>
      </div>
    </div>
  `;
}

export const WRAPPED_SECTIONS = {
  HERO: renderHeroSection,
  STATS: renderStatsOverview,
  TIMELINE: renderTimelineSection,
  PROJECTS: renderBestProjectsSection,
  ACHIEVEMENTS: renderAchievementsSection,
  FINAL: renderFinalSection
};
