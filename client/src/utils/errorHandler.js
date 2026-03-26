import toast from 'react-hot-toast';

/**
 * Handle Supabase errors with user-friendly messages
 * @param {Object} error - The error object from Supabase
 * @param {string} context - What operation was being performed (e.g., 'load data', 'save request')
 * @returns {string} - User-friendly error message
 */
export const handleSupabaseError = (error, context = 'perform this action') => {
    console.error(`Error trying to ${context}:`, error);

    // Permission denied (RLS policy)
    if (error.code === '42501' || error.code === 'PGRST301') {
        const message = `You don't have permission to ${context}. Please contact your administrator.`;
        toast.error(message);
        return message;
    }

    // Row not found
    if (error.code === 'PGRST116') {
        const message = `The requested data was not found. It may have been deleted.`;
        toast.error(message);
        return message;
    }

    // Unique constraint violation
    if (error.code === '23505') {
        const message = `This record already exists. Please check your input.`;
        toast.error(message);
        return message;
    }

    // Foreign key violation
    if (error.code === '23503') {
        const message = `Cannot complete this action due to related data. Please try again.`;
        toast.error(message);
        return message;
    }

    // Network error
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        const message = 'Network error. Please check your internet connection and try again.';
        toast.error(message);
        return message;
    }

    // Timeout error
    if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        const message = 'Request timed out. Please try again.';
        toast.error(message);
        return message;
    }

    // Authentication error
    if (error.message?.includes('JWT') || error.message?.includes('auth')) {
        const message = 'Your session has expired. Please log in again.';
        toast.error(message);
        // Optionally redirect to login
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
        return message;
    }

    // Generic error with helpful message
    const message = `Failed to ${context}. ${error.message || 'Please try again.'}`;
    toast.error(message);
    return message;
};

/**
 * Handle form validation errors
 * @param {Object} errors - Object with field names as keys and error messages as values
 */
export const handleValidationErrors = (errors) => {
    const errorCount = Object.keys(errors).length;

    if (errorCount === 0) return;

    if (errorCount === 1) {
        const [field, message] = Object.entries(errors)[0];
        toast.error(message);
    } else {
        toast.error(`Please fix ${errorCount} errors in the form`);
    }
};

/**
 * Show success message
 * @param {string} message - Success message to display
 */
export const showSuccess = (message) => {
    toast.success(message);
};

/**
 * Show info message
 * @param {string} message - Info message to display
 */
export const showInfo = (message) => {
    toast(message, {
        icon: 'ℹ️',
    });
};

/**
 * Show warning message
 * @param {string} message - Warning message to display
 */
export const showWarning = (message) => {
    toast(message, {
        icon: '⚠️',
        style: {
            background: '#f59e0b',
            color: '#fff',
        },
    });
};

/**
 * Handle async operations with automatic error handling
 * @param {Function} asyncFn - Async function to execute
 * @param {string} successMessage - Message to show on success
 * @param {string} errorContext - Context for error message
 * @returns {Promise} - Result of the async function
 */
export const withErrorHandling = async (asyncFn, successMessage, errorContext) => {
    try {
        const result = await asyncFn();
        if (successMessage) {
            showSuccess(successMessage);
        }
        return { data: result, error: null };
    } catch (error) {
        const errorMessage = handleSupabaseError(error, errorContext);
        return { data: null, error: errorMessage };
    }
};

/**
 * Get user-friendly status label
 * @param {string} status - Status code
 * @returns {string} - User-friendly label
 */
export const getStatusLabel = (status) => {
    const labels = {
        pending_head: 'Pending Head Approval',
        pending_admin: 'Pending Admin Review',
        pending_registrar: 'Pending Registrar Approval',
        approved_awaiting_vehicle: 'Approved - Awaiting Vehicle',
        vehicle_assigned: 'Vehicle Assigned',
        travel_completed: 'Travel Completed',
        closed: 'Closed',
        rejected: 'Rejected',
    };

    return labels[status] || status;
};

/**
 * Format error for display
 * @param {Error|string} error - Error object or message
 * @returns {string} - Formatted error message
 */
export const formatError = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
};

export default {
    handleSupabaseError,
    handleValidationErrors,
    showSuccess,
    showInfo,
    showWarning,
    withErrorHandling,
    getStatusLabel,
    formatError,
};
