// User Roles
export const ROLES = {
  USER: 'user',
  HEAD: 'head',
  ADMIN: 'admin',
  DIRECTOR: 'director',
  DEPUTY_DIRECTOR: 'deputy_director',
  DEAN: 'dean',
  REGISTRAR: 'registrar',
};

// Request Status
export const REQUEST_STATUS = {
  PENDING_HEAD: 'pending_head',
  PENDING_ADMIN: 'pending_admin',
  PENDING_AUTHORITY: 'pending_authority',
  PENDING_REGISTRAR: 'pending_registrar',
  APPROVED_AWAITING_VEHICLE: 'approved_awaiting_vehicle',
  VEHICLE_ASSIGNED: 'vehicle_assigned',
  TRAVEL_COMPLETED: 'travel_completed',
  CLOSED: 'closed',
  REJECTED: 'rejected',
};

// Status Labels (for display)
export const STATUS_LABELS = {
  pending_head: 'Pending Head Approval',
  pending_admin: 'Pending Admin Review',
  pending_authority: 'Pending Authority Approval',
  pending_registrar: 'Pending Registrar Approval',
  approved_awaiting_vehicle: 'Approved - Awaiting Vehicle',
  vehicle_assigned: 'Vehicle Assigned',
  travel_completed: 'Travel Completed',
  closed: 'Closed',
  rejected: 'Rejected',
};

// Vehicle Types
export const VEHICLE_TYPES = {
  DIESEL_CAR: 'diesel_car',
  PETROL_CAR: 'petrol_car',
  BUS: 'bus',
};

// Vehicle Type Labels
export const VEHICLE_TYPE_LABELS = {
  diesel_car: 'Diesel Car',
  petrol_car: 'Petrol Car',
  bus: 'Bus',
};

// Authority Types
export const AUTHORITY_TYPES = {
  NONE: 'none',
  DIRECTOR: 'director',
  DEPUTY_DIRECTOR: 'deputy_director',
  DEAN: 'dean',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  APPROVAL: 'approval',
  REJECTION: 'rejection',
  VEHICLE_ASSIGNED: 'vehicle_assigned',
  NEW_REQUEST: 'new_request',
  INFO: 'info',
};

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];