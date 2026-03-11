#!/usr/bin/env node
// small CLI for adding a local_users account (username/password) directly
// using the same hash logic as the edge function.  Intended for development
// or administrative setup; the service-role key must be available in the
// environment.

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function hashPassword(password) {
  const salt = crypto.randomBytes(16);           // 16-byte random salt
  const pwdBuf = Buffer.from(password, 'utf8');
  const combined = Buffer.concat([salt, pwdBuf]);
  const digest = crypto.createHash('sha256').update(combined).digest();
  return Buffer.concat([salt, digest]).toString('base64');
}

function usage() {
  console.log(`
Usage: node create-local-user.js --username <name> --password <pwd> [--role admin|instructeur|observateur]

Sets up a record in public.local_users (and companion tables).
The script expects SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set.
`);
  process.exit(1);
}

// very simple arg parsing
const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    const val = args[++i];
    opt[key] = val;
  }
}

if (!opt.username || !opt.password) usage();
const username = opt.username.toLowerCase();
const password = opt.password;
const role = opt.role || 'observateur';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:45321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not defined in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  try {
    // create user row
    const hash = hashPassword(password);
    const { data: user, error: userErr } = await supabase
      .from('local_users')
      .insert({ username, password_hash: hash, role })
      .select('id')
      .single();
    if (userErr) throw userErr;

    console.log('created local_users entry with id', user.id);

    // also populate profiles + user_roles if those tables exist
    await supabase.from('profiles').upsert({ user_id: user.id, username, is_active: true });
    await supabase.from('user_roles').upsert({ user_id: user.id, role });

    console.log('profile and role records created/updated');
  } catch (err) {
    console.error('error creating user:', err.message || err);
    process.exit(1);
  }
})();
