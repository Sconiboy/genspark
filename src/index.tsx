import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import type { CloudflareBindings } from './types'

// Create Hono app with TypeScript bindings
const app = new Hono<{ Bindings: CloudflareBindings }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}))

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'networking-app-api' 
  })
})

// Get all skills/categories
app.get('/api/skills', async (c) => {
  const { DB } = c.env
  
  try {
    const result = await DB.prepare(`
      SELECT * FROM skills 
      ORDER BY category, name
    `).all()
    
    return c.json({ skills: result.results || [] })
  } catch (error) {
    console.error('Error fetching skills:', error)
    return c.json({ error: 'Failed to fetch skills' }, 500)
  }
})

// Get skills by category
app.get('/api/skills/category/:category', async (c) => {
  const { DB } = c.env
  const category = c.req.param('category')
  
  try {
    const result = await DB.prepare(`
      SELECT * FROM skills 
      WHERE category = ? 
      ORDER BY name
    `).bind(category).all()
    
    return c.json({ skills: result.results || [] })
  } catch (error) {
    console.error('Error fetching skills by category:', error)
    return c.json({ error: 'Failed to fetch skills' }, 500)
  }
})

// Search users (public/searchable profiles only)
app.get('/api/users/search', async (c) => {
  const { DB } = c.env
  const query = c.req.query('q') || ''
  const skillIds = c.req.query('skills')?.split(',').map(id => parseInt(id)) || []
  const minScore = parseInt(c.req.query('min_score') || '0')
  const page = parseInt(c.req.query('page') || '1')
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100)
  const offset = (page - 1) * limit
  
  try {
    let sql = `
      SELECT u.id, u.name, u.bio, u.profile_visibility, 
             CASE WHEN u.score_visibility = 'public' THEN u.network_score ELSE NULL END as network_score,
             u.successful_connections, u.created_at
      FROM users u
      WHERE u.profile_visibility IN ('public', 'searchable')
        AND u.email_verified = true
    `
    
    const params: any[] = []
    
    // Add search query filter
    if (query) {
      sql += ` AND (u.name LIKE ? OR u.bio LIKE ?)`
      params.push(`%${query}%`, `%${query}%`)
    }
    
    // Add minimum score filter
    if (minScore > 0) {
      sql += ` AND u.network_score >= ?`
      params.push(minScore)
    }
    
    // Add skills filter
    if (skillIds.length > 0) {
      sql += ` AND u.id IN (
        SELECT DISTINCT us.user_id 
        FROM user_skills us 
        WHERE us.skill_id IN (${skillIds.map(() => '?').join(',')})
      )`
      params.push(...skillIds)
    }
    
    sql += ` ORDER BY u.network_score DESC, u.successful_connections DESC`
    sql += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)
    
    const result = await DB.prepare(sql).bind(...params).all()
    
    return c.json({ 
      users: result.results || [],
      page,
      limit,
      total: result.results?.length || 0
    })
  } catch (error) {
    console.error('Error searching users:', error)
    return c.json({ error: 'Failed to search users' }, 500)
  }
})

