import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { username, coins, hours, lastUpdated } = req.body
    
    if (!username || coins === undefined || !lastUpdated) {
      return res.status(400).json({ error: 'Invalid data' })
    }
    
    await kv.set(`user:${username}`, {
      username,
      coins,
      hours,
      lastUpdated
    }, {
      ex: 604800
    })
    
    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
