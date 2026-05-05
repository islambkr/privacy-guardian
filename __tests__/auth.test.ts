import {
  saveSession,
  getSession,
  clearSession,
  isLoggedIn,
} from '@/lib/session';
import { User } from '@/types';

describe('Session Helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveSession', () => {
    it('should correctly write to localStorage', () => {
      const user: User = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      saveSession(user);

      const stored = localStorage.getItem('privacy_guardian_session');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe('123');
      expect(parsed.name).toBe('John Doe');
      expect(parsed.email).toBe('john@example.com');
    });
  });

  describe('getSession', () => {
    it('should return null when nothing is stored', () => {
      const result = getSession();
      expect(result).toBeNull();
    });

    it('should return the saved user after saveSession', () => {
      const user: User = {
        id: '456',
        name: 'Jane Smith',
        email: 'jane@example.com',
      };

      saveSession(user);
      const retrieved = getSession();

      expect(retrieved).toEqual(user);
    });
  });

  describe('clearSession', () => {
    it('should remove the session', () => {
      const user: User = {
        id: '789',
        name: 'Test User',
        email: 'test@example.com',
      };

      saveSession(user);
      expect(getSession()).not.toBeNull();

      clearSession();
      expect(getSession()).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return false when no session exists', () => {
      expect(isLoggedIn()).toBe(false);
    });

    it('should return true when session exists', () => {
      const user: User = {
        id: 'abc',
        name: 'Active User',
        email: 'active@example.com',
      };

      saveSession(user);
      expect(isLoggedIn()).toBe(true);
    });

    it('should return false after clearing session', () => {
      const user: User = {
        id: 'def',
        name: 'Removed User',
        email: 'removed@example.com',
      };

      saveSession(user);
      expect(isLoggedIn()).toBe(true);

      clearSession();
      expect(isLoggedIn()).toBe(false);
    });
  });
});
