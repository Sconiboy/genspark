-- Simplified seed data for testing

-- Insert basic skills
INSERT OR IGNORE INTO skills (name, category, description) VALUES 
  ('Software Development', 'technology', 'Web and mobile development'),
  ('Angel Investing', 'investing', 'Early stage investments'),
  ('Marketing Strategy', 'services', 'Marketing and PR services'),
  ('Entertainment Connections', 'celebrity', 'Hollywood connections'),
  ('Investor Introductions', 'introductions', 'Startup-investor connections');

-- Insert demo users
INSERT OR IGNORE INTO users (email, name, password_hash, bio, profile_visibility, score_visibility, network_score, successful_connections, total_earnings, email_verified) VALUES 
  ('alice@example.com', 'Alice Johnson', 'demo_hash_1', 'Tech entrepreneur in Silicon Valley', 'public', 'public', 85, 12, 25000.0, 1),
  ('bob@example.com', 'Bob Smith', 'demo_hash_2', 'Investment banker turned VC', 'searchable', 'private', 72, 8, 15000.0, 1),
  ('charlie@example.com', 'Charlie Brown', 'demo_hash_3', 'Entertainment industry executive', 'searchable', 'public', 91, 15, 35000.0, 1);