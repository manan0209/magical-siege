const BACKEND_URL = 'https://magical-siege-backend.siegelb.workers.dev'


//poke signal, I'm gonna poke you as welll :lol
const SIGNAL_TYPES = {
  POKE: { 
    id: 'poke', 
    label: 'Poke', 
    description: 'Poke',
    icon: ''
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
