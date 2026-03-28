import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const IST = 'Asia/Kolkata';

// Convert any date string/object to IST Date object
const toIST = (date) => {
  if (!date) return null;
  try { return toZonedTime(new Date(date), IST); } catch { return null; }
};

// Format date only — IST (e.g. "28 Mar 2026")
export const formatDate = (date) => {
  const d = toIST(date);
  if (!d) return '—';
  return format(d, 'dd MMM yyyy');
};

// Format date + time — IST (e.g. "28 Mar 2026, 08:30 AM IST")
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: IST,
  }) + ' IST';
};

// Format time only — IST (e.g. "08:30 AM")
export const formatTimeOnly = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: IST,
  });
};

// Get current IST ISO string for storing in DB
export const nowIST = () => new Date().toISOString();

// Get user initials from full name
export const getInitials = (fullName) => {
  if (!fullName) return '?';
  const names = fullName.trim().split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Format HH:MM:SS time string (from DB) to 12h format
export const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Format currency
export const formatCurrency = (amount) => {
  if (!amount) return '₹0.00';
  return `₹${parseFloat(amount).toFixed(2)}`;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    pending_head: 'bg-yellow-100 text-yellow-800',
    pending_admin: 'bg-blue-100 text-blue-800',
    pending_registrar: 'bg-indigo-100 text-indigo-800',
    approved_awaiting_vehicle: 'bg-green-100 text-green-800',
    vehicle_assigned: 'bg-teal-100 text-teal-800',
    travel_completed: 'bg-gray-100 text-gray-800',
    closed: 'bg-gray-400 text-white',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Validate email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validate phone
export const isValidPhone = (phone) => {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone);
};

// File size validation
export const isValidFileSize = (size, maxSize = 5242880) => { // 5MB default
  return size <= maxSize;
};

// File type validation
export const isValidFileType = (type, allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']) => {
  return allowedTypes.includes(type);
};