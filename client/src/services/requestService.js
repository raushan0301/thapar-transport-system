import { supabase } from './supabase';

// Fetch all requests for current user
export const getUserRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .select(`
        *,
        head:users!transport_requests_head_id_fkey(id, full_name, email),
        approvals(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user requests:', error);
    return { data: null, error };
  }
};

// Fetch single request by ID
export const getRequestById = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .select(`
        *,
        user:users!transport_requests_user_id_fkey(id, full_name, email, department, designation),
        head:users!transport_requests_head_id_fkey(id, full_name, email),
        vehicle:vehicles(id, vehicle_number, vehicle_type),
        approvals(
          *,
          approver:users(id, full_name, role)
        ),
        attachments(*),
        travel_details(*)
      `)
      .eq('id', requestId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching request:', error);
    return { data: null, error };
  }
};

// Create new transport request
export const createRequest = async (requestData) => {
  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .insert([requestData])
      .select()
      .single();

    if (error) throw error;

    // Create notification for head
    if (requestData.head_id) {
      await createNotification({
        user_id: requestData.head_id,
        title: 'New Transport Request',
        message: `You have a new transport request pending approval`,
        type: 'new_request',
        related_request_id: data.id,
      });
    } else if (requestData.custom_head_email) {
      // Try to find if the custom head exists as a user to send notification
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', requestData.custom_head_email)
        .single();
      
      if (userData) {
        await createNotification({
          user_id: userData.id,
          title: 'New Transport Request',
          message: `You have a new transport request pending approval`,
          type: 'new_request',
          related_request_id: data.id,
        });
      }
    }
    
    // Notify all admins about the new request
    const adminMessage = data.current_status === 'pending_admin'
      ? `A new transport request (${data.request_number}) is awaiting your approval.`
      : `A new transport request (${data.request_number}) has been submitted and is awaiting Head approval.`;

    await notifyAdmins({
      title: 'New Transport Request Submission',
      message: adminMessage,
      type: 'new_request',
      related_request_id: data.id,
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error creating request:', error);
    return { data: null, error };
  }
};

// Update transport request
export const updateRequest = async (requestId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating request:', error);
    return { data: null, error };
  }
};

// Fetch predefined heads
export const getPredefinedHeads = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, department, phone')
      .eq('role', 'head')
      .order('full_name', { ascending: true });

    if (error) throw error;

    // Transform data to match expected format (HeadSelector expects { user: {...} })
    const transformedData = data?.map(head => ({
      user: head
    })) || [];

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error fetching heads:', error);
    return { data: null, error };
  }
};

// Create notification helper
export const createNotification = async (notificationData) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([notificationData]);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Notify all admins helper
export const notifyAdmins = async (notificationBase) => {
  try {
    // 1. Get all admin user IDs
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (adminError) throw adminError;

    if (adminUsers && adminUsers.length > 0) {
      // 2. Create a notification for each admin
      const notifications = adminUsers.map((admin) => ({
        ...notificationBase,
        user_id: admin.id,
      }));

      const { error: notifyError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifyError) throw notifyError;
    }
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
};

// Notify all registrars helper
export const notifyRegistrars = async (notificationBase) => {
  try {
    // 1. Get all registrar user IDs
    const { data: registrarUsers, error: regError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'registrar');

    if (regError) throw regError;

    if (registrarUsers && registrarUsers.length > 0) {
      // 2. Create a notification for each registrar
      const notifications = registrarUsers.map((reg) => ({
        ...notificationBase,
        user_id: reg.id,
      }));

      const { error: notifyError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifyError) throw notifyError;
    }
  } catch (error) {
    console.error('Error notifying registrars:', error);
  }
};

// Upload attachment
export const uploadAttachment = async (requestId, file, userId) => {
  try {
    // Upload to Cloudinary (we'll implement this)
    // For now, just store file info
    const { data, error } = await supabase
      .from('attachments')
      .insert([{
        request_id: requestId,
        file_url: 'placeholder', // Will be Cloudinary URL
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return { data: null, error };
  }
};