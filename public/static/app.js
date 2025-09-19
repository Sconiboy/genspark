// NetworkConnect Frontend JavaScript

class NetworkConnectApp {
  constructor() {
    this.apiBase = '/api'
    this.currentUser = null
    this.skills = []
    this.init()
  }

  async init() {
    console.log('🚀 NetworkConnect App Initialized')
    
    // Load initial data
    await this.loadSkills()
    await this.loadStats()
    await this.performInitialSearch()
    
    // Setup event listeners
    this.setupEventListeners()
    
    console.log('✅ App Ready')
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
      
      console.log(`📚 Loaded ${this.skills.length} skills`)
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
              <div class="text-3xl font-bold text-primary">${stats.total_users}</div>
              <div class="text-sm text-gray-600">Active Users</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-secondary">${stats.total_connections}</div>
              <div class="text-sm text-gray-600">Successful Connections</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-accent">${stats.total_skills}</div>
              <div class="text-sm text-gray-600">Skill Categories</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600">${stats.categories.length}</div>
              <div class="text-sm text-gray-600">Industries</div>
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
          <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
          <p class="text-gray-500">No users found matching your criteria.</p>
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
      <div class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h5 class="font-semibold text-lg text-gray-900">${this.escapeHtml(user.name)}</h5>
            <p class="text-sm text-gray-500">
              <i class="fas fa-calendar mr-1"></i>
              Joined ${this.formatDate(user.created_at)}
            </p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold ${scoreColor}">${score}</div>
            <div class="text-xs text-gray-500">Network Score</div>
          </div>
        </div>
        
        <p class="text-gray-600 text-sm mb-4 line-clamp-3">
          ${user.bio ? this.escapeHtml(user.bio) : 'Professional networker and connector'}
        </p>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center text-sm text-gray-500">
            <i class="fas fa-handshake mr-1"></i>
            ${user.successful_connections} connections
          </div>
          
          <button 
            class="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            onclick="networkApp.viewUserProfile(${user.id})"
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
      <div id="userModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.networkApp = new NetworkConnectApp()
})

// Handle modal clicks outside content
document.addEventListener('click', (e) => {
  if (e.target.id === 'userModal') {
    window.networkApp.closeModal()
  }
})