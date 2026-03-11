import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost:45321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  try {
    console.log('Testing login with admin/admin2020...');

    const { data, error } = await supabase.functions.invoke('local-auth', {
      body: {
        action: 'login',
        username: 'admin',
        password: 'admin2020'
      }
    });

    if (error) {
      console.error('Login error:', error);
    } else {
      console.log('Login success:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testLogin();