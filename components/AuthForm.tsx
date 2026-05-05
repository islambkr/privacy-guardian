'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { saveSession } from '@/lib/session';
import styles from './AuthForm.module.css';

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      if (!fullName) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: fullName } },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError('Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError('Account created! Please check your email to confirm your account before continuing.');
        setLoading(false);
        return;
      }

      saveSession({ id: userId, name: fullName, email });
      router.push('/platforms');
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError('Failed to log in. Please try again.');
        setLoading(false);
        return;
      }

      const name = (data.user.user_metadata?.name as string) || 'User';
      saveSession({ id: userId, name, email });
      router.push('/home');
    }

    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Privacy Guardian</h1>
        <p className={styles.subtitle}>
          Monitor and protect your privacy across social platforms
        </p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.active : ''}`}
            onClick={() => setMode('login')}
          >
            Log In
          </button>
          <button
            className={`${styles.tab} ${mode === 'signup' ? styles.active : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <div className={styles.formContainer}>
          {mode === 'signup' && (
            <div className={styles.field}>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submitButton} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
