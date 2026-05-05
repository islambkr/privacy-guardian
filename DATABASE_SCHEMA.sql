-- Privacy Guardian Database Schema

CREATE TABLE platform (
  platform_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE app_user (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_platform (
  user_id UUID REFERENCES app_user(user_id) ON DELETE CASCADE,
  platform_id INT REFERENCES platform(platform_id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, platform_id)
);

CREATE TABLE alert (
  alert_id SERIAL PRIMARY KEY,
  platform_id INT REFERENCES platform(platform_id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_settings (
  user_id UUID PRIMARY KEY REFERENCES app_user(user_id) ON DELETE CASCADE,
  privacy_alerts_enabled BOOLEAN DEFAULT TRUE,
  weekly_digest_enabled BOOLEAN DEFAULT FALSE
);

-- Seed platforms
INSERT INTO platform (name) VALUES ('Snapchat'), ('Facebook'), ('Instagram');

-- Seed 3 hardcoded alerts (one per platform) for demo
INSERT INTO alert (platform_id, title, description, created_at) VALUES
(1, 'Snapchat Updated Data Sharing Policy', 
 'Snapchat revised its data sharing agreement with third-party advertisers in March 2025.', 
 NOW()),
(2, 'Facebook Expands Facial Recognition Use', 
 'Meta announced expanded use of facial recognition in Facebook features as of Q1 2025.', 
 NOW()),
(3, 'Instagram Adds New Data Collection for AI Training', 
 'Instagram updated its terms to allow user content to be used for AI model training.', 
 NOW());
