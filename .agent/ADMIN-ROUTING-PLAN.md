# Admin Routing to Higher Authority - Implementation Plan

## Issue
Admin cannot route requests to higher authority (Director, Deputy Director, Dean, Registrar)

## Solution
Add "Route to Authority" button for admins on RequestDetails page

## Implementation Steps

### 1. Add Admin Functions to RequestDetails.jsx

Add after handleReject function (line 201):

```javascript
// Admin approval functions
const handleAdminApprove = async () => {
  if (!window.confirm('Approve and assign vehicle?')) return;

  try {
    await supabase.from('approvals').insert([{
      request_id: id,
      approver_id: user.id,
      approver_role: 'admin',
      action: 'approved',
      approved_at: new Date().toISOString(),
    }]);

    await supabase.from('transport_requests').update({
      current_status: 'pending_vehicle',
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    toast.success('Approved! Assign vehicle.');
    navigate('/admin/vehicle-assignment');
  } catch (err) {
    toast.error(`Failed: ${err.message}`);
  }
};

const handleRouteToAuthority = async () => {
  const authorities = ['DIRECTOR', 'DEPUTY_DIRECTOR', 'DEAN', 'REGISTRAR'];
  const authority = window.prompt(`Route to:\n${authorities.join(', ')}`);
  
  if (!authority || !authorities.includes(authority.toUpperCase())) {
    if (authority) toast.error('Invalid authority');
    return;
  }

  try {
    await supabase.from('approvals').insert([{
      request_id: id,
      approver_id: user.id,
      approver_role: 'admin',
      action: 'routed_to_authority',
      comment: `Routed to ${authority.toUpperCase()}`,
      approved_at: new Date().toISOString(),
    }]);

    await supabase.from('transport_requests').update({
      current_status: 'pending_authority',
      routed_to_authority: authority.toUpperCase(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    toast.success(`Routed to ${authority.toUpperCase()}`);
    navigate('/admin/pending');
  } catch (err) {
    toast.error(`Failed: ${err.message}`);
  }
};
```

### 2. Add Admin Permission Check

After line 214, add:

```javascript
// Check if admin
const isAdmin = user.role === 'admin';
const canAdminProcess = isAdmin && request.current_status === 'pending_admin';
```

### 3. Add Admin Buttons

In the buttons section (around line 255), add:

```javascript
{canAdminProcess && (
  <>
    <button
      onClick={handleRouteToAuthority}
      className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
    >
      <ArrowUpRight className="w-5 h-5" strokeWidth={2} />
      <span>Route to Authority</span>
    </button>
    <button
      onClick={handleAdminApprove}
      className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
    >
      <Check className="w-5 h-5" strokeWidth={2} />
      <span>Approve & Assign Vehicle</span>
    </button>
  </>
)}
```

### 4. Add Icon Import

Add to imports (line 10):

```javascript
import { ..., ArrowUpRight } from 'lucide-react';
```

## Result

Admin will see:
- [Route to Authority] [Approve & Assign Vehicle]

When routing:
- Prompts for authority selection
- Updates status to pending_authority
- Records approval action

When approving:
- Updates status to pending_vehicle
- Redirects to vehicle assignment
