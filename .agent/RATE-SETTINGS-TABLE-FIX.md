# 🔧 RATE SETTINGS TABLE - QUICK FIX

**Error:** Column "per_km_rate" does not exist  
**Cause:** Table exists with different structure  
**Solution:** Drop and recreate with correct structure

---

## ✅ QUICK FIX (RECOMMENDED)

### **Step 1: Run This SQL in Supabase**

Copy and paste this **entire script** into Supabase SQL Editor:

```sql
-- Drop existing table and recreate with correct structure
DROP TABLE IF EXISTS rate_settings CASCADE;

CREATE TABLE rate_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  per_km_rate DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  base_rate DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
  night_charge DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
  waiting_charge_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO rate_settings (per_km_rate, base_rate, night_charge, waiting_charge_per_hour)
VALUES (10.00, 500.00, 200.00, 100.00);

ALTER TABLE rate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rate settings"
  ON rate_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can update rate settings"
  ON rate_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Only admins can insert rate settings"
  ON rate_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
```

### **Step 2: Click "Run"**

That's it! The table will be created with the correct structure.

---

## 📁 SQL FILES AVAILABLE

I've created two SQL files for you:

1. **`create_rate_settings_table.sql`** - Main migration
2. **`fix_rate_settings_table.sql`** - Alternative with checks

Both do the same thing - use either one!

---

## ✅ WHAT THIS DOES

1. **Drops** existing `rate_settings` table (if exists)
2. **Creates** new table with correct columns:
   - `per_km_rate` (₹10.00)
   - `base_rate` (₹500.00)
   - `night_charge` (₹200.00)
   - `waiting_charge_per_hour` (₹100.00)
3. **Inserts** default values
4. **Enables** RLS (Row Level Security)
5. **Creates** policies (admins can edit, everyone can read)

---

## 🧪 TEST AFTER RUNNING

1. Refresh Rate Settings page
2. You should see default values loaded
3. Change a rate
4. Click "Save Settings"
5. Refresh page
6. Verify changes persisted ✅

---

## ⚠️ NOTE

**This will delete any existing data in the `rate_settings` table.**

If you had important data, let me know and I'll create a migration that preserves it.

---

**Status:** ✅ SQL Ready to Run  
**Action:** Copy SQL above → Paste in Supabase → Click "Run"  
**Result:** Rate Settings will work perfectly!
