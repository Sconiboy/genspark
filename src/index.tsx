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
        <title>NetworkConnect - Monetize Your Professional Network</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#2563eb',
                  secondary: '#7c3aed',
                  accent: '#f59e0b'
                }
              }
            }
          }
        </script>
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center">
                        <h1 class="text-2xl font-bold text-primary">
                            <i class="fas fa-network-wired mr-2"></i>
                            NetworkConnect
                        </h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-user-plus mr-2"></i>
                            Join Platform
                        </button>
                        <button class="text-gray-600 hover:text-primary transition-colors">
                            <i class="fas fa-sign-in-alt mr-2"></i>
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <div class="bg-gradient-to-br from-primary to-secondary text-white py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 class="text-5xl font-bold mb-6">
                    Monetize Your Professional Network
                </h2>
                <p class="text-xl mb-8 max-w-3xl mx-auto opacity-90">
                    Connect people with the right expertise while keeping your contacts private. 
                    Earn money for successful introductions and build your network score.
                </p>
                <div class="flex justify-center space-x-4">
                    <button class="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        <i class="fas fa-rocket mr-2"></i>
                        Get Started
                    </button>
                    <button class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors">
                        <i class="fas fa-play mr-2"></i>
                        Learn More
                    </button>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h3 class="text-3xl font-bold text-gray-900 mb-4">
                        How NetworkConnect Works
                    </h3>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                        A private, gamified networking platform that rewards valuable connections
                    </p>
                </div>

                <div class="grid md:grid-cols-3 gap-8">
                    <!-- Feature 1 -->
                    <div class="text-center p-6 rounded-xl bg-gray-50 hover:shadow-lg transition-shadow">
                        <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-shield-alt text-white text-2xl"></i>
                        </div>
                        <h4 class="text-xl font-semibold mb-3">Private Contacts</h4>
                        <p class="text-gray-600">
                            Your contact list stays completely private. Unlike LinkedIn, only you can see your connections.
                        </p>
                    </div>

                    <!-- Feature 2 -->
                    <div class="text-center p-6 rounded-xl bg-gray-50 hover:shadow-lg transition-shadow">
                        <div class="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-handshake text-white text-2xl"></i>
                        </div>
                        <h4 class="text-xl font-semibold mb-3">Mutual Approval</h4>
                        <p class="text-gray-600">
                            Both parties must approve before any introduction is made, ensuring quality connections.
                        </p>
                    </div>

                    <!-- Feature 3 -->
                    <div class="text-center p-6 rounded-xl bg-gray-50 hover:shadow-lg transition-shadow">
                        <div class="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-coins text-white text-2xl"></i>
                        </div>
                        <h4 class="text-xl font-semibold mb-3">Earn Money</h4>
                        <p class="text-gray-600">
                            Set your own fees for introductions. Get paid when connections lead to successful business.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Live Demo Section -->
        <div class="py-20 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-12">
                    <h3 class="text-3xl font-bold text-gray-900 mb-4">
                        Explore the Network
                    </h3>
                    <p class="text-xl text-gray-600">
                        Search for expertise and see how our scoring system works
                    </p>
                </div>

                <div id="app" class="space-y-8">
                    <!-- Search Interface -->
                    <div class="bg-white rounded-xl p-6 shadow-sm">
                        <div class="flex flex-col md:flex-row gap-4 mb-6">
                            <div class="flex-1">
                                <input 
                                    type="text" 
                                    id="searchQuery"
                                    placeholder="Search for expertise..." 
                                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                            </div>
                            <select id="categoryFilter" class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                <option value="">All Categories</option>
                            </select>
                            <button 
                                id="searchBtn"
                                class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                    <div id="platformStats" class="bg-white rounded-xl p-6 shadow-sm">
                        <h4 class="text-xl font-semibold mb-4">Platform Statistics</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <!-- Stats will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- CTA Section -->
        <div class="py-20 bg-primary text-white">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h3 class="text-4xl font-bold mb-6">
                    Ready to Monetize Your Network?
                </h3>
                <p class="text-xl mb-8 opacity-90">
                    Join successful professionals who are earning money from their connections
                </p>
                <button class="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors">
                    <i class="fas fa-user-plus mr-2"></i>
                    Start Building Your Network Score
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