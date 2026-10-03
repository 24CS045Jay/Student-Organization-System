// ==============================================================================
// ClubSphere Auth & Database Bridge Service
// Connects UI login/registration directly to Supabase Auth & PostgreSQL Tables
// ==============================================================================

import { supabase } from './supabaseClient';

const ORG_UUID_MAP = {
  'tech': '00000000-0000-0000-0000-000000000001',
  'cult': '00000000-0000-0000-0000-000000000002',
  'sport': '00000000-0000-0000-0000-000000000003',
  'club-tech': '00000000-0000-0000-0000-000000000001',
  'club-cult': '00000000-0000-0000-0000-000000000002',
  'club-sport': '00000000-0000-0000-0000-000000000003'
};

export const authService = {
  /**
   * Performs Supabase authentication & records user entry into Supabase database
   */
  login: async ({ email, password = 'Password123!', role = 'student', orgId = 'tech', name }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const displayName = name || cleanEmail.split('@')[0].replace('.', ' ').toUpperCase();
    const targetOrgUuid = ORG_UUID_MAP[orgId] || '00000000-0000-0000-0000-000000000001';

    let authUser = null;
    let authError = null;

    try {
      // 1. Attempt Supabase Auth Sign In
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (!signInErr && signInData?.user) {
        authUser = signInData.user;
      } else {
        // If user doesn't exist, sign them up in Supabase Auth
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: displayName,
              role
            }
          }
        });

        if (signUpData?.user) {
          authUser = signUpData.user;
        } else {
          authError = signUpErr || signInErr;
        }
      }
    } catch (err) {
      authError = err;
    }

    const userId = authUser?.id || `usr-${Date.now()}`;

    // 2. Insert / Sync into Supabase Database Tables (profiles, members, audit_logs)
    if (authUser?.id) {
      try {
        // A. Profile record (linked to auth.users)
        await supabase.from('profiles').upsert([
          {
            id: authUser.id,
            full_name: displayName,
            is_platform_admin: role === 'super_admin'
          }
        ]).select();
      } catch (e) {
        console.warn('Profiles sync note:', e);
      }
    }

    try {
      // B. Club Member record
      await supabase.from('members').upsert([
        {
          org_id: targetOrgUuid,
          user_id: authUser?.id || null,
          full_name: displayName,
          email: cleanEmail,
          student_id: `23${role.slice(0, 2).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
          mailing_subscribed: true
        }
      ], { onConflict: 'org_id,email' }).select();
    } catch (e) {
      console.warn('Members sync note:', e);
    }

    try {
      // C. Audit Log entry in Database
      await supabase.from('audit_logs').insert([
        {
          org_id: targetOrgUuid,
          user_id: authUser?.id || null,
          user_role: role,
          action: 'USER_LOGIN',
          table_name: 'profiles',
          new_value: {
            email: cleanEmail,
            name: displayName,
            role,
            loginTime: new Date().toISOString()
          }
        }
      ]);
    } catch (e) {
      console.warn('Audit log note:', e);
    }

    // Return structured session
    return {
      userId,
      role,
      orgId,
      email: cleanEmail,
      name: displayName,
      isSupabaseConnected: !authError,
      authError: authError ? authError.message : null
    };
  },

  /**
   * Registers a new student / club member directly into Supabase
   */
  register: async ({ email, password = 'Password123!', name, role = 'student', orgId = 'tech', studentId }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const displayName = name || cleanEmail.split('@')[0];
    const targetOrgUuid = ORG_UUID_MAP[orgId] || '00000000-0000-0000-0000-000000000001';

    let authUser = null;
    let authError = null;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: displayName,
            role,
            student_id: studentId
          }
        }
      });
      authUser = data?.user;
      authError = error;
    } catch (err) {
      authError = err;
    }

    const userId = authUser?.id || `usr-${Date.now()}`;

    // Insert into Supabase members table
    try {
      await supabase.from('members').insert([
        {
          org_id: targetOrgUuid,
          user_id: authUser?.id || null,
          full_name: displayName,
          email: cleanEmail,
          student_id: studentId || '23CS045',
          mailing_subscribed: true
        }
      ]);

      await supabase.from('audit_logs').insert([
        {
          org_id: targetOrgUuid,
          user_id: authUser?.id || null,
          user_role: role,
          action: 'USER_REGISTERED',
          table_name: 'members',
          new_value: { email: cleanEmail, name: displayName, studentId }
        }
      ]);
    } catch (e) {
      console.warn('Database registration insert note:', e);
    }

    return {
      userId,
      role,
      orgId,
      email: cleanEmail,
      name: displayName,
      isSupabaseConnected: !authError,
      authError: authError ? authError.message : null
    };
  }
};
