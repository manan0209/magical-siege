export const ACHIEVEMENT_CATEGORIES = {
  MILESTONES: 'milestones',
  DEDICATION: 'dedication',
  EXCELLENCE: 'excellence',
  SOCIAL: 'social',
  SPECIAL: 'special'
};

export const ACHIEVEMENT_RARITIES = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

export const ACHIEVEMENTS = {
  FIRST_BLOOD: {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Submit your first project to the battlefield',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    check: (data) => data.aggregates.totalProjects >= 1
  },

  BATTLE_TESTED: {
    id: 'battle_tested',
    name: 'Battle Tested',
    description: 'Survive 5 weeks of siege warfare',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    check: (data) => data.aggregates.totalProjects >= 5
  },

  VETERAN_DEFENDER: {
    id: 'veteran_defender',
    name: 'Veteran Defender',
    description: 'Complete 10 projects during the siege',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    check: (data) => data.aggregates.totalProjects >= 10
  },

  CENTURION: {
    id: 'centurion',
    name: 'Centurion',
    description: 'Command 100 hours on the battlefield',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    check: (data) => data.aggregates.totalHours >= 100
  },

  SIEGE_MASTER: {
    id: 'siege_master',
    name: 'Siege Master',
    description: 'Accumulate 200 hours of warfare experience',
    category: ACHIEVEMENT_CATEGORIES.MILESTONES,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    check: (data) => data.aggregates.totalHours >= 200
  },

  FOUNDING_WARRIOR: {
    id: 'founding_warrior',
    name: 'Founding Warrior',
    description: 'Join the battle from Week 1',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    check: (data) => data.projects.some(p => p.week === 1)
  },

  SIEGE_SURVIVOR: {
    id: 'siege_survivor',
    name: 'Siege Survivor',
    description: 'Endure all 14 weeks of the great siege',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    check: (data) => data.aggregates.weeksParticipated >= 14
  },

  UNWAVERING: {
    id: 'unwavering',
    name: 'Unwavering',
    description: 'Maintain exceptional consistency throughout the siege',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    check: (data) => data.patterns.consistencyScore >= 80
  },

  ENDURANCE_CHAMPION: {
    id: 'endurance_champion',
    name: 'Endurance Champion',
    description: 'Code for 50+ hours in a single week',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    check: (data) => data.timeline.some(week => week.hours >= 50)
  },

  RAPID_DEPLOYMENT: {
    id: 'rapid_deployment',
    name: 'Rapid Deployment',
    description: 'Complete a quality project in under 10 hours',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    check: (data) => data.projects.some(p => p.hours > 0 && p.hours < 10 && p.status === 'finished')
  },

  MASTER_CRAFTSMAN: {
    id: 'master_craftsman',
    name: 'Master Craftsman',
    description: 'Achieve a perfect 5-star rating on a project',
    category: ACHIEVEMENT_CATEGORIES.EXCELLENCE,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    check: (data) => data.projects.some(p => p.averageScore >= 5)
  },

  RENOWNED_BUILDER: {
    id: 'renowned_builder',
    name: 'Renowned Builder',
    description: 'Maintain an average rating above 4.5 stars',
    category: ACHIEVEMENT_CATEGORIES.EXCELLENCE,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    check: (data) => data.aggregates.avgScore >= 4.5
  },

  TREASURY_KEEPER: {
    id: 'treasury_keeper',
    name: 'Treasury Keeper',
    description: 'Accumulate 1000 coins in your war chest',
    category: ACHIEVEMENT_CATEGORIES.EXCELLENCE,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    check: (data) => data.aggregates.totalCoins >= 1000
  },

  DRAGONS_HOARD: {
    id: 'dragons_hoard',
    name: "Dragon's Hoard",
    description: 'Amass 5000 coins of legendary wealth',
    category: ACHIEVEMENT_CATEGORIES.EXCELLENCE,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    check: (data) => data.aggregates.totalCoins >= 5000
  },

  STRATEGIC_GENIUS: {
    id: 'strategic_genius',
    name: 'Strategic Genius',
    description: 'Achieve exceptional coin efficiency (50+ per hour)',
    category: ACHIEVEMENT_CATEGORIES.EXCELLENCE,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    check: (data) => data.aggregates.efficiency >= 50
  },

  CHAMPION_OF_THE_REALM: {
    id: 'champion_of_the_realm',
    name: 'Champion of the Realm',
    description: 'Ascend to the top 10 on the leaderboard',
    category: ACHIEVEMENT_CATEGORIES.EXCELLENCE,
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    check: (data) => data.rankings.rank > 0 && data.rankings.rank <= 10
  },

  ELITE_WARRIOR: {
    id: 'elite_warrior',
    name: 'Elite Warrior',
    description: 'Break into the top 50 defenders',
    category: ACHIEVEMENT_CATEGORIES.EXCELLENCE,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    check: (data) => data.rankings.rank > 0 && data.rankings.rank <= 50
  },

  PEER_RECOGNIZED: {
    id: 'peer_recognized',
    name: 'Peer Recognized',
    description: 'Earn 10+ reviews from fellow defenders',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    check: (data) => data.voting.totalReviewsReceived >= 10
  },

  CROWD_FAVORITE: {
    id: 'crowd_favorite',
    name: 'Crowd Favorite',
    description: 'Receive 20+ reviews on a single project',
    category: ACHIEVEMENT_CATEGORIES.SOCIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    check: (data) => data.projects.some(p => p.reviewCount >= 20)
  },

  MULTI_FRONT_WARFARE: {
    id: 'multi_front_warfare',
    name: 'Multi-Front Warfare',
    description: 'Deploy 3+ projects in a single week',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    check: (data) => {
      const weekCounts = {};
      data.projects.forEach(p => {
        weekCounts[p.week] = (weekCounts[p.week] || 0) + 1;
      });
      return Object.values(weekCounts).some(count => count >= 3);
    }
  },

  DEEP_FOCUS: {
    id: 'deep_focus',
    name: 'Deep Focus',
    description: 'Invest 20+ hours into a single project',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    check: (data) => data.projects.some(p => p.hours >= 20)
  },

  PHOENIX_RISING: {
    id: 'phoenix_rising',
    name: 'Phoenix Rising',
    description: 'Return to battle after missing 2+ weeks',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.UNCOMMON,
    check: (data) => {
      const weeks = data.projects.map(p => p.week).sort((a, b) => a - b);
      for (let i = 1; i < weeks.length; i++) {
        if (weeks[i] - weeks[i - 1] >= 3) return true;
      }
      return false;
    }
  },

  FLAWLESS_EXECUTION: {
    id: 'flawless_execution',
    name: 'Flawless Execution',
    description: 'Achieve 90%+ project completion rate',
    category: ACHIEVEMENT_CATEGORIES.EXCELLENCE,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    check: (data) => data.aggregates.completionRate >= 90
  },

  LATE_REINFORCEMENT: {
    id: 'late_reinforcement',
    name: 'Late Reinforcement',
    description: 'Join after Week 5 and still complete 5 projects',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    check: (data) => {
      if (data.projects.length === 0) return false;
      const firstWeek = Math.min(...data.projects.map(p => p.week));
      return firstWeek > 5 && data.aggregates.totalProjects >= 5;
    }
  },

  IRON_WILL: {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Maintain 15+ hours per week average',
    category: ACHIEVEMENT_CATEGORIES.DEDICATION,
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    check: (data) => data.aggregates.avgHoursPerWeek >= 15
  },

  ARTISAN: {
    id: 'artisan',
    name: 'Artisan',
    description: 'Achieve 4+ star average with selective projects',
    category: ACHIEVEMENT_CATEGORIES.EXCELLENCE,
    rarity: ACHIEVEMENT_RARITIES.RARE,
    check: (data) => data.aggregates.totalProjects < 5 && data.aggregates.totalProjects > 0 && data.aggregates.avgScore >= 4
  }
};

