const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAttachments() {
  const { data, error } = await supabase.from('attachments').select('*');
  console.log("Attachments count:", data?.length);
  if (data?.length > 0) {
    console.log("Sample attachment:", data[0]);
  }
}
checkAttachments();
