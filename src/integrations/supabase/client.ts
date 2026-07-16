import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Clear stale localStorage tokens from old/paused Supabase projects.
// If any stored auth key references a different project ID, remove it
// so the browser never tries to reach the old (unresolvable) host.
if (SUPABASE_URL) {
  const currentProjectId = new URL(SUPABASE_URL).hostname.split('.')[0];
  Object.keys(localStorage)
    .filter((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))
    .forEach((key) => {
      // key format: sb-<project-id>-auth-token
      const storedProjectId = key.replace(/^sb-/, '').replace(/-auth-token$/, '');
      if (storedProjectId !== currentProjectId) {
        console.warn(`🧹 Clearing stale session for old project: ${storedProjectId}`);
        localStorage.removeItem(key);
      }
    });
}

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ Missing Supabase credentials!', {
    url: SUPABASE_URL,
    key: SUPABASE_PUBLISHABLE_KEY
  });
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});