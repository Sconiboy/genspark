// Plugg'd Frontend JavaScript - Premium Network Platform

class PluggdApp {
  constructor() {
    this.apiBase = '/api'
    this.currentUser = null
    this.skills = []
    this.init()
  }

  async init() {
    console.log('🚀 Plugg\'d Premium Network Initialized')
    
    // Load initial data
    await this.loadSkills()
    await this.loadStats()
    await this.performInitialSearch()
    
    // Setup event listeners
    this.setupEventListeners()
    
    console.log('✅ Elite Network Ready')
  }

  setupEventListeners() {
    // Search functionality
    const searchBtn = document.getElementById('searchBtn')
    const searchQuery = document.getElementById('searchQuery')
    const categoryFilter = document.getElementById('categoryFilter')

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.performSearch())
    }

    if (searchQuery) {
      searchQuery.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch()
        }
      })
    }

    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => this.performSearch())
    }

    // Handle authentication buttons
    const joinBtn = document.getElementById('joinBtn')
    const loginBtn = document.getElementById('loginBtn')
    const getStartedBtn = document.getElementById('getStartedBtn')
    const learnMoreBtn = document.getElementById('learnMoreBtn')
    const finalCTABtn = document.getElementById('finalCTABtn')

    if (joinBtn) joinBtn.addEventListener('click', () => this.showJoinModal())
    if (loginBtn) loginBtn.addEventListener('click', () => this.showLoginModal())
    if (getStartedBtn) getStartedBtn.addEventListener('click', () => this.showJoinModal())
    if (learnMoreBtn) learnMoreBtn.addEventListener('click', () => this.showLearnMore())
    if (finalCTABtn) finalCTABtn.addEventListener('click', () => this.showJoinModal())
  }

  async loadSkills() {
    try {
      const response = await axios.get(`${this.apiBase}/skills`)
      this.skills = response.data.skills
      
      // Populate category filter
      const categoryFilter = document.getElementById('categoryFilter')
      if (categoryFilter) {
        const categories = [...new Set(this.skills.map(skill => skill.category))]
        
        categories.forEach(category => {
          const option = document.createElement('option')
          option.value = category
          option.textContent = this.capitalizeWords(category.replace('_', ' '))
          categoryFilter.appendChild(option)
        })
      }
      
      console.log(`💎 Loaded ${this.skills.length} elite skill categories`)
    } catch (error) {
      console.error('❌ Failed to load skills:', error)
    }
  }

  async loadStats() {
    try {
      const response = await axios.get(`${this.apiBase}/stats`)
      const stats = response.data.stats
      
      const statsContainer = document.getElementById('platformStats')
      if (statsContainer) {
        const statsGrid = statsContainer.querySelector('.grid')
        if (statsGrid) {
          statsGrid.innerHTML = `
            <div class="text-center">
              <div class="text-3xl font-bold text-accent">${stats.total_users}</div>
              <div class="text-sm text-gray-400">Elite Members</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-white">${stats.total_connections}</div>
              <div class="text-sm text-gray-400">Premium Connections</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-accent">${stats.total_skills}</div>
              <div class="text-sm text-gray-400">Expertise Areas</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-white">${stats.categories.length}</div>
              <div class="text-sm text-gray-400">Industries</div>
            </div>
          `
        }
      }
      
      console.log('📊 Loaded platform statistics')
    } catch (error) {
      console.error('❌ Failed to load stats:', error)
    }
  }

  async performInitialSearch() {
    // Load top users by default
    await this.searchUsers({
      limit: 9,
      min_score: 50
    })
  }

  async performSearch() {
    const query = document.getElementById('searchQuery')?.value || ''
    const category = document.getElementById('categoryFilter')?.value || ''
    
    let skillIds = []
    if (category) {
      skillIds = this.skills
        .filter(skill => skill.category === category)
        .map(skill => skill.id)
    }

    await this.searchUsers({
      q: query,
      skills: skillIds.length > 0 ? skillIds.join(',') : undefined,
      limit: 12
    })
  }

  async searchUsers(params = {}) {
    try {
      console.log('🔍 Searching users...', params)
      const queryString = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
      ).toString()
      
      const response = await axios.get(`${this.apiBase}/users/search?${queryString}`)
      const users = response.data.users
      
      this.displaySearchResults(users)
      console.log(`👥 Found ${users.length} users`)
    } catch (error) {
      console.error('❌ Search failed:', error)
      this.displayError('Search failed. Please try again.')
    }
  }

  displaySearchResults(users) {
    const resultsContainer = document.getElementById('searchResults')
    if (!resultsContainer) return

    if (users.length === 0) {
      resultsContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-search text-4xl text-gray-600 mb-4"></i>
          <p class="text-gray-400">No elite members found matching your criteria.</p>
        </div>
      `
      return
    }

    resultsContainer.innerHTML = users.map(user => this.renderUserCard(user)).join('')
  }

  renderUserCard(user) {
    const score = user.network_score !== null ? user.network_score : 'Private'
    const scoreColor = typeof score === 'number' ? 
      (score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-gray-600') : 
      'text-gray-400'

    return `
      <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-accent transition-all hover:shadow-lg">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h5 class="font-semibold text-lg text-white">${this.escapeHtml(user.name)}</h5>
            <p class="text-sm text-gray-400">
              <i class="fas fa-crown mr-1 text-accent"></i>
              Elite Member since ${this.formatDate(user.created_at)}
            </p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold ${scoreColor}">${score}</div>
            <div class="text-xs text-gray-400">Elite Score</div>
          </div>
        </div>
        
        <p class="text-gray-300 text-sm mb-4 line-clamp-3">
          ${user.bio ? this.escapeHtml(user.bio) : 'Elite professional and connector'}
        </p>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center text-sm text-gray-400">
            <i class="fas fa-gem mr-1 text-accent"></i>
            ${user.successful_connections} premium connections
          </div>
          
          <button 
            class="bg-accent text-black px-4 py-2 rounded-lg text-sm hover:bg-yellow-400 transition-colors font-semibold"
            onclick="pluggdApp.viewUserProfile(${user.id})"
          >
            <i class="fas fa-eye mr-1"></i>
            View Profile
          </button>
        </div>
      </div>
    `
  }

  async viewUserProfile(userId) {
    try {
      console.log(`👤 Loading profile for user ${userId}`)
      const response = await axios.get(`${this.apiBase}/users/${userId}`)
      const { user, skills } = response.data
      
      this.showUserModal(user, skills)
    } catch (error) {
      console.error('❌ Failed to load user profile:', error)
      this.showNotification('Failed to load user profile', 'error')
    }
  }

  showUserModal(user, skills) {
    const score = user.network_score !== null ? user.network_score : 'Private'
    const scoreColor = typeof score === 'number' ? 
      (score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-gray-600') : 
      'text-gray-400'

    // Group skills by category
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = []
      acc[skill.category].push(skill)
      return acc
    }, {})

    const modalHtml = `
      <div id="userModal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
          <div class="p-6">
            <!-- Header -->
            <div class="flex justify-between items-start mb-6">
              <div>
                <h3 class="text-2xl font-bold text-gray-900">${this.escapeHtml(user.name)}</h3>
                <p class="text-gray-500">
                  <i class="fas fa-calendar mr-1"></i>
                  Member since ${this.formatDate(user.created_at)}
                </p>
              </div>
              <button 
                onclick="networkApp.closeModal()"
                class="text-gray-400 hover:text-gray-600 text-2xl"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>

            <!-- Score & Stats -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="text-center p-4 bg-gray-50 rounded-lg">
                <div class="text-3xl font-bold ${scoreColor}">${score}</div>
                <div class="text-sm text-gray-500">Network Score</div>
              </div>
              <div class="text-center p-4 bg-gray-50 rounded-lg">
                <div class="text-3xl font-bold text-blue-600">${user.successful_connections}</div>
                <div class="text-sm text-gray-500">Successful Connections</div>
              </div>
            </div>

            <!-- Bio -->
            ${user.bio ? `
              <div class="mb-6">
                <h4 class="font-semibold text-gray-900 mb-2">About</h4>
                <p class="text-gray-600">${this.escapeHtml(user.bio)}</p>
              </div>
            ` : ''}

            <!-- Skills -->
            <div class="mb-6">
              <h4 class="font-semibold text-gray-900 mb-3">Expertise</h4>
              ${Object.entries(skillsByCategory).map(([category, categorySkills]) => `
                <div class="mb-4">
                  <h5 class="text-sm font-medium text-gray-700 mb-2">
                    ${this.capitalizeWords(category.replace('_', ' '))}
                  </h5>
                  <div class="flex flex-wrap gap-2">
                    ${categorySkills.map(skill => `
                      <span class="px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-full text-sm flex items-center">
                        ${this.escapeHtml(skill.name)}
                        ${skill.proficiency_level ? `
                          <span class="ml-2 text-xs">
                            ${this.renderStars(skill.proficiency_level)}
                          </span>
                        ` : ''}
                      </span>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Actions -->
            <div class="flex space-x-3">
              <button class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1">
                <i class="fas fa-handshake mr-2"></i>
                Request Connection
              </button>
              <button class="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <i class="fas fa-share mr-2"></i>
                Share Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  closeModal() {
    const modal = document.getElementById('userModal')
    if (modal) {
      modal.remove()
    }
  }

  renderStars(level) {
    return Array.from({ length: 5 }, (_, i) => 
      `<i class="fas fa-star ${i < level ? 'text-yellow-400' : 'text-gray-300'} text-xs"></i>`
    ).join('')
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'success' ? 'bg-green-500 text-white' :
      'bg-blue-500 text-white'
    }`
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.opacity = '0'
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }

  displayError(message) {
    const resultsContainer = document.getElementById('searchResults')
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
          <p class="text-red-500">${this.escapeHtml(message)}</p>
        </div>
      `
    }
  }

  // Utility functions
  capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase())
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Authentication Modals
  showJoinModal() {
    const modalHtml = `
      <div id="authModal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-900 rounded-xl max-w-md w-full border border-gray-700">
          <div class="p-8">
            <div class="text-center mb-6">
              <i class="fas fa-crown text-accent text-3xl mb-3"></i>
              <h3 class="text-2xl font-bold text-white mb-2">Request Elite Access</h3>
              <p class="text-gray-300">Join the most exclusive professional network</p>
            </div>

            <form id="joinForm" class="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  class="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-accent focus:outline-none"
                  required
                >
              </div>
              <div>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  class="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-accent focus:outline-none"
                  required
                >
              </div>
              <div>
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  class="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-accent focus:outline-none"
                  required
                >
              </div>
              <div>
                <select class="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-accent focus:outline-none" required>
                  <option value="">Net Worth Range</option>
                  <option value="1m-5m">$1M - $5M</option>
                  <option value="5m-10m">$5M - $10M</option>
                  <option value="10m-25m">$10M - $25M</option>
                  <option value="25m+">$25M+</option>
                </select>
              </div>
              <div>
                <textarea 
                  placeholder="Brief description of your expertise and network value..."
                  class="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-accent focus:outline-none h-24 resize-none"
                  required
                ></textarea>
              </div>
              
              <div class="flex space-x-3 mt-6">
                <button type="submit" class="flex-1 bg-accent text-black py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors">
                  <i class="fas fa-paper-plane mr-2"></i>
                  Submit Application
                </button>
                <button type="button" onclick="pluggdApp.closeModal()" class="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `
    document.body.insertAdjacentHTML('beforeend', modalHtml)
    
    document.getElementById('joinForm').addEventListener('submit', (e) => {
      e.preventDefault()
      this.showNotification('Application submitted! We\'ll review your request within 48 hours.', 'success')
      this.closeModal()
    })
  }

  showLoginModal() {
    const modalHtml = `
      <div id="authModal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-900 rounded-xl max-w-md w-full border border-gray-700">
          <div class="p-8">
            <div class="text-center mb-6">
              <i class="fas fa-key text-accent text-3xl mb-3"></i>
              <h3 class="text-2xl font-bold text-white mb-2">Elite Member Login</h3>
              <p class="text-gray-300">Access your premium network</p>
            </div>

            <form id="loginForm" class="space-y-4">
              <div>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  class="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-accent focus:outline-none"
                  required
                >
              </div>
              <div>
                <input 
                  type="password" 
                  placeholder="Password" 
                  class="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-accent focus:outline-none"
                  required
                >
              </div>
              
              <div class="flex items-center justify-between text-sm">
                <label class="flex items-center text-gray-300">
                  <input type="checkbox" class="mr-2 bg-black border-gray-600">
                  Remember me
                </label>
                <a href="#" class="text-accent hover:underline">Forgot password?</a>
              </div>
              
              <div class="flex space-x-3 mt-6">
                <button type="submit" class="flex-1 bg-accent text-black py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors">
                  <i class="fas fa-sign-in-alt mr-2"></i>
                  Login
                </button>
                <button type="button" onclick="pluggdApp.closeModal()" class="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `
    document.body.insertAdjacentHTML('beforeend', modalHtml)
    
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault()
      this.showNotification('Login functionality coming soon for elite members.', 'info')
      this.closeModal()
    })
  }

  showLearnMore() {
    const modalHtml = `
      <div id="authModal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-900 rounded-xl max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
          <div class="p-8">
            <div class="text-center mb-6">
              <i class="fas fa-info-circle text-accent text-3xl mb-3"></i>
              <h3 class="text-2xl font-bold text-white mb-2">About Plugg'd</h3>
            </div>

            <div class="space-y-6 text-gray-300">
              <div>
                <h4 class="text-white font-semibold mb-2">Exclusive Network</h4>
                <p>Plugg'd is an invitation-only platform for high-net-worth individuals and industry leaders. Unlike traditional networking platforms, we focus on quality over quantity.</p>
              </div>
              
              <div>
                <h4 class="text-white font-semibold mb-2">Monetize Your Network</h4>
                <p>Members can earn substantial fees for making valuable introductions. Set your own rates and get paid when connections lead to successful business.</p>
              </div>
              
              <div>
                <h4 class="text-white font-semibold mb-2">Complete Privacy</h4>
                <p>Your contact list remains completely confidential. Only you control who sees what, ensuring maximum discretion for sensitive relationships.</p>
              </div>
              
              <div>
                <h4 class="text-white font-semibold mb-2">Elite Events</h4>
                <p>Access exclusive events and gatherings based on your network score. The higher your score, the more prestigious the events you can attend.</p>
              </div>
              
              <div class="bg-black p-4 rounded-lg border border-gray-800">
                <h4 class="text-accent font-semibold mb-2">Membership Requirements</h4>
                <ul class="space-y-1 text-sm">
                  <li>• Verified net worth of $1M+</li>
                  <li>• Industry leadership position</li>
                  <li>• Referral from existing member (preferred)</li>
                  <li>• Background verification process</li>
                </ul>
              </div>
            </div>
            
            <div class="flex space-x-3 mt-8">
              <button onclick="pluggdApp.showJoinModal(); pluggdApp.closeModal()" class="flex-1 bg-accent text-black py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors">
                <i class="fas fa-crown mr-2"></i>
                Apply Now
              </button>
              <button onclick="pluggdApp.closeModal()" class="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  closeModal() {
    const modal = document.getElementById('authModal')
    if (modal) {
      modal.remove()
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pluggdApp = new PluggdApp()
})

// Handle modal clicks outside content
document.addEventListener('click', (e) => {
  if (e.target.id === 'userModal' || e.target.id === 'authModal') {
    window.pluggdApp.closeModal()
  }
})