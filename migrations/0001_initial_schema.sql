-- Networking App Database Schema
-- Privacy-focused professional networking and referral platform

-- Users table - Platform members
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  
  -- Privacy settings
  profile_visibility TEXT DEFAULT 'searchable' CHECK (profile_visibility IN ('public', 'searchable', 'private')),
  score_visibility TEXT DEFAULT 'private' CHECK (score_visibility IN ('public', 'private')),
  allow_direct_contact BOOLEAN DEFAULT false,
  
  -- Scoring system
  network_score INTEGER DEFAULT 0,
  successful_connections INTEGER DEFAULT 0,
  total_earnings REAL DEFAULT 0.0,
  
  -- Authentication & verification
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Skills/Categories table - Areas of expertise
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'technology', 'investing', 'introductions', 'celebrity', 'services', etc.
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User skills relationship
CREATE TABLE IF NOT EXISTS user_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(user_id, skill_id)
);

-- Contacts table - Private contact lists (NOT publicly visible)
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL, -- User who owns this contact
  
  -- Contact information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  notes TEXT,
  
  -- Connection status
  is_platform_user BOOLEAN DEFAULT false,
  platform_user_id INTEGER, -- If they join the platform
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (platform_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Contact skills relationship - What skills each contact has
CREATE TABLE IF NOT EXISTS contact_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  notes TEXT, -- Specific notes about this person's expertise
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(contact_id, skill_id)
);

-- Invitations table - Pending invites to join platform
CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_id INTEGER NOT NULL, -- Who sent the invitation
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  
  -- Invitation details
  invitation_token TEXT UNIQUE NOT NULL,
  message TEXT,
  
  -- Skills they were recommended for
  recommended_skills TEXT, -- JSON array of skill IDs
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT (datetime('now', '+7 days')),
  responded_at DATETIME,
  
  FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Referrals table - Connection requests and introductions
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Parties involved
  requester_id INTEGER NOT NULL, -- Person asking for connection
  connector_id INTEGER NOT NULL, -- Person making the introduction
  contact_id INTEGER, -- Contact being referred (may not be platform user yet)
  connectee_id INTEGER, -- If contact is a platform user
  
  -- Referral details
  skill_id INTEGER NOT NULL, -- What skill/service is needed
  description TEXT NOT NULL, -- What the requester needs
  budget_range TEXT, -- Expected budget range
  
  -- Terms and guarantees
  introduction_fee REAL DEFAULT 0.0, -- Amount connector wants for introduction
  has_guarantee BOOLEAN DEFAULT false,
  guarantee_terms TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'requested' CHECK (status IN (
    'requested',     -- Initial request
    'connector_approved', -- Connector agreed to make introduction
    'contact_invited',    -- Contact has been invited to platform
    'contact_approved',   -- Contact agreed to be introduced
    'introduction_made',  -- Introduction completed
    'connection_successful', -- Connection led to business
    'payment_due',        -- Payment should be processed
    'completed',          -- All payments processed
    'declined',           -- Declined at any stage
    'expired'             -- Request expired
  )),
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT (datetime('now', '+14 days')),
  completed_at DATETIME,
  
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (connector_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  FOREIGN KEY (connectee_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (skill_id) REFERENCES skills(id)
);

-- Transactions table - Payment tracking and fee distribution
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referral_id INTEGER NOT NULL,
  
  -- Transaction details
  total_amount REAL NOT NULL,
  connector_share REAL NOT NULL,   -- 50% to connector
  platform_share REAL NOT NULL,   -- 10% to platform
  connectee_share REAL NOT NULL,   -- 30% to connectee (remainder stays with parties)
  
  -- Payment status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Payment integration (Stripe, PayPal, etc.)
  external_transaction_id TEXT,
  payment_method TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  
  FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE
);

-- Messages table - Communication between parties during referral process
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referral_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  
  -- Message content
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN (
    'general', 'status_update', 'system_notification'
  )),
  
  -- Read status
  read_by_requester BOOLEAN DEFAULT false,
  read_by_connector BOOLEAN DEFAULT false,
  read_by_connectee BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_score ON users(network_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_visibility ON users(profile_visibility);

CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_platform_user ON contacts(platform_user_id);

CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_requester ON referrals(requester_id);
CREATE INDEX IF NOT EXISTS idx_referrals_connector ON referrals(connector_id);
CREATE INDEX IF NOT EXISTS idx_referrals_skill ON referrals(skill_id);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

CREATE INDEX IF NOT EXISTS idx_transactions_referral ON transactions(referral_id);
CREATE INDEX IF NOT EXISTS idx_messages_referral ON messages(referral_id);