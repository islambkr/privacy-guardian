export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Platform {
  platform_id: number;
  name: string;
}

export interface UserPlatform {
  user_id: string;
  platform_id: number;
  is_enabled: boolean;
}

export interface Alert {
  alert_id: number;
  platform_id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface NotificationSettings {
  user_id: string;
  privacy_alerts_enabled: boolean;
  weekly_digest_enabled: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
