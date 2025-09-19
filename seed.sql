-- Seed data for networking app development and testing

-- Insert default skills/categories
INSERT OR IGNORE INTO skills (name, category, description) VALUES 
  -- Technology
  ('Software Development', 'technology', 'Web, mobile, and desktop application development'),
  ('AI/Machine Learning', 'technology', 'Artificial intelligence and machine learning expertise'),
  ('Cybersecurity', 'technology', 'Information security and cyber defense'),
  ('DevOps/Cloud', 'technology', 'Cloud infrastructure and deployment automation'),
  ('Data Science', 'technology', 'Data analysis, visualization, and insights'),
  
  -- Business & Finance
  ('Angel Investing', 'investing', 'Early stage startup investments'),
  ('Venture Capital', 'investing', 'Growth stage venture investments'),
  ('Real Estate', 'investing', 'Property investment and development'),
  ('Cryptocurrency', 'investing', 'Digital asset investments and trading'),
  ('Private Equity', 'investing', 'Private equity and buyout expertise'),
  
  -- Professional Services
  ('Legal Services', 'services', 'Legal counsel and representation'),
  ('Marketing/PR', 'services', 'Marketing strategy and public relations'),
  ('Business Consulting', 'services', 'Strategic business advisory'),
  ('Accounting/Tax', 'services', 'Financial accounting and tax services'),
  ('Executive Recruiting', 'services', 'C-level and executive hiring'),
  
  -- Industry Connections
  ('Media/Entertainment', 'celebrity', 'Entertainment industry connections'),
  ('Sports Industry', 'celebrity', 'Professional sports connections'),
  ('Politics/Government', 'celebrity', 'Government and political connections'),
  ('High Net Worth', 'celebrity', 'Ultra wealthy individual connections'),
  
  -- Business Introductions
  ('Investor Introductions', 'introductions', 'Connecting startups with investors'),
  ('Partnership Deals', 'introductions', 'Strategic business partnerships'),
  ('Board Positions', 'introductions', 'Corporate board opportunities'),
  ('Speaking Engagements', 'introductions', 'Conference and event speaking'),
  ('Mentor Connections', 'introductions', 'Industry mentorship opportunities');

-- Insert demo users (for testing purposes)
INSERT OR IGNORE INTO users (email, name, password_hash, bio, profile_visibility, score_visibility, network_score, successful_connections, total_earnings, email_verified) VALUES 
  ('alice@example.com', 'Alice Johnson', 'demo_hash_1', 'Tech entrepreneur with 15+ years in Silicon Valley. Former VP at major tech companies.', 'public', 'public', 85, 12, 25000.0, true),
  ('bob@example.com', 'Bob Smith', 'demo_hash_2', 'Investment banker turned VC. Focus on fintech and B2B SaaS.', 'searchable', 'private', 72, 8, 15000.0, true),
  ('charlie@example.com', 'Charlie Brown', 'demo_hash_3', 'Entertainment industry executive. 20+ years in Hollywood.', 'searchable', 'public', 91, 15, 35000.0, true),
  ('diana@example.com', 'Diana Prince', 'demo_hash_4', 'Serial entrepreneur and angel investor. MIT background.', 'public', 'public', 78, 10, 20000.0, true),
  ('eve@example.com', 'Eve Davis', 'demo_hash_5', 'Marketing strategist for Fortune 500 companies.', 'private', 'private', 45, 3, 5000.0, true);

-- Assign skills to demo users
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level) VALUES
  -- Alice Johnson - Tech entrepreneur
  (1, 1, 5), -- Software Development
  (1, 2, 4), -- AI/ML
  (1, 6, 3), -- Angel Investing
  (1, 21, 4), -- Investor Introductions
  
  -- Bob Smith - VC
  (2, 6, 5), -- Angel Investing
  (2, 7, 5), -- Venture Capital
  (2, 13, 4), -- Business Consulting
  (2, 21, 5), -- Investor Introductions
  
  -- Charlie Brown - Entertainment
  (3, 17, 5), -- Media/Entertainment
  (3, 12, 4), -- Marketing/PR
  (3, 24, 5), -- Speaking Engagements
  (3, 20, 4), -- High Net Worth
  
  -- Diana Prince - Serial entrepreneur
  (4, 1, 4), -- Software Development
  (4, 6, 5), -- Angel Investing
  (4, 13, 5), -- Business Consulting
  (4, 22, 4), -- Partnership Deals
  
  -- Eve Davis - Marketing
  (5, 12, 5), -- Marketing/PR
  (5, 13, 3), -- Business Consulting
  (5, 24, 3); -- Speaking Engagements

