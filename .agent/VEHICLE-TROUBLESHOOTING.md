# 🔧 VEHICLE MANAGEMENT - TROUBLESHOOTING GUIDE

**Issue:** Failed to add vehicle  
**Date:** December 2, 2025, 11:38 AM

---

## 🔍 COMMON ISSUES & FIXES

### **Issue 1: RLS Policy Error**
**Error:** "new row violates row-level security policy"

**Fix:** Run this SQL in Supabase:
```sql
-- Drop and recreate vehicles table with correct RLS policies
DROP TABLE IF EXISTS vehicles CASCADE;

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  capacity INTEGER,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vehicles"
  ON vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can insert vehicles"
  ON vehicles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update vehicles"
  ON vehicles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete vehicles"
  ON vehicles FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

---

### **Issue 2: User Not Admin**
**Error:** Policy check fails

**Fix:** Make sure your user has admin role:
```sql
-- Check your user role
SELECT id, email, role FROM users WHERE email = 'your.email@example.com';

-- If role is not 'admin', update it:
UPDATE users SET role = 'admin' WHERE email = 'your.email@example.com';
```

---

### **Issue 3: Missing Columns**
**Error:** "column does not exist"

**Fix:** The SQL above recreates the table with all required columns.

---

### **Issue 4: Duplicate Vehicle Number**
**Error:** "duplicate key value violates unique constraint"

**Fix:** Use a different vehicle number or delete the existing one:
```sql
-- Check existing vehicles
SELECT * FROM vehicles WHERE vehicle_number = 'PB-01-AB-1234';

-- Delete if needed
DELETE FROM vehicles WHERE vehicle_number = 'PB-01-AB-1234';
```

---

## 🧪 TESTING STEPS

### **1. Check Table Structure:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vehicles';
```

**Expected columns:**
- id (uuid)
- vehicle_number (varchar)
- vehicle_type (varchar)
- model (varchar)
- capacity (integer)
- is_available (boolean)
- created_at (timestamp)
- updated_at (timestamp)

### **2. Check RLS Policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'vehicles';
```

**Expected policies:**
- Anyone can read vehicles
- Only admins can insert vehicles
- Only admins can update vehicles
- Only admins can delete vehicles

### **3. Check Your User Role:**
```sql
SELECT id, email, role FROM users WHERE id = auth.uid();
```

**Expected:** role = 'admin'

### **4. Test Insert Manually:**
```sql
INSERT INTO vehicles (vehicle_number, vehicle_type, model, capacity)
VALUES ('TEST-123', 'Car', 'Test Model', 5);
```

If this works, the issue is in the frontend code.  
If this fails, the issue is with RLS policies.

---

## 🔧 QUICK FIX (RECOMMENDED)

**Run this complete script in Supabase SQL Editor:**

```sql
-- Complete fix for vehicles table
DROP TABLE IF EXISTS vehicles CASCADE;

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  capacity INTEGER,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vehicles"
  ON vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can insert vehicles"
  ON vehicles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update vehicles"
  ON vehicles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete vehicles"
  ON vehicles FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert sample data
INSERT INTO vehicles (vehicle_number, vehicle_type, model, capacity, is_available)
VALUES 
  ('PB-01-AB-1234', 'Car', 'Toyota Innova', 7, true),
  ('PB-02-CD-5678', 'Bus', 'Tata Starbus', 40, true);
```

---

## 📱 FRONTEND DEBUGGING

### **Check Browser Console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Try to add a vehicle
4. Look for error messages

**Common errors:**
- "new row violates row-level security policy" → RLS issue
- "duplicate key value" → Vehicle number already exists
- "column does not exist" → Table structure issue
- "permission denied" → User not admin

### **Check Network Tab:**
1. Open DevTools (F12)
2. Go to Network tab
3. Try to add a vehicle
4. Look for the POST request to Supabase
5. Check the response

---

## ✅ VERIFICATION

After running the SQL fix:

1. **Refresh the page**
2. **Try to add a vehicle:**
   - Number: "TEST-999"
   - Type: "Car"
   - Model: "Test"
   - Capacity: "5"
3. **Click "Add Vehicle"**
4. **Should see:** "Vehicle added successfully!" ✅

---

## 📝 FILES CREATED

I've created a SQL fix file:
- `/database/migrations/fix_vehicles_table.sql`

**To apply:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy the SQL from the file
4. Click "Run"

---

## 🆘 STILL NOT WORKING?

**Please provide:**
1. Error message from browser console
2. Error message from Network tab
3. Your user email
4. Screenshot of the error

**I'll help you debug further!**

---

**Most likely fix:** Run the SQL script above to recreate the vehicles table with correct RLS policies.
