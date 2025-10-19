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
          const data = await env.LEADERBOARD.get(key.name)
          if (data) {
            users.push(JSON.parse(data))
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
