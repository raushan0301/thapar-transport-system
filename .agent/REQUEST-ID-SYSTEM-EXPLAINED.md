# 📋 REQUEST ID SYSTEM - COMPLETE DOCUMENTATION

## 🎯 **HOW REQUEST IDS WORK**

---

## **1. REQUEST ID STRUCTURE**

### **Format:**
```
TR-YYYY-XXXX
```

**Example:**
```
TR-2025-0001
TR-2025-0042
TR-2025-1234
```

### **Components:**
- **TR** = Transport Request (prefix)
- **YYYY** = Year (2025)
- **XXXX** = Sequential number (0001, 0002, etc.)

---

## **2. HOW IT'S GENERATED**

### **Database Level (Automatic):**

The `request_number` is **automatically generated** by the database when a new request is inserted.

**Method: Database Trigger or Default Value**

```sql
-- Option 1: Database Trigger
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'TR-' || 
                        EXTRACT(YEAR FROM NOW()) || '-' || 
                        LPAD(nextval('request_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_request_number
  BEFORE INSERT ON transport_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_request_number();
```

**OR**

```sql
-- Option 2: Default Value with Sequence
CREATE SEQUENCE request_number_seq START 1;

ALTER TABLE transport_requests
ALTER COLUMN request_number 
SET DEFAULT 'TR-' || EXTRACT(YEAR FROM NOW()) || '-' || 
            LPAD(nextval('request_number_seq')::text, 4, '0');
```

---

## **3. CURRENT IMPLEMENTATION**

### **In Your System:**

**Frontend (NewRequest.jsx):**
```javascript
const requestData = {
  user_id: profile.id,
  department: formData.department,
  // ... other fields
  // NO request_number field - it's auto-generated!
};

const { data, error } = await createRequest(requestData);
// data.request_number will be 'TR-2025-0001'
```

**Service (requestService.js):**
```javascript
export const createRequest = async (requestData) => {
  const { data, error } = await supabase
    .from('transport_requests')
    .insert([requestData])  // No request_number in insert
    .select()               // Returns with auto-generated request_number
    .single();
    
  return { data, error: null };
};
```

**Database:**
- When you insert a new row, the database automatically generates the `request_number`
- The `.select()` returns the complete row including the generated `request_number`

---

## **4. HOW IT WORKS - STEP BY STEP**

### **User Creates Request:**

**Step 1: User fills form**
```
Department: CSED
Date: 2025-12-05
Purpose: Official meeting
```

**Step 2: Frontend sends data**
```javascript
{
  user_id: "uuid-123",
  department: "CSED",
  date_of_visit: "2025-12-05",
  purpose: "Official meeting",
  // NO request_number!
}
```

**Step 3: Database receives insert**
```sql
INSERT INTO transport_requests (
  user_id, department, date_of_visit, purpose
) VALUES (
  'uuid-123', 'CSED', '2025-12-05', 'Official meeting'
);
```

**Step 4: Database trigger/default fires**
```sql
-- Automatically sets:
request_number = 'TR-2025-0001'
```

**Step 5: Database returns complete row**
```javascript
{
  id: "uuid-456",
  request_number: "TR-2025-0001",  // ← Auto-generated!
  user_id: "uuid-123",
  department: "CSED",
  date_of_visit: "2025-12-05",
  purpose: "Official meeting",
  current_status: "pending_head",
  submitted_at: "2025-12-04T10:30:00Z"
}
```

**Step 6: Frontend receives data**
```javascript
const { data } = await createRequest(requestData);
console.log(data.request_number); // "TR-2025-0001"
```

---

## **5. WHERE REQUEST NUMBER IS USED**

### **Display:**
- ✅ My Requests table
- ✅ Pending Approvals table
- ✅ Request Details page
- ✅ Dashboard cards
- ✅ Audit Logs
- ✅ Export CSV

### **Search:**
```javascript
// Search by request number
const matchesSearch = req.request_number
  ?.toLowerCase()
  .includes(searchTerm.toLowerCase());
```

### **Notifications:**
```javascript
message: `Your request ${request.request_number} has been approved`
```

