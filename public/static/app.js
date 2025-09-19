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
    const discoverBtn = document.getElementById('discoverBtn')
    const joinBtn = document.getElementById('joinBtn')
    const loginBtn = document.getElementById('loginBtn')
    const getStartedBtn = document.getElementById('getStartedBtn')
    const learnMoreBtn = document.getElementById('learnMoreBtn')
    const finalCTABtn = document.getElementById('finalCTABtn')

    if (discoverBtn) discoverBtn.addEventListener('click', () => this.showContactDiscovery())
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

  showContactDiscovery() {
    const modalHtml = `
      <div id="authModal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-900 rounded-xl max-w-3xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
          <div class="p-8">
            <div class="text-center mb-6">
              <i class="fas fa-search-plus text-accent text-3xl mb-3"></i>
              <h3 class="text-2xl font-bold text-white mb-2">Discover Your Elite Network</h3>
              <p class="text-gray-300">Upload your contacts to see which high-net-worth individuals you already know</p>
            </div>

            <div id="discoverySteps">
              <!-- Step 1: Privacy & Permissions -->
              <div id="step1" class="space-y-6">
                <div class="bg-black p-6 rounded-lg border border-gray-800">
                  <h4 class="text-white font-semibold mb-3 flex items-center">
                    <i class="fas fa-shield-alt text-accent mr-2"></i>
                    Privacy & Security Guarantee
                  </h4>
                  <div class="space-y-3 text-gray-300 text-sm">
                    <div class="flex items-start">
                      <i class="fas fa-check text-accent mr-2 mt-1"></i>
                      <span>Your contacts remain completely private and are never stored permanently</span>
                    </div>
                    <div class="flex items-start">
                      <i class="fas fa-check text-accent mr-2 mt-1"></i>
                      <span>We only match email addresses with existing elite members</span>
                    </div>
                    <div class="flex items-start">
                      <i class="fas fa-check text-accent mr-2 mt-1"></i>
                      <span>Contact data is deleted immediately after discovery process</span>
                    </div>
                    <div class="flex items-start">
                      <i class="fas fa-check text-accent mr-2 mt-1"></i>
                      <span>Only members with public/searchable profiles can be discovered</span>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-800 p-4 rounded-lg">
                  <h4 class="text-white font-semibold mb-2">What We'll Show You:</h4>
                  <ul class="text-gray-300 text-sm space-y-1">
                    <li>• Elite members already in your network</li>
                    <li>• Network scores and connection history</li>
                    <li>• Expertise areas and premium skills</li>
                    <li>• Potential introduction opportunities</li>
                  </ul>
                </div>

                <div class="flex space-x-3">
                  <button onclick="pluggdApp.showStep2()" class="flex-1 bg-accent text-black py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors">
                    <i class="fas fa-arrow-right mr-2"></i>
                    I Understand, Proceed
                  </button>
                  <button onclick="pluggdApp.closeModal()" class="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>

              <!-- Step 2: Contact Upload Methods -->
              <div id="step2" class="space-y-6 hidden">
                <h4 class="text-white font-semibold mb-4">Choose Contact Upload Method:</h4>
                
                <div class="grid md:grid-cols-2 gap-4">
                  <!-- CSV Upload -->
                  <div class="bg-black p-6 rounded-lg border border-gray-800 hover:border-accent transition-colors cursor-pointer" onclick="pluggdApp.showCSVUpload()">
                    <div class="text-center">
                      <i class="fas fa-file-csv text-accent text-2xl mb-3"></i>
                      <h5 class="text-white font-semibold mb-2">CSV File Upload</h5>
                      <p class="text-gray-300 text-sm">Upload a CSV file exported from your phone, email, or CRM</p>
                    </div>
                  </div>

                  <!-- Manual Entry -->
                  <div class="bg-black p-6 rounded-lg border border-gray-800 hover:border-accent transition-colors cursor-pointer" onclick="pluggdApp.showManualEntry()">
                    <div class="text-center">
                      <i class="fas fa-keyboard text-accent text-2xl mb-3"></i>
                      <h5 class="text-white font-semibold mb-2">Manual Entry</h5>
                      <p class="text-gray-300 text-sm">Manually enter key contacts you want to check</p>
                    </div>
                  </div>
                </div>

                <div class="text-center">
                  <button onclick="pluggdApp.showStep1()" class="text-gray-400 hover:text-accent transition-colors">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back to Privacy Info
                  </button>
                </div>
              </div>

              <!-- Step 3: CSV Upload -->
              <div id="step3" class="space-y-6 hidden">
                <h4 class="text-white font-semibold mb-4">Upload Contact File</h4>
                
                <div class="bg-black p-6 rounded-lg border border-gray-800">
                  <div class="text-center">
                    <input type="file" id="csvFileInput" accept=".csv,.txt" class="hidden" onchange="pluggdApp.handleFileUpload(event)">
                    <div id="uploadArea" class="border-2 border-dashed border-gray-600 rounded-lg p-8 hover:border-accent transition-colors cursor-pointer" onclick="document.getElementById('csvFileInput').click()">
                      <i class="fas fa-cloud-upload-alt text-accent text-3xl mb-3"></i>
                      <p class="text-white font-semibold mb-2">Click to upload CSV file</p>
                      <p class="text-gray-400 text-sm">Supported formats: CSV, TXT with comma separation</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gray-800 p-4 rounded-lg">
                  <h5 class="text-white font-semibold mb-2">CSV Format Example:</h5>
                  <code class="text-gray-300 text-xs block">
                    Name,Email,Phone,Company<br>
                    John Doe,john@example.com,555-1234,Tech Corp<br>
                    Jane Smith,jane@company.com,555-5678,Investment Firm
                  </code>
                </div>

                <div class="text-center">
                  <button onclick="pluggdApp.showStep2()" class="text-gray-400 hover:text-accent transition-colors">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back to Upload Methods
                  </button>
                </div>
              </div>

              <!-- Step 4: Manual Entry -->
              <div id="step4" class="space-y-6 hidden">
                <h4 class="text-white font-semibold mb-4">Enter Key Contacts</h4>
                
                <div id="manualContacts" class="space-y-4">
                  <div class="contact-row bg-black p-4 rounded-lg border border-gray-800">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input type="text" placeholder="Full Name" class="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-accent focus:outline-none">
                      <input type="email" placeholder="Email Address" class="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-accent focus:outline-none">
                      <input type="text" placeholder="Company (optional)" class="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-accent focus:outline-none">
                    </div>
                  </div>
                </div>

                <div class="flex justify-between items-center">
                  <button onclick="pluggdApp.addManualContact()" class="text-accent hover:text-yellow-400 transition-colors">
                    <i class="fas fa-plus mr-2"></i>
                    Add Another Contact
                  </button>
                  <button onclick="pluggdApp.processManualContacts()" class="bg-accent text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors">
                    <i class="fas fa-search mr-2"></i>
                    Discover Matches
                  </button>
                </div>

                <div class="text-center">
                  <button onclick="pluggdApp.showStep2()" class="text-gray-400 hover:text-accent transition-colors">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back to Upload Methods
                  </button>
                </div>
              </div>

              <!-- Results -->
              <div id="discoveryResults" class="hidden">
                <!-- Results will be populated here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  showStep1() {
    document.getElementById('step1').classList.remove('hidden')
    document.getElementById('step2').classList.add('hidden')
    document.getElementById('step3').classList.add('hidden')
    document.getElementById('step4').classList.add('hidden')
    document.getElementById('discoveryResults').classList.add('hidden')
  }

  showStep2() {
    document.getElementById('step1').classList.add('hidden')
    document.getElementById('step2').classList.remove('hidden')
    document.getElementById('step3').classList.add('hidden')
    document.getElementById('step4').classList.add('hidden')
    document.getElementById('discoveryResults').classList.add('hidden')
  }

  showCSVUpload() {
    document.getElementById('step1').classList.add('hidden')
    document.getElementById('step2').classList.add('hidden')
    document.getElementById('step3').classList.remove('hidden')
    document.getElementById('step4').classList.add('hidden')
    document.getElementById('discoveryResults').classList.add('hidden')
  }

  showManualEntry() {
    document.getElementById('step1').classList.add('hidden')
    document.getElementById('step2').classList.add('hidden')
    document.getElementById('step3').classList.add('hidden')
    document.getElementById('step4').classList.remove('hidden')
    document.getElementById('discoveryResults').classList.add('hidden')
  }

  addManualContact() {
    const container = document.getElementById('manualContacts')
    const contactRow = document.createElement('div')
    contactRow.className = 'contact-row bg-black p-4 rounded-lg border border-gray-800'
    contactRow.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input type="text" placeholder="Full Name" class="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-accent focus:outline-none">
        <input type="email" placeholder="Email Address" class="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-accent focus:outline-none">
        <input type="text" placeholder="Company (optional)" class="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-400 focus:border-accent focus:outline-none">
      </div>
      <div class="mt-2 text-right">
        <button onclick="this.parentElement.parentElement.remove()" class="text-red-400 hover:text-red-300 text-sm">
          <i class="fas fa-trash mr-1"></i>Remove
        </button>
      </div>
    `
    container.appendChild(contactRow)
  }

  async processManualContacts() {
    const contactRows = document.querySelectorAll('.contact-row')
    const contacts = []
    
    contactRows.forEach(row => {
      const inputs = row.querySelectorAll('input')
      const name = inputs[0].value.trim()
      const email = inputs[1].value.trim()
      const company = inputs[2].value.trim()
      
      if (name && email) {
        contacts.push({ name, email, company })
      }
    })
    
    if (contacts.length === 0) {
      this.showNotification('Please enter at least one contact with name and email', 'error')
      return
    }
    
    await this.performContactDiscovery(contacts)
  }

  async handleFileUpload(event) {
    const file = event.target.files[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const contacts = this.parseCSV(text)
      
      if (contacts.length === 0) {
        this.showNotification('No valid contacts found in the file', 'error')
        return
      }
      
      await this.performContactDiscovery(contacts)
      
    } catch (error) {
      console.error('Error reading file:', error)
      this.showNotification('Error reading file. Please check the format.', 'error')
    }
  }

  parseCSV(text) {
    const lines = text.split('\\n').filter(line => line.trim())
    const contacts = []
    
    // Skip header row if it exists
    const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map(part => part.trim().replace(/"/g, ''))
      
      if (parts.length >= 2) {
        const contact = {
          name: parts[0],
          email: parts[1],
          phone: parts[2] || '',
          company: parts[3] || ''
        }
        
        // Validate email format
        if (contact.email && contact.email.includes('@')) {
          contacts.push(contact)
        }
      }
    }
    
    return contacts
  }

  async performContactDiscovery(contacts) {
    try {
      this.showNotification('Analyzing your network...', 'info')
      
      const response = await axios.post(\`\${this.apiBase}/contacts/discover\`, {
        contacts
      })
      
      const { matches, total_contacts, matches_found, discovery_summary } = response.data
      
      this.showDiscoveryResults({
        matches,
        total_contacts,
        matches_found,
        discovery_summary
      })
      
    } catch (error) {
      console.error('Contact discovery failed:', error)
      this.showNotification('Discovery failed. Please try again.', 'error')
    }
  }

  showDiscoveryResults(results) {
    const { matches, total_contacts, matches_found, discovery_summary } = results
    
    // Hide all steps
    document.getElementById('step1').classList.add('hidden')
    document.getElementById('step2').classList.add('hidden')
    document.getElementById('step3').classList.add('hidden')
    document.getElementById('step4').classList.add('hidden')
    
    // Show results
    const resultsDiv = document.getElementById('discoveryResults')
    resultsDiv.classList.remove('hidden')
    
    resultsDiv.innerHTML = \`
      <div class="space-y-6">
        <div class="text-center">
          <i class="fas fa-network-wired text-accent text-3xl mb-3"></i>
          <h3 class="text-2xl font-bold text-white mb-2">Discovery Complete!</h3>
          <p class="text-gray-300">Found \${matches_found} elite members in your network</p>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-black rounded-lg border border-gray-800">
            <div class="text-2xl font-bold text-accent">\${total_contacts}</div>
            <div class="text-xs text-gray-400">Contacts Analyzed</div>
          </div>
          <div class="text-center p-4 bg-black rounded-lg border border-gray-800">
            <div class="text-2xl font-bold text-white">\${matches_found}</div>
            <div class="text-xs text-gray-400">Elite Members Found</div>
          </div>
          <div class="text-center p-4 bg-black rounded-lg border border-gray-800">
            <div class="text-2xl font-bold text-accent">\${discovery_summary.high_scorers}</div>
            <div class="text-xs text-gray-400">High Scorers (80+)</div>
          </div>
          <div class="text-center p-4 bg-black rounded-lg border border-gray-800">
            <div class="text-2xl font-bold text-white">\${discovery_summary.verified_professionals}</div>
            <div class="text-xs text-gray-400">Active Connectors</div>
          </div>
        </div>

        \${matches.length > 0 ? \`
          <div>
            <h4 class="text-white font-semibold mb-4">Elite Members in Your Network:</h4>
            <div class="space-y-3">
              \${matches.map(match => \`
                <div class="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-accent transition-colors">
                  <div class="flex justify-between items-center">
                    <div>
                      <h5 class="text-white font-semibold">\${this.escapeHtml(match.name)}</h5>
                      <p class="text-gray-400 text-sm">\${this.escapeHtml(match.email)}</p>
                      <p class="text-gray-300 text-sm">\${match.successful_connections} premium connections</p>
                    </div>
                    <div class="text-right">
                      <div class="text-xl font-bold text-accent">\${match.network_score || 'Private'}</div>
                      <div class="text-xs text-gray-400">Elite Score</div>
                    </div>
                  </div>
                  <div class="mt-3 flex space-x-2">
                    <button onclick="pluggdApp.viewUserProfile(\${match.id}); pluggdApp.closeModal()" class="bg-accent text-black px-4 py-2 rounded text-sm font-semibold hover:bg-yellow-400 transition-colors">
                      View Profile
                    </button>
                    <button class="border border-gray-600 text-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                      Request Introduction
                    </button>
                  </div>
                </div>
              \`).join('')}
            </div>
          </div>
        \` : \`
          <div class="text-center py-8">
            <i class="fas fa-search text-gray-600 text-4xl mb-4"></i>
            <p class="text-gray-400">No elite members found in your current contact list.</p>
            <p class="text-gray-500 text-sm mt-2">Try uploading more contacts or invite high-net-worth contacts to join Plugg'd.</p>
          </div>
        \`}

        <div class="text-center space-x-3">
          <button onclick="pluggdApp.showStep2()" class="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            <i class="fas fa-redo mr-2"></i>
            Discover More
          </button>
          <button onclick="pluggdApp.closeModal()" class="border border-gray-600 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    \`
    
    this.showNotification(\`Discovery complete! Found \${matches_found} elite members in your network.\`, 'success')
  }

  closeModal() {
    const modal = document.getElementById('authModal') || document.getElementById('userModal')
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