-- Simple additional demo users for contact discovery
INSERT OR IGNORE INTO users (email, name, password_hash, bio, profile_visibility, score_visibility, network_score, successful_connections, total_earnings, email_verified) VALUES 
  ('michael.smith@techcorp.com', 'Michael Smith', 'demo_hash_6', 'Former Tesla executive, now angel investor focusing on clean energy startups.', 'public', 'public', 92, 18, 45000.0, 1),
  ('sarah.wilson@goldmansachs.com', 'Sarah Wilson', 'demo_hash_7', 'Managing Director at Goldman Sachs, specializing in tech IPOs.', 'searchable', 'public', 88, 14, 38000.0, 1),
  ('david.chen@netflix.com', 'David Chen', 'demo_hash_8', 'Netflix VP of Content Strategy, Hollywood connections.', 'public', 'private', 95, 22, 67000.0, 1);