// Get user profile by ID (respects privacy settings)
app.get('/api/users/:id', async (c) => {
  const { DB } = c.env
  const userId = parseInt(c.req.param('id'))
  
  try {
    // Get user basic info
    const userResult = await DB.prepare(`
      SELECT u.id, u.name, u.bio, u.profile_visibility,
             CASE WHEN u.score_visibility = 'public' THEN u.network_score ELSE NULL END as network_score,
             u.successful_connections, u.created_at
      FROM users u
      WHERE u.id = ? AND u.profile_visibility IN ('public', 'searchable')
    `).bind(userId).first()
    
    if (!userResult) {
      return c.json({ error: 'User not found or profile is private' }, 404)
    }
    
    // Get user skills
    const skillsResult = await DB.prepare(`
      SELECT us.proficiency_level, s.id, s.name, s.category, s.description
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
      ORDER BY s.category, s.name
    `).bind(userId).all()
    
    return c.json({ 
      user: userResult,
      skills: skillsResult.results || []
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return c.json({ error: 'Failed to fetch user profile' }, 500)
  }
})

// Get leaderboard (top users by score)
app.get('/api/leaderboard', async (c) => {
  const { DB } = c.env
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)
  
  try {
    const result = await DB.prepare(`
      SELECT u.id, u.name, u.bio, u.network_score, u.successful_connections, u.created_at
      FROM users u
      WHERE u.profile_visibility = 'public' 
        AND u.score_visibility = 'public'
        AND u.email_verified = true
      ORDER BY u.network_score DESC, u.successful_connections DESC
      LIMIT ?
    `).bind(limit).all()
    
    return c.json({ leaderboard: result.results || [] })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return c.json({ error: 'Failed to fetch leaderboard' }, 500)
  }
})

// Get platform statistics
app.get('/api/stats', async (c) => {
  const { DB } = c.env
  
  try {
    // Get basic stats
    const totalUsersResult = await DB.prepare(`SELECT COUNT(*) as count FROM users WHERE email_verified = true`).first()
    const totalConnectionsResult = await DB.prepare(`SELECT COUNT(*) as count FROM referrals WHERE status = 'completed'`).first()
    const totalSkillsResult = await DB.prepare(`SELECT COUNT(*) as count FROM skills`).first()
    
    // Get category breakdown
    const categoryResult = await DB.prepare(`
      SELECT s.category, COUNT(*) as skill_count
      FROM skills s
      GROUP BY s.category
      ORDER BY skill_count DESC
    `).all()
    
    return c.json({
      stats: {
        total_users: totalUsersResult?.count || 0,
        total_connections: totalConnectionsResult?.count || 0,
        total_skills: totalSkillsResult?.count || 0,
        categories: categoryResult.results || []
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return c.json({ error: 'Failed to fetch statistics' }, 500)
  }
})

// Default route - Main application
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Plugg'd - Premium Professional Network</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#000000',
                  secondary: '#1a1a1a',
                  accent: '#ffd700',
                  gray: {
                    850: '#1f2937',
                    900: '#111827',
                    950: '#0f172a'
                  }
                }
              }
            }
          }
        </script>
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-black text-white">
        <!-- Navigation -->
        <nav class="bg-black border-b border-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <h1 class="text-2xl font-bold text-white">
                            <i class="fas fa-plug mr-2 text-accent"></i>
                            Plugg'd
                        </h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button id="joinBtn" class="bg-accent text-black px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-semibold">
                            <i class="fas fa-crown mr-2"></i>
                            Join Elite
                        </button>
                        <button id="loginBtn" class="text-white hover:text-accent transition-colors px-4 py-2">
                            <i class="fas fa-key mr-2"></i>
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <div class="bg-gradient-to-br from-gray-900 to-black text-white py-20 border-b border-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 class="text-5xl font-bold mb-6">
                    <span class="text-accent">Premium</span> Professional Connections
                </h2>
                <p class="text-xl mb-8 max-w-3xl mx-auto opacity-90">
                    Exclusive access to high-net-worth professionals. Monetize your elite network 
                    while maintaining complete privacy and discretion.
                </p>
                <div class="flex justify-center space-x-4">
                    <button id="getStartedBtn" class="bg-accent text-black px-8 py-4 rounded-lg font-bold hover:bg-yellow-400 transition-colors text-lg">
                        <i class="fas fa-diamond mr-2"></i>
                        Request Access
                    </button>
                    <button id="learnMoreBtn" class="border-2 border-accent text-accent px-8 py-4 rounded-lg font-bold hover:bg-accent hover:text-black transition-colors text-lg">
                        <i class="fas fa-info-circle mr-2"></i>
                        Learn More
                    </button>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div class="py-20 bg-gray-900">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h3 class="text-3xl font-bold text-white mb-4">
                        How Plugg'd Works
                    </h3>
                    <p class="text-xl text-gray-300 max-w-2xl mx-auto">
                        Elite networking platform for high-net-worth professionals
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <!-- Feature 1 -->
                    <div class="text-center p-8 rounded-xl bg-black border border-gray-800 hover:border-accent transition-all">
                        <div class="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-user-secret text-black text-2xl"></i>
                        </div>
                        <h4 class="text-xl font-semibold mb-3 text-white">Ultimate Discretion</h4>
                        <p class="text-gray-300">
                            Your network remains completely confidential. Premium privacy for elite professionals.
                        </p>
                    </div>

                    <!-- Feature 2 -->
                    <div class="text-center p-8 rounded-xl bg-black border border-gray-800 hover:border-accent transition-all">
                        <div class="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-crown text-black text-2xl"></i>
                        </div>
                        <h4 class="text-xl font-semibold mb-3 text-white">Curated Network</h4>
                        <p class="text-gray-300">
                            Exclusive access to verified high-net-worth individuals and industry leaders.
                        </p>
                    </div>

                    <!-- Feature 3 -->
                    <div class="text-center p-8 rounded-xl bg-black border border-gray-800 hover:border-accent transition-all">
                        <div class="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-gem text-black text-2xl"></i>
                        </div>
                        <h4 class="text-xl font-semibold mb-3 text-white">Premium Rewards</h4>
                        <p class="text-gray-300">
                            Monetize your valuable connections with premium fees and exclusive opportunities.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Live Demo Section -->
        <div class="py-20 bg-black border-t border-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-12">
                    <h3 class="text-3xl font-bold text-white mb-4">
                        Elite Network Preview
                    </h3>
                    <p class="text-xl text-gray-300">
                        Preview our exclusive network of verified professionals
                    </p>
                </div>

                <div id="app" class="space-y-8">
                    <!-- Search Interface -->
                    <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <div class="flex flex-col md:flex-row gap-4 mb-6">
                            <div class="flex-1">
                                <input 
                                    type="text" 
                                    id="searchQuery"
                                    placeholder="Search elite professionals..." 
                                    class="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white placeholder-gray-400"
                                >
                            </div>
                            <select id="categoryFilter" class="px-4 py-3 bg-black border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-white">
                                <option value="">All Categories</option>
                            </select>
                            <button 
                                id="searchBtn"
                                class="bg-accent text-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-semibold"
                            >
                                <i class="fas fa-search mr-2"></i>
                                Search
                            </button>
                        </div>
                    </div>

                    <!-- Results -->
                    <div id="searchResults" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <!-- Results will be populated here -->
                    </div>

                    <!-- Stats -->
                    <div id="platformStats" class="bg-gray-900 rounded-xl p-6 border border-gray-800">
                        <h4 class="text-xl font-semibold mb-4 text-white">Elite Network Stats</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <!-- Stats will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- CTA Section -->
        <div class="py-20 bg-gradient-to-r from-gray-900 to-black text-white border-t border-gray-800">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h3 class="text-4xl font-bold mb-6">
                    Ready to Join the <span class="text-accent">Elite</span>?
                </h3>
                <p class="text-xl mb-8 opacity-90">
                    Exclusive access to high-net-worth professionals and premium opportunities
                </p>
                <button id="finalCTABtn" class="bg-accent text-black px-12 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 transition-colors">
                    <i class="fas fa-diamond mr-2"></i>
                    Request Elite Access
                </button>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app