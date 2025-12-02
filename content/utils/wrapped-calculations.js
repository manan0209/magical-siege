export function sum(numbers) {
  if (!Array.isArray(numbers)) return 0;
  return numbers.reduce((acc, num) => acc + (num || 0), 0);
}

export function average(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
  if (validNumbers.length === 0) return 0;
  return sum(validNumbers) / validNumbers.length;
}

export function max(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
  if (validNumbers.length === 0) return 0;
  return Math.max(...validNumbers);
}

export function min(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
  if (validNumbers.length === 0) return 0;
  return Math.min(...validNumbers);
}

export function median(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;
  const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
  if (validNumbers.length === 0) return 0;
  
  const sorted = [...validNumbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

export function calculateAggregates(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return {
      totalProjects: 0,
      totalHours: 0,
      totalCoins: 0,
      avgScore: 0,
      weeksParticipated: 0,
      completionRate: 0,
      avgHoursPerWeek: 0,
      avgCoinsPerWeek: 0,
      avgHoursPerProject: 0,
      avgCoinsPerProject: 0,
      efficiency: 0,
      bestProject: null,
      highestCoinProject: null,
      highestRatedProject: null
    };
  }

  const totalProjects = projects.length;
  const hours = projects.map(p => p.hours || 0);
  const coins = projects.map(p => parseFloat(p.coin_value) || 0);
  const scores = projects.filter(p => p.average_score).map(p => p.average_score);
  const weeks = new Set(projects.map(p => p.week || 0));
  const finishedProjects = projects.filter(p => p.status === 'finished');

  const totalHours = sum(hours);
  const totalCoins = sum(coins);
  const avgScore = average(scores);
  const weeksParticipated = weeks.size;
  const completionRate = totalProjects > 0 ? (finishedProjects.length / totalProjects) * 100 : 0;

  const avgHoursPerWeek = weeksParticipated > 0 ? totalHours / weeksParticipated : 0;
  const avgCoinsPerWeek = weeksParticipated > 0 ? totalCoins / weeksParticipated : 0;
  const avgHoursPerProject = totalProjects > 0 ? totalHours / totalProjects : 0;
  const avgCoinsPerProject = totalProjects > 0 ? totalCoins / totalProjects : 0;
  const efficiency = totalHours > 0 ? totalCoins / totalHours : 0;

  const bestProject = findBestProject(projects);
  const highestCoinProject = findHighestCoinProject(projects);
  const highestRatedProject = findHighestRatedProject(projects);

  return {
    totalProjects,
    totalHours: parseFloat(totalHours.toFixed(1)),
    totalCoins: Math.round(totalCoins),
    avgScore: parseFloat(avgScore.toFixed(2)),
    weeksParticipated,
    completionRate: parseFloat(completionRate.toFixed(1)),
    avgHoursPerWeek: parseFloat(avgHoursPerWeek.toFixed(1)),
    avgCoinsPerWeek: parseFloat(avgCoinsPerWeek.toFixed(1)),
    avgHoursPerProject: parseFloat(avgHoursPerProject.toFixed(1)),
    avgCoinsPerProject: parseFloat(avgCoinsPerProject.toFixed(1)),
    efficiency: parseFloat(efficiency.toFixed(2)),
    bestProject,
    highestCoinProject,
    highestRatedProject
  };
}

function findBestProject(projects) {
  if (!projects || projects.length === 0) return null;
  
  const scored = projects.map(p => ({
    ...p,
    score: (p.hours || 0) * (p.average_score || 0) + (parseFloat(p.coin_value) || 0) * 0.1
  }));
  
  const best = scored.reduce((prev, current) => 
    current.score > prev.score ? current : prev
  );
  
  return {
    id: best.id,
    name: best.name,
    week: best.week
  };
}

function findHighestCoinProject(projects) {
  if (!projects || projects.length === 0) return null;
  
  const withCoins = projects.filter(p => parseFloat(p.coin_value) > 0);
  if (withCoins.length === 0) return null;
  
  const highest = withCoins.reduce((prev, current) => 
    parseFloat(current.coin_value) > parseFloat(prev.coin_value) ? current : prev
  );
  
  return {
    id: highest.id,
    name: highest.name,
    week: highest.week,
    coins: parseFloat(highest.coin_value)
  };
}

function findHighestRatedProject(projects) {
  if (!projects || projects.length === 0) return null;
  
  const withScores = projects.filter(p => p.average_score);
  if (withScores.length === 0) return null;
  
  const highest = withScores.reduce((prev, current) => 
    current.average_score > prev.average_score ? current : prev
  );
  
  return {
    id: highest.id,
    name: highest.name,
    week: highest.week,
    score: highest.average_score
  };
}

export function buildWeeklyTimeline(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return [];
  }

  const weekMap = new Map();
  
  projects.forEach(project => {
    const week = project.week || 0;
    if (!weekMap.has(week)) {
      weekMap.set(week, {
        week,
        hours: 0,
        coins: 0,
        projects: 0,
        avgScore: 0,
        scores: []
      });
    }
    
    const weekData = weekMap.get(week);
    weekData.hours += project.hours || 0;
    weekData.coins += parseFloat(project.coin_value) || 0;
    weekData.projects += 1;
    if (project.average_score) {
      weekData.scores.push(project.average_score);
    }
  });

  const timeline = Array.from(weekMap.values()).map(week => ({
    week: week.week,
    hours: parseFloat(week.hours.toFixed(1)),
    coins: Math.round(week.coins),
    projects: week.projects,
    avgScore: week.scores.length > 0 ? parseFloat(average(week.scores).toFixed(2)) : 0
  }));

  return timeline.sort((a, b) => a.week - b.week);
}

