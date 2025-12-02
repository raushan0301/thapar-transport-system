# 🔧 FIX CONSTRAINT WITH EXISTING DATA

**Error:** `"check constraint is violated by some row"`

**Problem:** There's already data in the table that doesn't match the new constraint.

---

## 🎯 **RUN THESE SQL COMMANDS IN ORDER:**

### **Step 1: Check existing values**
```sql
SELECT DISTINCT routed_to_authority 
FROM transport_requests 
WHERE routed_to_authority IS NOT NULL;
```

**This will show you what values currently exist.**

---

### **Step 2: Clean up invalid data**
```sql
UPDATE transport_requests 
SET routed_to_authority = NULL 
WHERE routed_to_authority IS NOT NULL 
  AND routed_to_authority NOT IN ('REGISTRAR', 'DIRECTOR', 'DEPUTY_DIRECTOR', 'DEAN');
```

**This sets any invalid values to NULL.**

---

### **Step 3: Drop old constraint**
```sql
ALTER TABLE transport_requests 
DROP CONSTRAINT IF EXISTS transport_requests_routed_to_authority_check;
```

---

### **Step 4: Add new constraint**
```sql
ALTER TABLE transport_requests 
ADD CONSTRAINT transport_requests_routed_to_authority_check 
CHECK (
  routed_to_authority IS NULL 
  OR routed_to_authority IN ('REGISTRAR', 'DIRECTOR', 'DEPUTY_DIRECTOR', 'DEAN')
);
```

---

## ✅ **AFTER RUNNING ALL STEPS:**

1. Refresh browser
2. Try "Route to Authority"
3. Should work! ✅

---

## 🔍 **WHAT HAPPENED:**

The table probably has rows with:
- Empty strings `''`
- Lowercase values `'dean'`
- Different values

The UPDATE statement cleans these up before adding the constraint.

---

**Run each SQL command one by one in Supabase SQL Editor!** 🎯
