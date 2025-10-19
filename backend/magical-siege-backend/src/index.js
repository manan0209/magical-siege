export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }
    
    if (url.pathname === '/sync' && request.method === 'POST') {
      try {
        const userData = await request.json()
        
        if (!userData.username || !userData.coins || !userData.lastUpdated) {
          return new Response('Invalid data', { status: 400, headers: corsHeaders })
        }
        
        await env.LEADERBOARD.put(
          userData.username,
          JSON.stringify(userData),
          { expirationTtl: 604800 }
        )
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response('Error: ' + error.message, { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }
    
    if (url.pathname === '/leaderboard' && request.method === 'GET') {
      try {
        const list = await env.LEADERBOARD.list()
        const users = []
        
        for (const key of list.keys) {
          if (key.name.startsWith('signal_')) {
            continue
          }
          
          const data = await env.LEADERBOARD.get(key.name)
          if (data) {
            try {
              const parsed = JSON.parse(data)
              if (parsed.username && parsed.coins !== undefined && parsed.lastUpdated) {
                users.push(parsed)
              }
            } catch (e) {
              continue
            }
          }
        }
        
        const activeUsers = users
          .filter(u => Date.now() - u.lastUpdated < 604800000)
          .sort((a, b) => b.coins - a.coins)
        
        return new Response(JSON.stringify(activeUsers), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response('Error: ' + error.message, { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }
    
    if (url.pathname === '/signal' && request.method === 'POST') {
      try {
        const signalData = await request.json()
        
        if (!signalData.from || !signalData.to || !signalData.type) {
          return new Response('Invalid data', { status: 400, headers: corsHeaders })
        }
        
        if (signalData.from === signalData.to) {
          return new Response('Cannot signal yourself', { status: 400, headers: corsHeaders })
        }
        
        const signalId = `signal_${signalData.to}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const signal = {
          ...signalData,
          timestamp: Date.now(),
          read: false
        }
        
        await env.LEADERBOARD.put(signalId, JSON.stringify(signal), { expirationTtl: 86400 })
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response('Error: ' + error.message, { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }
    
    if (url.pathname.startsWith('/signals/') && request.method === 'GET') {
      try {
        const username = url.pathname.split('/')[2]
        if (!username) {
          return new Response('Username required', { status: 400, headers: corsHeaders })
        }
        
        const list = await env.LEADERBOARD.list({ prefix: `signal_${username}_` })
        const signals = []
        
        for (const key of list.keys) {
          const data = await env.LEADERBOARD.get(key.name)
          if (data) {
            const signal = JSON.parse(data)
            signals.push({
              id: key.name,
              ...signal
            })
          }
        }
        
        signals.sort((a, b) => b.timestamp - a.timestamp)
        
        return new Response(JSON.stringify(signals), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response('Error: ' + error.message, { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }
    
    if (url.pathname === '/signal/read' && request.method === 'POST') {
      try {
        const { signalIds } = await request.json()
        
        if (!Array.isArray(signalIds)) {
          return new Response('Invalid data', { status: 400, headers: corsHeaders })
        }
        
        for (const id of signalIds) {
          const data = await env.LEADERBOARD.get(id)
          if (data) {
            const signal = JSON.parse(data)
            signal.read = true
            await env.LEADERBOARD.put(id, JSON.stringify(signal), { expirationTtl: 86400 })
          }
        }
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response('Error: ' + error.message, { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }
    
    if (url.pathname === '/test/populate' && request.method === 'POST') {
      try {
        const { username } = await request.json()
        
        if (!username) {
          return new Response('Username required', { status: 400, headers: corsHeaders })
        }
        
        const testUsers = [
          { username: 'TestUser_cupck1', coins: 450, hours: 28 },
          { username: 'TestUser_cupck2', coins: 380, hours: 24 },
          { username: 'TestUser_cupck3', coins: 290, hours: 18 },
          { username: 'TestUser_cupck4', coins: 210, hours: 15 }
        ]
        
        for (const user of testUsers) {
          await env.LEADERBOARD.put(
            user.username,
            JSON.stringify({ ...user, lastUpdated: Date.now() }),
            { expirationTtl: 604800 }
          )
        }
        
        const signalTypes = ['poke', 'motivate', 'celebrate', 'coffee']
        const now = Date.now()
        
        for (let i = 0; i < 5; i++) {
          const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)]
          const randomType = signalTypes[Math.floor(Math.random() * signalTypes.length)]
          const randomTime = now - (Math.random() * 3600000 * 12)
          
          const signalId = `signal_${username}_${randomTime}_${Math.random().toString(36).substr(2, 9)}`
          const signal = {
            from: randomUser.username,
            to: username,
            type: randomType,
            timestamp: randomTime,
            read: false
          }
          
          await env.LEADERBOARD.put(signalId, JSON.stringify(signal), { expirationTtl: 86400 })
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          testUsers: testUsers.length,
          testSignals: 5
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response('Error: ' + error.message, { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }
    
    if (url.pathname === '/admin/clear' && request.method === 'POST') {
      try {
        const list = await env.LEADERBOARD.list()
        
        for (const key of list.keys) {
          await env.LEADERBOARD.delete(key.name)
        }
        
        return new Response(JSON.stringify({ 
          success: true, 
          cleared: list.keys.length 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error) {
        return new Response('Error: ' + error.message, { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }
    
    return new Response('Not Found', { status: 404, headers: corsHeaders })
  }
};
