import { Storage } from './storage.js';

export const Analytics = {
  async trackEvent(category, action, label = null, value = null) {
    const event = {
      category,
      action,
      label,
      value,
      timestamp: Date.now()
    };
    
    const events = await Storage.get('analytics_events') || [];
    events.push(event);
    
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }
    
    await Storage.set('analytics_events', events);
  },

  async getEvents(category = null) {
    const events = await Storage.get('analytics_events') || [];
    
    if (category) {
      return events.filter(e => e.category === category);
    }
    
    return events;
  },

  async getStats() {
    const events = await this.getEvents();
    
    const stats = {
      totalEvents: events.length,
      byCategory: {},
      byAction: {},
      recent: events.slice(-10)
    };
    
    events.forEach(event => {
      stats.byCategory[event.category] = (stats.byCategory[event.category] || 0) + 1;
      stats.byAction[event.action] = (stats.byAction[event.action] || 0) + 1;
    });
    
    return stats;
  }
};
