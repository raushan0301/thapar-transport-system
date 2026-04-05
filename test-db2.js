const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function checkAttachments() {
  const { data, error } = await supabaseAdmin.from('attachments').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Error:", error);
  console.log("Recent attachments:", data);
}
checkAttachments();
