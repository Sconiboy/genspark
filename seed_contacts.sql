-- Additional demo data to make contact discovery more interesting
-- Add more demo users with matching emails for discovery testing

-- Add more demo users
INSERT OR IGNORE INTO users (email, name, password_hash, bio, profile_visibility, score_visibility, network_score, successful_connections, total_earnings, email_verified) VALUES 
  ('michael.smith@techcorp.com', 'Michael Smith', 'demo_hash_6', 'Former Tesla executive, now angel investor focusing on clean energy startups.', 'public', 'public', 92, 18, 45000.0, 1),
  ('sarah.wilson@goldmansachs.com', 'Sarah Wilson', 'demo_hash_7', 'Managing Director at Goldman Sachs, specializing in tech IPOs and growth capital.', 'searchable', 'public', 88, 14, 38000.0, 1),
  ('david.chen@netflix.com', 'David Chen', 'demo_hash_8', 'Netflix VP of Content Strategy, former Hollywood producer with A-list connections.', 'public', 'private', 95, 22, 67000.0, 1),
  ('lisa.rodriguez@blackrock.com', 'Lisa Rodriguez', 'demo_hash_9', 'BlackRock portfolio manager, $2B+ in assets under management.', 'searchable', 'public', 87, 16, 41000.0, 1),
  ('james.wilson@apple.com', 'James Wilson', 'demo_hash_10', 'Apple Senior Director, former SpaceX engineering lead.', 'public', 'public', 90, 15, 33000.0, 1);

-- Add more skills
INSERT OR IGNORE INTO skills (name, category, description) VALUES 
  ('Clean Energy', 'investing', 'Renewable energy and sustainability investments'),
  ('IPO Advisory', 'services', 'Public offering and capital markets advisory'),
  ('Content Strategy', 'celebrity', 'Media and entertainment content development'),
  ('Asset Management', 'investing', 'Large-scale portfolio and fund management'),
  ('Product Engineering', 'technology', 'Consumer product development and engineering');

-- Assign skills to new demo users
INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency_level) VALUES
  -- Michael Smith - Clean energy investor
  (4, 1, 5), -- Software Development
  (4, 6, 5), -- Angel Investing  
  (4, 11, 5), -- Clean Energy
  
  -- Sarah Wilson - Goldman Sachs MD
  (5, 7, 5), -- Venture Capital
  (5, 12, 5), -- IPO Advisory
  (5, 21, 5), -- Investor Introductions
  
  -- David Chen - Netflix VP
  (6, 17, 5), -- Media/Entertainment
  (6, 13, 5), -- Content Strategy
  (6, 20, 5), -- High Net Worth
  
  -- Lisa Rodriguez - BlackRock
  (7, 9, 5), -- Cryptocurrency
  (7, 10, 5), -- Private Equity
  (7, 14, 5), -- Asset Management
  
  -- James Wilson - Apple
  (8, 1, 5), -- Software Development
  (8, 15, 5), -- Product Engineering
  (8, 4, 4); -- DevOps/Cloud