export function checkAchievements(wrappedData) {
  const unlocked = [];
  
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    try {
      if (achievement.check(wrappedData)) {
        unlocked.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          rarity: achievement.rarity,
          icon: achievement.icon,
          unlockedAt: Date.now()
        });
      }
    } catch (error) {
      console.error(`Error checking achievement ${achievement.id}:`, error);
    }
  });

  return unlocked;
}

export function getAchievementProgress(wrappedData) {
  const progress = {};

  progress.first_steps = Math.min(wrappedData.aggregates.totalProjects, 1);
  progress.five_strong = Math.min(wrappedData.aggregates.totalProjects / 5, 1);
  progress.perfect_ten = Math.min(wrappedData.aggregates.totalProjects / 10, 1);
  progress.century = Math.min(wrappedData.aggregates.totalHours / 100, 1);
  progress.double_century = Math.min(wrappedData.aggregates.totalHours / 200, 1);
  progress.survivor = Math.min(wrappedData.aggregates.weeksParticipated / 14, 1);
  progress.consistent = Math.min(wrappedData.patterns.consistencyScore / 80, 1);
  progress.coin_collector = Math.min(wrappedData.aggregates.totalCoins / 1000, 1);
  progress.treasure_hoarder = Math.min(wrappedData.aggregates.totalCoins / 5000, 1);
  progress.efficient = Math.min(wrappedData.aggregates.efficiency / 50, 1);
  progress.highly_rated = Math.min(wrappedData.aggregates.avgScore / 4.5, 1);
  progress.completion_master = Math.min(wrappedData.aggregates.completionRate / 90, 1);
  progress.power_user = Math.min(wrappedData.aggregates.avgHoursPerWeek / 15, 1);

  return progress;
}

export function getAchievementsByCategory(achievements) {
  const byCategory = {};
  
  Object.values(ACHIEVEMENT_CATEGORIES).forEach(category => {
    byCategory[category] = [];
  });

  achievements.forEach(achievement => {
    if (byCategory[achievement.category]) {
      byCategory[achievement.category].push(achievement);
    }
  });

  return byCategory;
}

export function getAchievementsByRarity(achievements) {
  const byRarity = {};
  
  Object.values(ACHIEVEMENT_RARITIES).forEach(rarity => {
    byRarity[rarity] = [];
  });

  achievements.forEach(achievement => {
    if (byRarity[achievement.rarity]) {
      byRarity[achievement.rarity].push(achievement);
    }
  });

  return byRarity;
}

export function getAchievementStats(achievements) {
  const total = Object.keys(ACHIEVEMENTS).length;
  const unlocked = achievements.length;
  const percentage = (unlocked / total) * 100;

  const byRarity = getAchievementsByRarity(achievements);
  const rarityCount = {};
  Object.keys(byRarity).forEach(rarity => {
    rarityCount[rarity] = byRarity[rarity].length;
  });

  return {
    total,
    unlocked,
    locked: total - unlocked,
    percentage: parseFloat(percentage.toFixed(1)),
    byRarity: rarityCount
  };
}
