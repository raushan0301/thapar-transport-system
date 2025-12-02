# 🔧 FIX HEAD SELECTOR - SHOW ALL HEADS

**Issue:** User form doesn't show the heads you added in Head Management

**Root Cause:** The `getPredefinedHeads()` function queries `predefined_heads` table, but heads are stored in `users` table with `role = 'head'`

---

## ✅ **FIX THE SERVICE FUNCTION:**

Update `/client/src/services/requestService.js`:

### **Find this function (around line 100):**
```javascript
export const getPredefinedHeads = async () => {
  try {
    const { data, error } = await supabase
      .from('predefined_heads')
      .select('*, user:users(id, full_name, email, department)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching heads:', error);
    return { data: null, error };
  }
};
```

### **Replace with:**
```javascript
export const getPredefinedHeads = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, department, phone')
      .eq('role', 'head')
      .order('full_name', { ascending: true });

    if (error) throw error;
    
    // Transform data to match expected format
    const transformedData = data?.map(head => ({
      user: head
    })) || [];
    
    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching heads:', error);
    return { data: null, error };
  }
};
```

---

## 🎯 **WHAT THIS DOES:**

**Before:**
- Queries `predefined_heads` table (might not exist or be empty)
- Doesn't show heads added in Head Management

**After:**
- Queries `users` table where `role = 'head'`
- Shows all heads you added in Head Management
- Transforms data to match expected format

---

## ✅ **AFTER THE FIX:**

1. **Refresh browser**
2. **Go to New Request**
3. **Click "Predefined Head" radio button**
4. **Dropdown should show all heads!** ✅

---

## 📊 **EXPECTED RESULT:**

Dropdown will show:
```
Select a head
  - Jaanvi - CSED
  - John Doe - Mechanical
  - Jane Smith - Electrical
  (all heads from Head Management)
```

---

**I'll update the code now!** 🚀
