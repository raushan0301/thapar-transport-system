const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function checkCols() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // Using RPC to query if possible? No, we likely don't have it.
  // We'll use a trick: trying to insert and getting the error message.
  const { error } = await supabase
    .from('transport_requests')
    .insert({ invalid_column_to_check_schema: true });

  fs.writeFileSync(path.join(__dirname, '../schema_check.json'), JSON.stringify({ error }, null, 2));
  console.log('Schema check error obtained!');
  process.exit(0);
}

checkCols();
