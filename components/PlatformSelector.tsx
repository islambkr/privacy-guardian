'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import styles from './PlatformSelector.module.css';

const PLATFORMS = [
  { id: 1, name: 'Snapchat', icon: '👻' },
  { id: 2, name: 'Facebook', icon: 'f' },
  { id: 3, name: 'Instagram', icon: '📷' },
];

export default function PlatformSelector() {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const togglePlatform = (platformId: number) => {
    setSelected((prev) => {
      if (prev.includes(platformId)) {
        return prev.filter((id) => id !== platformId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, platformId];
    });
  };

  const handleContinue = async () => {
    if (selected.length === 0) {
      setError('Please select at least 1 platform');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const session = getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        setError('Your session has expired. Please sign in again.');
        setLoading(false);
        router.push('/');
        return;
      }

      const { error: insertError } = await supabase.from('app_user').insert([
        {
          user_id: session.id,
          name: session.name,
          email: session.email,
        },
      ]);

      if (insertError && insertError.code !== '23505') {
        console.error('[platforms] app_user insert failed:', insertError);
        throw insertError;
      }

      for (const platformId of selected) {
        const { error: platformError } = await supabase.from('user_platform').insert([
          {
            user_id: session.id,
            platform_id: platformId,
            is_enabled: true,
          },
        ]);
        if (platformError && platformError.code !== '23505') {
          console.error(`[platforms] user_platform insert failed for platform ${platformId}:`, platformError);
          throw platformError;
        }
      }

      const { error: settingsError } = await supabase
        .from('notification_settings')
        .insert([
          {
            user_id: session.id,
            privacy_alerts_enabled: true,
            weekly_digest_enabled: false,
          },
        ]);

      if (settingsError && settingsError.code !== '23505') {
        console.error('[platforms] notification_settings insert failed:', settingsError);
        throw settingsError;
      }

      router.push('/home');
    } catch (err) {
      console.error('Error saving platforms:', err);
      setError('Failed to save platforms. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Choose your platforms</h1>
        <p className={styles.subtitle}>Select 1 to 3 platforms to monitor</p>

        <div className={styles.platformGrid}>
          {PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className={`${styles.platformCard} ${
                selected.includes(platform.id) ? styles.selected : ''
              }`}
              onClick={() => togglePlatform(platform.id)}
            >
              <div className={styles.iconArea}>{platform.icon}</div>
              <h3 className={styles.platformName}>{platform.name}</h3>
              {selected.includes(platform.id) && (
                <div className={styles.checkmark}>✓</div>
              )}
            </div>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          className={styles.continueButton}
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}
