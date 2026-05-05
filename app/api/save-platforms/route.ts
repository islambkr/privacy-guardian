import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, platformIds } = await request.json();

    if (!userId || !name || !email || !Array.isArray(platformIds) || platformIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[save-platforms] SUPABASE_SERVICE_ROLE_KEY is not set');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: userError } = await admin
      .from('app_user')
      .insert([{ user_id: userId, name, email }]);
    if (userError && userError.code !== '23505') {
      console.error('[save-platforms] app_user insert failed:', userError);
      return NextResponse.json({ error: 'Failed to save user profile' }, { status: 500 });
    }

    for (const platformId of platformIds) {
      const { error: platformError } = await admin
        .from('user_platform')
        .insert([{ user_id: userId, platform_id: platformId, is_enabled: true }]);
      if (platformError && platformError.code !== '23505') {
        console.error('[save-platforms] user_platform insert failed:', platformError);
        return NextResponse.json({ error: 'Failed to save platform selection' }, { status: 500 });
      }
    }

    const { error: settingsError } = await admin
      .from('notification_settings')
      .insert([{ user_id: userId, privacy_alerts_enabled: true, weekly_digest_enabled: false }]);
    if (settingsError && settingsError.code !== '23505') {
      console.error('[save-platforms] notification_settings insert failed:', settingsError);
      return NextResponse.json({ error: 'Failed to save notification settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[save-platforms] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
