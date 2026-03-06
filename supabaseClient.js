const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jbnlncweknkqjhuuqfaw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_qJ6-dUpGNWpRR-Eei6IQ7w_18lxcW2u';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;