export function calculateEfficiency(hours, coins) {
  if (!hours || hours === 0) return 0;
  return parseFloat((coins / hours).toFixed(2));
}

export function calculatePercentile(rank, totalParticipants) {
  if (!rank || !totalParticipants || totalParticipants === 0) return 0;
  return parseFloat((((totalParticipants - rank + 1) / totalParticipants) * 100).toFixed(1));
}

export function calculateConsistencyScore(projects) {
  if (!Array.isArray(projects) || projects.length === 0) return 0;

  const weeks = projects.map(p => p.week || 0).sort((a, b) => a - b);
  if (weeks.length === 0) return 0;

  const minWeek = weeks[0];
  const maxWeek = weeks[weeks.length - 1];
  const expectedWeeks = maxWeek - minWeek + 1;
  
  const uniqueWeeks = new Set(weeks).size;
  const weekCoverage = expectedWeeks > 0 ? uniqueWeeks / expectedWeeks : 0;

  const hours = projects.map(p => p.hours || 0);
  const avgHours = average(hours);
  const variance = hours.reduce((sum, h) => sum + Math.pow(h - avgHours, 2), 0) / hours.length;
  const stdDev = Math.sqrt(variance);
  const hourConsistency = avgHours > 0 ? 1 - Math.min(stdDev / avgHours, 1) : 0;

  const consistencyScore = (weekCoverage * 0.7 + hourConsistency * 0.3) * 100;
  
  return parseFloat(consistencyScore.toFixed(1));
}

export function predictCoins(hours, weekNumber = 1) {
  const REVIEWER_BONUS_MULTIPLIER = 2;
  const STARS_MULTIPLIER = 3;
  const TOTAL_MULTIPLIER = REVIEWER_BONUS_MULTIPLIER + STARS_MULTIPLIER;
  
  let baseCoins = 0;
  const minHours = weekNumber === 5 ? 9 : 10;
  
  if (hours < minHours) {
    return 0;
  }
  
  if (hours <= minHours) {
    baseCoins = 5;
  } else {
    const extraHours = hours - minHours;
    baseCoins = 5 + (extraHours * 2);
  }
  
  return Math.round(baseCoins * TOTAL_MULTIPLIER);
}
