# 🚨 Critical Fixes Guide - Quick Reference

**Priority:** URGENT - Fix these before any deployment  
**Estimated Time:** 4-6 hours  
**Date:** November 27, 2025

---

## 🎯 Fix Order (Do in This Sequence)

### Fix #1: Apply RLS Policies (30 minutes)
**Status:** 🔴 BLOCKER - Nothing works without this!

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire content from `database/migrations/001_fix_rls_policies.sql`
3. Paste and run in SQL Editor
4. Verify no errors
5. Test by logging in as different roles

**Verification:**
```sql
-- Run this to check policies are created
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Result:** Should see 50+ policies listed

---

### Fix #2: Dashboard Routing (45 minutes)
**Status:** 🔴 CRITICAL - Users see wrong dashboard

**File:** `client/src/routes/AppRoutes.jsx`

**Step 1:** Uncomment dashboard imports (lines 25, 30, 41, 46)
```javascript
// Change from:
//import HeadDashboard from '../pages/head/HeadDashboard';

// To:
import HeadDashboard from '../pages/head/HeadDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AuthorityDashboard from '../pages/authority/AuthorityDashboard';
import RegistrarDashboard from '../pages/registrar/RegistrarDashboard';
```

**Step 2:** Create DashboardRouter component

Add this BEFORE the `AppRoutes` component:
```javascript
const DashboardRouter = () => {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  switch (profile.role) {
    case ROLES.HEAD:
      return <HeadDashboard />;
    case ROLES.ADMIN:
      return <AdminDashboard />;
    case ROLES.DIRECTOR:
    case ROLES.DEPUTY_DIRECTOR:
    case ROLES.DEAN:
      return <AuthorityDashboard />;
    case ROLES.REGISTRAR:
      return <RegistrarDashboard />;
    case ROLES.USER:
    default:
      return <UserDashboard />;
  }
};
```

**Step 3:** Update dashboard route (replace lines 77-84)
```javascript
{/* Dashboard - Role Based */}
<Route
  path="/dashboard"
  element={
    <PrivateRoute>
      <DashboardRouter />
    </PrivateRoute>
  }
/>
```

**Test:** Log in as different roles and verify correct dashboard shows

---

### Fix #3: useEffect Dependencies (60 minutes)
**Status:** 🔴 CRITICAL - Causes bugs and warnings

**Files to Fix:**
1. `client/src/pages/user/UserDashboard.jsx`
2. `client/src/pages/user/RequestDetails.jsx`
3. `client/src/pages/admin/VehicleAssignment.jsx`
4. `client/src/pages/admin/TravelCompletion.jsx`
5. All other pages with similar patterns

**Pattern to Fix:**

**Before:**
```javascript
useEffect(() => {
  if (user?.id) {
    fetchDashboardData();
  }
}, [user]); // ❌ Missing dependency
```

**After (Option 1 - Recommended):**
```javascript
useEffect(() => {
  if (!user?.id) return;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // ... fetch logic
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchDashboardData();
}, [user?.id]); // ✅ Correct dependency
```

**After (Option 2 - If function is reused):**
```javascript
const fetchDashboardData = useCallback(async () => {
  if (!user?.id) return;
  
  try {
    setLoading(true);
    // ... fetch logic
  } catch (err) {
    console.error('Error:', err);
  } finally {
    setLoading(false);
  }
}, [user?.id]);

useEffect(() => {
  fetchDashboardData();
}, [fetchDashboardData]); // ✅ Correct
```

**Apply to all files with this pattern!**

---

### Fix #4: Error Handling for RLS (30 minutes)
**Status:** 🔴 CRITICAL - Users need clear error messages

**Create utility file:** `client/src/utils/errorHandler.js`

```javascript
import toast from 'react-hot-toast';