### **Tracking:**
```javascript
// Users can track their request
"Where is TR-2025-0042?"
```

---

## **6. UNIQUENESS & SEQUENCE**

### **How Uniqueness is Ensured:**

**Database Sequence:**
```sql
CREATE SEQUENCE request_number_seq;
-- Guarantees unique incrementing numbers
```

**Unique Constraint:**
```sql
ALTER TABLE transport_requests
ADD CONSTRAINT unique_request_number 
UNIQUE (request_number);
```

### **Sequence Reset (Yearly):**

**Option 1: Manual Reset (Start of Year)**
```sql
-- Reset sequence on Jan 1
ALTER SEQUENCE request_number_seq RESTART WITH 1;
```

**Option 2: Auto-Reset in Trigger**
```sql
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year INT;
  last_year INT;
  next_num INT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());
  
  -- Get last request number for current year
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(request_number FROM 9) AS INT)), 
    0
  ) + 1
  INTO next_num
  FROM transport_requests
  WHERE request_number LIKE 'TR-' || current_year || '-%';
  
  NEW.request_number := 'TR-' || current_year || '-' || 
                        LPAD(next_num::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## **7. EXAMPLE FLOW**

### **Scenario: 3 Users Create Requests**

**Request 1 (User A):**
```
Input: { department: "CSED", purpose: "Meeting" }
Output: { request_number: "TR-2025-0001", ... }
```

**Request 2 (User B):**
```
Input: { department: "ECED", purpose: "Conference" }
Output: { request_number: "TR-2025-0002", ... }
```

**Request 3 (User A again):**
```
Input: { department: "CSED", purpose: "Workshop" }
Output: { request_number: "TR-2025-0003", ... }
```

**Database Table:**
```
| id  | request_number | user_id | department | purpose    |
|-----|----------------|---------|------------|------------|
| 1   | TR-2025-0001   | user-a  | CSED       | Meeting    |
| 2   | TR-2025-0002   | user-b  | ECED       | Conference |
| 3   | TR-2025-0003   | user-a  | CSED       | Workshop   |
```

---

## **8. BENEFITS**

### **For Users:**
- ✅ Easy to remember (TR-2025-0001)
- ✅ Easy to communicate ("My request is TR-2025-0042")
- ✅ Year-based organization
- ✅ Sequential tracking

### **For System:**
- ✅ Automatic generation (no manual work)
- ✅ Guaranteed uniqueness
- ✅ Consistent format
- ✅ Database-level enforcement

### **For Admins:**
- ✅ Easy to search
- ✅ Easy to sort
- ✅ Year-wise reporting
- ✅ Audit trail

---

## **9. VERIFICATION**

### **Check if Auto-Generation Works:**

**Test Query:**
```sql
-- Insert without request_number
INSERT INTO transport_requests (
  user_id, department, purpose, current_status
) VALUES (
  'test-user-id', 'CSED', 'Test', 'pending_head'
) RETURNING *;

-- Should return with auto-generated request_number
```

**Expected Result:**
```json
{
  "id": "uuid-789",
  "request_number": "TR-2025-0001",  ← Auto-generated!
  "user_id": "test-user-id",
  "department": "CSED",
  "purpose": "Test"
}
```

---

## **10. TROUBLESHOOTING**

### **If request_number is NULL:**

**Problem:** Database trigger/default not set up

**Solution:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger 
WHERE tgname = 'set_request_number';

-- If not, create it
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'TR-' || 
                        EXTRACT(YEAR FROM NOW()) || '-' || 
                        LPAD(nextval('request_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_request_number
  BEFORE INSERT ON transport_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_request_number();
```

---

## **✅ SUMMARY**

**Request ID System:**
- ✅ Format: `TR-YYYY-XXXX`
- ✅ Auto-generated by database
- ✅ Unique and sequential
- ✅ No manual intervention needed
- ✅ Used throughout the system
- ✅ Year-based numbering

**You DON'T need to:**
- ❌ Generate request numbers in frontend
- ❌ Pass request_number in insert
- ❌ Manually track sequences

**Database handles everything automatically!** 🎉
