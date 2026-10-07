const { createClient } = require('@supabase/supabase-js');

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'public-anon-key';

let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Supabase URL and Anon Key not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
  // Create a dummy client so the app doesn't crash on boot
  supabase = createClient('https://dummy.supabase.co', 'dummy-key');
}

module.exports = supabase;
