'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import ChatInterface from '@/components/ChatInterface';
import MetricBadge from '@/components/MetricBadge';
import styles from './home.module.css';

export default function HomePage() {
  const router = useRouter();
  const [platformsMonitored, setplatformsMonitored] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [platformNames, setPlatformNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const session = getSession();
      console.log('Session:', session);

      if (!session) {
        console.log('No session, redirecting to /');
        router.push('/');
        return;
      }

      try {
        console.log('Loading data for user:', session.id);

        const { data: userPlatforms, error: platformsError } = await supabase
          .from('user_platform')
          .select('platform_id')
          .eq('user_id', session.id);

        console.log('User platforms:', userPlatforms, 'Error:', platformsError);

        const platformIds = userPlatforms?.map((up) => up.platform_id) || [];
        setplatformsMonitored(platformIds.length);

        if (platformIds.length > 0) {
          const { data: platforms, error: platformsDataError } = await supabase
            .from('platform')
            .select('name')
            .in('platform_id', platformIds);

          console.log('Platforms data:', platforms, 'Error:', platformsDataError);

          const names = platforms?.map((p) => p.name) || [];
          setPlatformNames(names);

          const { data: alerts, error: alertsError } = await supabase
            .from('alert')
            .select('alert_id')
            .in('platform_id', platformIds);

          console.log('Alerts data:', alerts, 'Error:', alertsError);

          setActiveAlerts(alerts?.length || 0);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h1 className={styles.appName}>Privacy Guardian</h1>
        <Link href="/settings" className={styles.settingsIcon}>
          ⚙️
        </Link>
      </div>

      <div className={styles.metricsRow}>
        <MetricBadge
          label="Platforms Monitored"
          value={platformsMonitored}
        />
        <MetricBadge label="Active Alerts" value={activeAlerts} />
      </div>

      <div className={styles.chatSection}>
        <h2 className={styles.sectionTitle}>Ask the Privacy Assistant</h2>
        <ChatInterface platformNames={platformNames} />
      </div>
    </div>
  );
}
