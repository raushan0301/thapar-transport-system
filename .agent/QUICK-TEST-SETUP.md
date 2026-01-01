# 🧪 Quick Test Setup Guide

## **Step 1: Access Your Application**

Your app is already running:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000

---

## **Step 2: Create Test Users**

### **Option A: Via Registration Page**

Go to `http://localhost:3000/register` and create these users:

1. **Admin User**
   - Name: Admin Test
   - Email: admin@thapar.edu
   - Department: Administration
   - Phone: 9876543210
   - Password: admin123

2. **Regular User (Faculty)**
   - Name: Faculty Test
   - Email: faculty@thapar.edu
   - Department: Computer Science
   - Phone: 9876543211
   - Password: faculty123

3. **Head User**
   - Name: Head Test
   - Email: head@thapar.edu
   - Department: Computer Science
   - Phone: 9876543212
   - Password: head123

4. **Registrar User**
   - Name: Registrar Test
   - Email: registrar@thapar.edu
   - Department: Administration
   - Phone: 9876543213
   - Password: registrar123

5. **Authority User (Director)**
   - Name: Director Test
   - Email: director@thapar.edu
   - Department: Administration
   - Phone: 9876543214
   - Password: director123

### **Option B: Via Supabase Dashboard**

1. Go to your Supabase project
2. Navigate to **Table Editor** → **profiles**
3. Manually update user roles:
   - Set one user's role to `admin`
   - Set one user's role to `registrar`
   - Set one user's role to `director` (or `deputy_director`, `dean`)
   - Set one user's role to `head`

---

## **Step 3: Set Up Test Data (Admin Login Required)**

### **3.1 Create Vehicles**

1. Login as Admin
2. Go to **Vehicle Management**
3. Add these vehicles:

   **Vehicle 1:**
   - Registration: PB-01-AB-1234
   - Type: Car
   - Model: Toyota Innova
   - Capacity: 7
   - Status: Available

   **Vehicle 2:**
   - Registration: PB-01-CD-5678
   - Type: Bus
   - Model: Tata Starbus
   - Capacity: 40
   - Status: Available

   **Vehicle 3:**
   - Registration: PB-01-EF-9012
   - Type: Van
   - Model: Mahindra Supro
   - Capacity: 10
   - Status: Available

### **3.2 Assign Department Heads**

1. Go to **Head Management**
2. Assign the "Head Test" user as head of "Computer Science" department

### **3.3 Set Rates**

1. Go to **Rate Settings**
2. Set rate per kilometer: ₹15

---

## **Step 4: Start Testing**

### **Test Scenario 1: Complete Request Flow**

1. **Login as Faculty** (faculty@thapar.edu)
2. **Create New Request:**
   - Purpose: Conference in Delhi
   - Destination: Delhi
   - Start Date: Tomorrow
   - End Date: Day after tomorrow
   - Vehicle Type: Car
   - Passengers: 5
   - Select Head: Head Test
   - Submit

3. **Login as Head** (head@thapar.edu)
   - Go to **Pending Approvals**
   - Find the request
   - Click **Approve**

4. **Login as Admin** (admin@thapar.edu)
   - Go to **Pending Review**
   - Find the request
   - Click **Forward to Registrar**

5. **Login as Registrar** (registrar@thapar.edu)
   - Go to **Pending Approvals**
   - Find the request
   - Click **Approve**

6. **Login as Admin** again
   - Go to **Vehicle Assignment**
   - Find the approved request
   - Assign Vehicle: PB-01-AB-1234
   - Driver: Test Driver
   - Pickup Time: 09:00 AM
   - Save

7. **After "travel" is done:**
   - Go to **Travel Completion**
   - Mark as complete
   - Enter kilometers: 500
   - Save

✅ **Request Complete!**

---

### **Test Scenario 2: Rejection Flow**

1. **Create another request** as Faculty
2. **Login as Head**
3. **Reject the request** with reason: "Budget constraints"
4. **Login as Faculty**
5. **Check notification** - should show rejection
6. **View request** - status should be "rejected"

---

### **Test Scenario 3: Edit & Delete**

1. **Create a new request** as Faculty
2. **Before approval**, click **Edit**
3. **Modify** some details
4. **Save changes**
5. **Delete the request**
6. **Verify** it's removed from list

---

## **Step 5: Check All Features**

### **✅ Features to Test:**

- [ ] User Registration & Login
- [ ] Create Request
- [ ] Edit Request (before approval)
- [ ] Delete Request (before approval)
- [ ] Head Approval
- [ ] Admin Review
- [ ] Registrar Approval
- [ ] Vehicle Assignment
- [ ] Travel Completion
- [ ] Notifications
- [ ] Profile Update
- [ ] Vehicle Management (CRUD)
- [ ] Head Management
- [ ] Rate Settings
- [ ] Export Data
- [ ] Audit Logs
- [ ] Search & Filters
- [ ] Responsive Design (mobile/tablet)

---

## **Step 6: Document Issues**

If you find any bugs or issues:

1. **Take a screenshot**
2. **Note the steps to reproduce**
3. **Document:**
   - What you expected
   - What actually happened
   - Your user role
   - Browser used

---

## **Quick Access URLs:**

- **Landing:** http://localhost:3000/
- **Login:** http://localhost:3000/login
- **Register:** http://localhost:3000/register
- **Dashboard:** http://localhost:3000/dashboard
- **New Request:** http://localhost:3000/new-request
- **My Requests:** http://localhost:3000/my-requests

---

## **Test Credentials Summary:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@thapar.edu | admin123 |
| Faculty | faculty@thapar.edu | faculty123 |
| Head | head@thapar.edu | head123 |
| Registrar | registrar@thapar.edu | registrar123 |
| Director | director@thapar.edu | director123 |

---

**Ready to test!** 🚀

Start with **Test Scenario 1** to verify the complete workflow works end-to-end.

Let me know if you encounter any issues!