export const handleSupabaseError = (error, context = 'operation') => {
  console.error(`Error in ${context}:`, error);

  // Permission denied (RLS policy)
  if (error.code === '42501' || error.code === 'PGRST301') {
    toast.error('You do not have permission to perform this action. Please contact your administrator.');
    return;
  }

  // Row not found
  if (error.code === 'PGRST116') {
    toast.error('The requested data was not found.');
    return;
  }

  // Network error
  if (error.message?.includes('Failed to fetch')) {
    toast.error('Network error. Please check your internet connection.');
    return;
  }

  // Generic error
  toast.error(`Failed to ${context}. Please try again.`);
};
```

**Then update all error handling:**

**Before:**
```javascript
if (error) {
  console.error('Error:', error);
  toast.error('Failed to load data');
  return;
}
```

**After:**
```javascript
if (error) {
  handleSupabaseError(error, 'load data');
  return;
}
```

**Apply to ALL Supabase queries!**

---

### Fix #5: Profile Loading State (30 minutes)
**Status:** 🔴 CRITICAL - Prevents race conditions

**File:** `client/src/context/AuthContext.jsx`

**Problem:** Loading is set to false before profile is loaded

**Fix:** Update the `init` function (lines 24-60)

**Before:**
```javascript
async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user && mounted) {
    setUser(session.user);
    await loadProfile(session.user.id, session.user.email);
  }

  const { data: listener } = supabase.auth.onAuthStateChange(...);

  if (mounted) setLoading(false); // ❌ Too early
}
```

**After:**
```javascript
async function init() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user && mounted) {
      setUser(session.user);
      await loadProfile(session.user.id, session.user.email); // Wait for profile
    }

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth Event:", event);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id, session.user.email);
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  } finally {
    if (mounted) setLoading(false); // ✅ Always set loading false
  }
}
```

---

### Fix #6: Auto-populate Form Fields (15 minutes)
**Status:** 🟡 IMPORTANT - Better UX

**File:** `client/src/pages/user/NewRequest.jsx`

**Add this useEffect after state declarations:**

```javascript
// Add after line 34
useEffect(() => {
  if (profile) {
    setFormData(prev => ({
      ...prev,
      department: profile.department || prev.department,
      designation: profile.designation || prev.designation,
    }));
  }
}, [profile]);
```

---

### Fix #7: Remove Console Logs (30 minutes)
**Status:** 🔒 SECURITY - Don't expose data

**Step 1:** Create logger utility

**File:** `client/src/utils/logger.js`
```javascript
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args) => {
    console.error(...args); // Always log errors
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
};

export default logger;
```

**Step 2:** Replace console.log throughout

**Before:**
```javascript
console.log('Fetching data...');
```

**After:**
```javascript
import logger from '../../utils/logger';

logger.log('Fetching data...');
```

**Step 3:** Remove these specific logs:

**File:** `client/src/services/supabase.js` (lines 6-12)
```javascript
// DELETE THESE:
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);
console.error('Missing Supabase environment variables!');
console.error('URL:', supabaseUrl);
console.error('Key:', supabaseAnonKey ? 'EXISTS' : 'MISSING');
```

---

## ✅ Verification Checklist

After completing all fixes, verify:

- [ ] RLS policies applied (check Supabase dashboard)
- [ ] All roles see correct dashboard
- [ ] No React warnings in console
- [ ] Error messages are user-friendly
- [ ] Forms auto-populate from profile
- [ ] No console.log in production build
- [ ] App loads without errors
- [ ] Can create request as user
- [ ] Can approve as head
- [ ] Can assign vehicle as admin
- [ ] Can complete travel as admin

---

## 🧪 Testing Commands

```bash
# Check for console.log in code
cd client
grep -r "console.log" src/ --exclude-dir=node_modules

# Check for useEffect warnings
npm start
# Open browser console, should see no warnings

# Build for production
npm run build
# Should complete without errors

# Check bundle size
npm run build
ls -lh build/static/js/*.js
```

---

## 🆘 If Something Goes Wrong

### RLS Policies Failed
- Check Supabase logs
- Verify you're using the right database
- Try running policies one section at a time

### Dashboard Not Showing
- Clear browser cache
- Check profile.role value in console
- Verify imports are correct

### useEffect Infinite Loop
- Check all dependencies are correct
- Make sure you're not setting state that's in dependencies
- Use useCallback for functions

### Build Errors
- Delete node_modules and package-lock.json
- Run `npm install` again
- Check for TypeScript errors

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Review the full analysis report
4. Test in incognito mode (clears cache)

---

**Last Updated:** November 27, 2025, 7:14 PM  
**Next Steps:** After these fixes, review the full analysis report for remaining improvements
