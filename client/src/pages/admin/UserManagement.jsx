import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { Users, UserPlus, Edit, Trash2, Search, Filter, Mail, Phone, Building, Briefcase, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'user',
        department: '',
        designation: '',
        phone: ''
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const roles = [
        { value: 'user', label: 'User', icon: Users, color: 'blue' },
        { value: 'head', label: 'Head', icon: Briefcase, color: 'purple' },
        { value: 'admin', label: 'Admin', icon: Shield, color: 'red' },
        { value: 'director', label: 'Director', icon: Building, color: 'indigo' },
        { value: 'deputy_director', label: 'Deputy Director', icon: Building, color: 'violet' },
        { value: 'dean', label: 'Dean', icon: Building, color: 'pink' },
        { value: 'registrar', label: 'Registrar', icon: Shield, color: 'green' },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, filterRole]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error:', err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = users;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(u =>
                u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.department?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by role
        if (filterRole !== 'all') {
            filtered = filtered.filter(u => u.role === filterRole);
        }

        setFilteredUsers(filtered);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenModal = (userToEdit = null) => {
        if (userToEdit) {
            setEditingUser(userToEdit);
            setFormData({
                full_name: userToEdit.full_name || '',
                email: userToEdit.email || '',
                password: '', // Don't populate password for editing
                role: userToEdit.role || 'user',
                department: userToEdit.department || '',
                designation: userToEdit.designation || '',
                phone: userToEdit.phone || ''
            });
        } else {
            setEditingUser(null);
            setFormData({
                full_name: '',
                email: '',
                password: '',
                role: 'user',
                department: '',
                designation: '',
                phone: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({
            full_name: '',
            email: '',
            password: '',
            role: 'user',
            department: '',
            designation: '',
            phone: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.full_name || !formData.email || !formData.role) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!editingUser && !formData.password) {
            toast.error('Password is required for new users');
            return;
        }

        setSaving(true);
        try {
            if (editingUser) {
                // Update existing user
                const updateData = {
                    full_name: formData.full_name,
                    role: formData.role,
                    department: formData.department,
                    designation: formData.designation,
                    phone: formData.phone,
                    updated_at: new Date().toISOString()
                };

                const { error } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', editingUser.id);

                if (error) throw error;
                toast.success('User updated successfully!');
            } else {
                // Create new user
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.full_name,
                            role: formData.role,
                            department: formData.department,
                            designation: formData.designation,
                            phone: formData.phone
                        }
                    }
                });

                if (authError) throw authError;

                // Also insert into users table directly
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([{
                        id: authData.user.id,
                        email: formData.email,
                        full_name: formData.full_name,
                        role: formData.role,
                        department: formData.department,
                        designation: formData.designation,
                        phone: formData.phone
                    }]);

                if (insertError) {
                    console.error('Insert error:', insertError);
                    // Don't throw, as auth user is already created
                }

                toast.success('User created successfully!');
            }

            handleCloseModal();
            fetchUsers();
        } catch (err) {
            console.error('Error:', err);
            toast.error(err.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (userId, userName) => {
        console.log('Delete button clicked for:', userName, userId);
        setUserToDelete({ id: userId, name: userName });
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setDeleting(true);
        setShowDeleteConfirm(false);

        try {
            console.log('Attempting to delete user:', userToDelete.id, userToDelete.name);

            const { data, error } = await supabase
                .from('users')
                .delete()
                .eq('id', userToDelete.id);

            console.log('Delete result:', { data, error });

            if (error) {
                console.error('Delete error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            toast.success('User deleted successfully');
            fetchUsers();
        } catch (err) {
            console.error('Full error:', err);
            toast.error(`Failed to delete user: ${err.message || 'Unknown error'}`);
        } finally {
            setDeleting(false);
            setUserToDelete(null);
        }
    };

    const cancelDelete = () => {
        console.log('Deletion cancelled by user');
        setShowDeleteConfirm(false);
        setUserToDelete(null);
    };

    const getRoleBadgeColor = (role) => {
        const roleObj = roles.find(r => r.value === role);
        return roleObj?.color || 'gray';
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <Loader size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <DashboardLayout>
                {/* Header */}
                <div className="mb-8 animate-slideDown">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
                            <p className="text-gray-600">Create and manage user accounts for all roles</p>
                        </div>
                        <Button
                            variant="primary"
                            icon={UserPlus}
                            onClick={() => handleOpenModal()}
                        >
                            Create New User
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                            </div>
                            <Users className="w-12 h-12 text-blue-600" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Admins</p>
                                <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'admin').length}</p>
                            </div>
                            <Shield className="w-12 h-12 text-red-600" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Heads</p>
                                <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'head').length}</p>
                            </div>
                            <Briefcase className="w-12 h-12 text-purple-600" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Regular Users</p>
                                <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role === 'user').length}</p>
                            </div>
                            <Users className="w-12 h-12 text-blue-600" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="all">All Roles</option>
                                {roles.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{u.full_name}</p>
                                                    <p className="text-sm text-gray-500 flex items-center mt-1">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${getRoleBadgeColor(u.role)}-100 text-${getRoleBadgeColor(u.role)}-800`}>
                                                    {roles.find(r => r.value === u.role)?.label || u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900">{u.department || 'N/A'}</p>
                                                {u.designation && <p className="text-xs text-gray-500">{u.designation}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900 flex items-center">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {u.phone || 'N/A'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleOpenModal(u)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit user"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDelete(u.id, u.full_name);
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Delete user"
                                                        disabled={u.id === user.id || deleting}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create/Edit User Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {editingUser ? 'Edit User' : 'Create New User'}
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    {editingUser ? 'Update user information' : 'Add a new user to the system'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Full Name"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        required
                                        autoComplete="off"
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="user@thapar.edu"
                                        required
                                        disabled={editingUser} // Can't change email for existing users
                                        autoComplete="off"
                                    />
                                </div>

                                {!editingUser && (
                                    <Input
                                        label="Password"
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create password (min 6 characters)"
                                        required
                                        autoComplete="new-password"
                                    />
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role *
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        {roles.map(role => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Department"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        placeholder="Enter department"
                                    />
                                    <Input
                                        label="Designation"
                                        name="designation"
                                        value={formData.designation}
                                        onChange={handleChange}
                                        placeholder="Enter designation"
                                    />
                                </div>

                                <Input
                                    label="Phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                />

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleCloseModal}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={saving}
                                    >
                                        {saving ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </DashboardLayout>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Delete</h3>
                            <p className="text-gray-600">
                                Are you sure you want to delete <strong>{userToDelete.name}</strong>?
                            </p>
                            <p className="text-sm text-red-600 mt-2">
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={cancelDelete}
                                disabled={deleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={confirmDelete}
                                loading={deleting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {deleting ? 'Deleting...' : 'Delete User'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.6s ease-out;
        }
      `}</style>
        </div>
    );
};

export default UserManagement;
