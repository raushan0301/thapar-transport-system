# 🧪 Thapar Transport System - Complete Testing Guide

**Date:** January 2, 2026  
**Status:** Ready for Testing

---

## 📋 **Testing Checklist**

### **Phase 1: Authentication & User Management** ✅

#### **1.1 Registration**
- [ ] Register new user with all fields
- [ ] Verify email validation
- [ ] Verify password strength (min 6 characters)
- [ ] Check password confirmation match
- [ ] Verify user created in database
- [ ] Check default role is 'user'

#### **1.2 Login**
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Login with non-existent email (should fail)
- [ ] Check "Remember me" functionality
- [ ] Verify redirect to dashboard after login
- [ ] Check session persistence

#### **1.3 User Management (Admin Only)**
- [ ] View all users list
- [ ] Create new user manually
- [ ] Edit user details
- [ ] Change user role
- [ ] Delete user (not self)
- [ ] Verify cannot delete self
- [ ] Check search/filter functionality

---

### **Phase 2: Request Workflow** 🚗

#### **2.1 Create Request (User/Faculty/Staff)**
- [ ] Fill all required fields
- [ ] Select department head
- [ ] Choose vehicle type
- [ ] Set travel dates (future only)
- [ ] Add passengers
- [ ] Submit request
- [ ] Verify request ID generated
- [ ] Check initial status is 'pending'

#### **2.2 View Requests**
- [ ] View "My Requests" list
- [ ] Check all columns display correctly
- [ ] Verify status badges show correct colors
- [ ] Click on request to view details
- [ ] Check request details page shows all info

#### **2.3 Edit Request (Before Approval)**
- [ ] Edit unapproved request
- [ ] Modify travel details
- [ ] Change passengers
- [ ] Save changes
- [ ] Verify changes saved

#### **2.4 Delete Request (Before Approval)**
- [ ] Delete unapproved request
- [ ] Confirm deletion dialog
- [ ] Verify request removed from list

---

### **Phase 3: Approval Workflow** ✅

#### **3.1 Head Approval**
- [ ] Login as Head
- [ ] View pending approvals
- [ ] Check request details
- [ ] Approve request
- [ ] Verify status changes to 'head_approved'
- [ ] Check notification sent to user
- [ ] Test rejection with reason
- [ ] Verify rejected request status

#### **3.2 Admin Review**
- [ ] Login as Admin
- [ ] View pending reviews (head_approved)
- [ ] Review request details
- [ ] Forward to Authority/Registrar
- [ ] Verify status changes correctly
- [ ] Test rejection

#### **3.3 Authority Approval (if required)**
- [ ] Login as Authority (Director/Deputy/Dean)
- [ ] View pending approvals
- [ ] Approve request
- [ ] Verify status changes to 'authority_approved'
- [ ] Test rejection

#### **3.4 Registrar Approval (Final)**
- [ ] Login as Registrar
- [ ] View pending approvals
- [ ] Final approval
- [ ] Verify status changes to 'registrar_approved'
- [ ] Check request ready for vehicle assignment

---

### **Phase 4: Vehicle Management** 🚙

#### **4.1 Vehicle CRUD (Admin)**
- [ ] Add new vehicle
- [ ] Edit vehicle details
- [ ] Change vehicle status (available/maintenance/in-use)
- [ ] Delete vehicle
- [ ] View vehicle list
- [ ] Filter by type
- [ ] Filter by status
- [ ] Search vehicles

#### **4.2 Vehicle Assignment (Admin)**
- [ ] View approved requests
- [ ] Assign vehicle to request
- [ ] Select driver
- [ ] Set pickup time
- [ ] Add notes
- [ ] Save assignment
- [ ] Verify status changes to 'assigned'
- [ ] Check vehicle marked as 'in-use'

---

### **Phase 5: Travel Completion** 🏁

#### **5.1 Complete Travel (Admin)**
- [ ] View assigned requests
- [ ] Mark travel as complete
- [ ] Enter actual kilometers
- [ ] Add completion notes
- [ ] Save completion
- [ ] Verify status changes to 'completed'
- [ ] Check vehicle status back to 'available'

---

### **Phase 6: Additional Features** ⚙️

#### **6.1 Head Management (Admin)**
- [ ] Assign user as department head
- [ ] Change head assignment
- [ ] Remove head assignment
- [ ] Verify head can see their department requests

#### **6.2 Rate Settings (Admin)**
- [ ] View current rates
- [ ] Update rate per kilometer
- [ ] Save changes
- [ ] Verify rates applied to new requests