-- Add some demo contacts (private to each user)
INSERT OR IGNORE INTO contacts (owner_id, name, email, company, title, notes) VALUES
  -- Alice's contacts
  (1, 'Sarah Wilson', 'sarah@techcorp.com', 'TechCorp Inc', 'CTO', 'Former colleague, great for technical advisory roles'),
  (1, 'Mike Chen', 'mike@startupxyz.com', 'StartupXYZ', 'CEO', 'Young entrepreneur, looking for Series A funding'),
  
  -- Bob's contacts
  (2, 'Jennifer Lee', 'jen@megafund.com', 'MegaFund VC', 'Partner', 'Top tier VC partner, focuses on enterprise software'),
  (2, 'David Rodriguez', 'david@fintech.co', 'FinTech Solutions', 'Founder', 'Fintech founder seeking growth capital'),
  
  -- Charlie's contacts
  (3, 'Tom Hanks Jr', 'tom@hollywood.com', 'Major Studio', 'Producer', 'Award-winning producer, great industry connections'),
  (3, 'Lisa Martinez', 'lisa@talent.agency', 'Elite Talent', 'Agent', 'Top talent agent, represents A-list celebrities');

-- Assign skills to contacts
INSERT OR IGNORE INTO contact_skills (contact_id, skill_id, notes) VALUES
  -- Sarah Wilson (Alice's contact)
  (1, 1, 'Expert in distributed systems and cloud architecture'),
  (1, 4, 'DevOps expert with major cloud platforms'),
  
  -- Mike Chen (Alice's contact)
  (2, 1, 'Full-stack development background'),
  (2, 13, 'Seeking business strategy guidance for scaling'),
  
  -- Jennifer Lee (Bob's contact)
  (3, 7, 'Lead partner for B2B SaaS investments'),
  (3, 21, 'Connected to top startup ecosystem'),
  
  -- David Rodriguez (Bob's contact)
  (4, 9, 'Cryptocurrency and DeFi expertise'),
  (4, 13, 'Scaling fintech operations'),
  
  -- Tom Hanks Jr (Charlie's contact)
  (5, 17, 'Major film and TV production'),
  (5, 20, 'Connected to Hollywood elite'),
  
  -- Lisa Martinez (Charlie's contact)
  (6, 17, 'Talent representation and career management'),
  (6, 24, 'Speaking and appearance bookings');

-- Create some demo referral requests
INSERT OR IGNORE INTO referrals (requester_id, connector_id, contact_id, skill_id, description, introduction_fee, status) VALUES
  (2, 1, 1, 1, 'Need a senior CTO for our B2B SaaS startup. Looking for someone with distributed systems experience.', 5000.0, 'requested'),
  (4, 3, 5, 17, 'Seeking producer for documentary film project about tech entrepreneurship.', 2500.0, 'connector_approved'),
  (5, 2, 3, 7, 'Early-stage startup needs Series A funding. $10M round for marketing automation platform.', 7500.0, 'requested');

-- Add some demo messages
INSERT OR IGNORE INTO messages (referral_id, sender_id, message, message_type) VALUES
  (1, 2, 'Hi Alice, I heard you know some great CTOs in the Valley. Would love an intro to someone for our startup.', 'general'),
  (1, 1, 'Sure Bob! Sarah Wilson might be perfect. She\'s currently between roles and has amazing distributed systems experience.', 'general'),
  (2, 4, 'Charlie, we\'re working on a documentary and need a Hollywood producer. Can you help?', 'general'),
  (2, 3, 'Absolutely! Tom would be perfect for this. Let me reach out to him first.', 'general');

-- Demo invitations (pending invites)
INSERT OR IGNORE INTO invitations (inviter_id, invitee_email, invitee_name, message, recommended_skills, invitation_token) VALUES
  (1, 'sarah@techcorp.com', 'Sarah Wilson', 'Hi Sarah! I recommended you for some great opportunities on this new networking platform.', '[1,4]', 'inv_demo_token_1'),
  (3, 'tom@hollywood.com', 'Tom Hanks Jr', 'Tom, there are some interesting film projects looking for producers. Check this out!', '[17,20]', 'inv_demo_token_2');