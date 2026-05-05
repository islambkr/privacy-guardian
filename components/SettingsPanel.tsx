'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession, clearSession, saveSession } from '@/lib/session';
import { User } from '@/types';
import styles from './SettingsPanel.module.css';

export default function SettingsPanel() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [privacyAlerts, setPrivacyAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push('/');
      return;
    }
    setUser(session);
    setEditName(session.name);
    setEditEmail(session.email);
    loadNotificationSettings(session.id);
  }, [router]);

  const loadNotificationSettings = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        setPrivacyAlerts(data.privacy_alerts_enabled);
        setWeeklyDigest(data.weekly_digest_enabled);
      }
    } catch (err) {
      console.error('Error loading notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = () => {
    if (!editName || !editEmail) {
      setError('Name and email cannot be empty');
      return;
    }

    const updatedUser: User = {
      id: user!.id,
      name: editName,
      email: editEmail,
    };
    saveSession(updatedUser);
    setUser(updatedUser);
    setEditing(false);
    setError('');
  };

  const handleTogglePrivacyAlerts = async () => {
    const newValue = !privacyAlerts;
    setPrivacyAlerts(newValue);

    try {
      await supabase
        .from('notification_settings')
        .update({ privacy_alerts_enabled: newValue })
        .eq('user_id', user!.id);
    } catch (err) {
      console.error('Error updating settings:', err);
      setPrivacyAlerts(!newValue);
    }
  };

  const handleToggleWeeklyDigest = async () => {
    const newValue = !weeklyDigest;
    setWeeklyDigest(newValue);

    try {
      await supabase
        .from('notification_settings')
        .update({ weekly_digest_enabled: newValue })
        .eq('user_id', user!.id);
    } catch (err) {
      console.error('Error updating settings:', err);
      setWeeklyDigest(!newValue);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    try {
      await supabase.from('app_user').delete().eq('user_id', user!.id);
      clearSession();
      router.push('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account');
    }
  };

  if (loading || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/home" className={styles.backButton}>
          ← Back
        </Link>
        <h1 className={styles.title}>Settings</h1>
      </div>

      <div className={styles.content}>
        {/* Profile Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile</h2>
          <div className={styles.profileCard}>
            <div className={styles.avatar}>{initials}</div>
            {!editing ? (
              <div className={styles.profileInfo}>
                <div className={styles.profileField}>
                  <span className={styles.label}>Name</span>
                  <span className={styles.value}>{user.name}</span>
                </div>
                <div className={styles.profileField}>
                  <span className={styles.label}>Email</span>
                  <span className={styles.value}>{user.email}</span>
                </div>
                <button
                  className={styles.editButton}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className={styles.editForm}>
                <div className={styles.formField}>
                  <label>Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formField}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className={styles.input}
                  />
                </div>
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.buttonGroup}>
                  <button
                    className={styles.saveButton}
                    onClick={handleSaveProfile}
                  >
                    Save
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Notifications Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notifications</h2>
          <div className={styles.notificationRow}>
            <div className={styles.notificationContent}>
              <h3>Privacy Alerts</h3>
              <p>
                Get notified when platforms update their privacy policies
              </p>
            </div>
            <div className={styles.toggle}>
              <input
                type="checkbox"
                id="privacy-alerts"
                checked={privacyAlerts}
                onChange={handleTogglePrivacyAlerts}
              />
              <label htmlFor="privacy-alerts"></label>
            </div>
          </div>

          <div className={styles.notificationRow}>
            <div className={styles.notificationContent}>
              <h3>Weekly Digest</h3>
              <p>
                Receive a weekly summary of privacy changes
              </p>
            </div>
            <div className={styles.toggle}>
              <input
                type="checkbox"
                id="weekly-digest"
                checked={weeklyDigest}
                onChange={handleToggleWeeklyDigest}
              />
              <label htmlFor="weekly-digest"></label>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <div className={styles.accountActions}>
            <button className={styles.logoutButton} onClick={handleLogout}>
              Log Out
            </button>
            <button
              className={styles.deleteButton}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Delete Account</h3>
            <p>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.confirmDeleteButton}
                onClick={handleDeleteAccount}
              >
                Delete
              </button>
              <button
                className={styles.cancelDeleteButton}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
