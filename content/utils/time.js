export const TimeUtils = {
  getNextMondayMidnight() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(23, 59, 59, 999);
    
    return nextMonday;
  },

  getTimeRemaining(targetDate) {
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        total: 0
      };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      total: diff
    };
  },

  formatTimeRemaining(timeObj) {
    const parts = [];
    
    if (timeObj.days > 0) {
      parts.push(`${timeObj.days} day${timeObj.days !== 1 ? 's' : ''}`);
    }
    if (timeObj.hours > 0 || timeObj.days > 0) {
      parts.push(`${timeObj.hours} hour${timeObj.hours !== 1 ? 's' : ''}`);
    }
    if (timeObj.minutes > 0 || timeObj.hours > 0 || timeObj.days > 0) {
      parts.push(`${timeObj.minutes} minute${timeObj.minutes !== 1 ? 's' : ''}`);
    }
    parts.push(`${timeObj.seconds} second${timeObj.seconds !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
  },

  isVotingDay() {
    const now = new Date();
    const day = now.getDay();
    return day >= 1 && day <= 3;
  },

  getVotingPeriodEnd() {
    const now = new Date();
    const day = now.getDay();
    
    if (day > 3) {
      const daysUntilMonday = 8 - day;
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(23, 59, 59, 999);
      return nextMonday;
    }
    
    const wednesday = new Date(now);
    const daysUntilWednesday = 3 - day;
    wednesday.setDate(now.getDate() + daysUntilWednesday);
    wednesday.setHours(23, 59, 59, 999);
    return wednesday;
  }
};
