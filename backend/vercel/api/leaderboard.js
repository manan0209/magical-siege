import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const keys = await kv.keys('user:*')
    const users = []
    
    for (const key of keys) {
      const userData = await kv.get(key)
      if (userData) {
        users.push(userData)
      }
    }
    
    const activeUsers = users
      .filter(u => Date.now() - u.lastUpdated < 604800000)
      .sort((a, b) => b.coins - a.coins)
    
    return res.status(200).json(activeUsers)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
