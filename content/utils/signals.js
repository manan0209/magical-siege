const BACKEND_URL = 'https://magical-siege-backend.siegelb.workers.dev'


//poke signal, I'm gonna poke you as welll :lol
const SIGNAL_TYPES = {
  POKE: { 
    id: 'poke', 
    label: 'Poke', 
    description: 'Poked you :hehe !',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'
  },
  WAKEUP: { 
    id: 'wakeup', 
    label: 'Wake Up', 
    description: 'Wake up and code!',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
  },
  CELEBRATE: { 
    id: 'Whoa', 
    label: 'Whoa', 
    description: 'You are ducking rich!',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>'
  },
  SLOWDOWN: { 
    id: 'SlowDown', 
    label: 'Coffee', 
    description: 'Take a break man, leave some coins for me too!',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>'
  }
}

const DAILY_LIMIT = 5

function getDailySentCount() {
  const key = 'ms-signals-sent-today'
  const data = localStorage.getItem(key)
  
  if (!data) {
    return 0
  }
  
  const { count, date } = JSON.parse(data)
  const today = new Date().toDateString()
  
  if (date !== today) {
    localStorage.setItem(key, JSON.stringify({ count: 0, date: today }))
    return 0
  }
  
  return count
}

function incrementDailySentCount() {
  const key = 'ms-signals-sent-today'
  const today = new Date().toDateString()
  const current = getDailySentCount()
  
  localStorage.setItem(key, JSON.stringify({ 
    count: current + 1, 
    date: today 
  }))
}

function canSendMoreSignals() {
  return getDailySentCount() < DAILY_LIMIT
}

async function sendSignal(from, to, type) {
  if (!canSendMoreSignals()) {
    throw new Error(`Daily limit reached (${DAILY_LIMIT} signals/day)`)
  }
  
  if (from === to) {
    throw new Error('Cannot signal yourself')
  }
  
  if (!SIGNAL_TYPES[type.toUpperCase()]) {
    throw new Error('Invalid signal type')
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: JSON.stringify({
        from,
        to,
        type: type.toLowerCase()
      })
    })
    
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || 'Failed to send signal')
    }
    
    incrementDailySentCount()
    return true
  } catch (error) {
    console.warn('Failed to send signal:', error.message)
    throw error
  }
}

async function getSignals(username) {
  try {
    const response = await fetch(`${BACKEND_URL}/signals/${username}`, {
      method: 'GET',
      mode: 'cors'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch signals')
    }
    
    return await response.json()
  } catch (error) {
    console.warn('Failed to fetch signals:', error.message)
    return []
  }
}

async function markSignalsAsRead(signalIds) {
  try {
    const response = await fetch(`${BACKEND_URL}/signal/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: JSON.stringify({ signalIds })
    })
    
    if (!response.ok) {
      throw new Error('Failed to mark signals as read')
    }
    
    return true
  } catch (error) {
    console.warn('Failed to mark signals as read:', error.message)
    return false
  }
}

function getUnreadCount(signals) {
  return signals.filter(s => !s.read).length
}

function formatTimestamp(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export {
  SIGNAL_TYPES,
  DAILY_LIMIT,
  sendSignal,
  getSignals,
  markSignalsAsRead,
  getUnreadCount,
  getDailySentCount,
  canSendMoreSignals,
  formatTimestamp
}