#### **6.3 Export Data (Admin)**
- [ ] Export all requests to CSV
- [ ] Export filtered requests
- [ ] Export vehicles list
- [ ] Export users list
- [ ] Verify CSV file downloads
- [ ] Check data accuracy in CSV

#### **6.4 Audit Logs (Admin)**
- [ ] View audit logs
- [ ] Filter by date range
- [ ] Filter by user
- [ ] Filter by action type
- [ ] Search logs
- [ ] Verify all actions logged

#### **6.5 Notifications**
- [ ] Check notification bell icon
- [ ] View unread count
- [ ] Click notification
- [ ] Mark as read
- [ ] Navigate to related request
- [ ] Check notification panel

#### **6.6 Profile**
- [ ] View profile page
- [ ] Update profile information
- [ ] Change password
- [ ] Save changes
- [ ] Verify updates saved

---

### **Phase 7: Edge Cases & Error Handling** ⚠️

#### **7.1 Validation**
- [ ] Submit form with missing required fields
- [ ] Enter invalid email format
- [ ] Enter past dates for travel
- [ ] Enter end date before start date
- [ ] Enter negative passenger count
- [ ] Verify error messages display

#### **7.2 Permissions**
- [ ] Try accessing admin pages as user (should fail)
- [ ] Try accessing head pages as user (should fail)
- [ ] Try editing other user's request (should fail)
- [ ] Try deleting approved request (should fail)
- [ ] Verify proper error messages

#### **7.3 Database Constraints**
- [ ] Try creating duplicate vehicle registration
- [ ] Try assigning unavailable vehicle
- [ ] Try deleting vehicle in use
- [ ] Verify constraint errors handled

---

### **Phase 8: UI/UX Testing** 🎨

#### **8.1 Responsive Design**
- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Check navigation menu on mobile
- [ ] Verify forms work on all sizes

#### **8.2 Navigation**
- [ ] Test all navbar links
- [ ] Test sidebar navigation
- [ ] Test breadcrumbs
- [ ] Test back buttons
- [ ] Verify logout works
- [ ] Check logo links to home

#### **8.3 Visual Elements**
- [ ] Check logo displays correctly
- [ ] Verify colors are consistent
- [ ] Check button hover states
- [ ] Verify loading spinners show
- [ ] Check success/error toasts
- [ ] Verify icons display

---

### **Phase 9: Performance Testing** ⚡

#### **9.1 Load Times**
- [ ] Measure landing page load time
- [ ] Measure dashboard load time
- [ ] Measure request list load time
- [ ] Check image loading
- [ ] Verify no unnecessary re-renders

#### **9.2 Data Handling**
- [ ] Test with 100+ requests
- [ ] Test with 50+ vehicles
- [ ] Test with 100+ users
- [ ] Check pagination works
- [ ] Verify search is fast

---

### **Phase 10: Browser Compatibility** 🌐

- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Check console for errors
- [ ] Verify no warnings

---

## 🐛 **Bug Tracking Template**

When you find a bug, document it:

```
**Bug ID:** BUG-001
**Severity:** High/Medium/Low
**Page:** [Page name]
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:** [What should happen]
**Actual Result:** [What actually happens]
**Screenshot:** [If applicable]
**Browser:** [Chrome/Firefox/etc.]
**User Role:** [Admin/User/etc.]
```

---

## ✅ **Testing Progress Tracker**

- [ ] Phase 1: Authentication (0/6)
- [ ] Phase 2: Request Workflow (0/4)
- [ ] Phase 3: Approval Workflow (0/4)
- [ ] Phase 4: Vehicle Management (0/2)
- [ ] Phase 5: Travel Completion (0/1)
- [ ] Phase 6: Additional Features (0/6)
- [ ] Phase 7: Edge Cases (0/3)
- [ ] Phase 8: UI/UX (0/3)
- [ ] Phase 9: Performance (0/2)
- [ ] Phase 10: Browser Compatibility (0/5)

**Total Progress:** 0/36 sections

---

## 🚀 **How to Start Testing:**

1. **Open the app:** `http://localhost:3000`
2. **Create test accounts:**
   - Admin user
   - Regular user
   - Head user
   - Authority user
   - Registrar user
3. **Follow the checklist** phase by phase
4. **Document any bugs** found
5. **Retest after fixes**

---

## 📝 **Test Data Needed:**

### **Users:**
- 1 Admin
- 1 Registrar
- 1 Director/Deputy/Dean
- 2-3 Department Heads
- 5-10 Regular Users

### **Vehicles:**
- 2-3 Cars
- 2-3 Buses
- 1-2 Vans

### **Requests:**
- 10+ test requests in various statuses

---

**Ready to start testing?** 🧪

Let me know which phase you want to start with, or if you need help setting up test data!
