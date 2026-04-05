const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { error } = await supabase.from('users').update({ avatar_url: 'test' }).eq('id', 'nonexistent');
  console.log(error);
}
test();
