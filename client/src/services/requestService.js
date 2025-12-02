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
    }

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
const createNotification = async (notificationData) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([notificationData]);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
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