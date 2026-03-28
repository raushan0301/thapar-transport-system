import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import {
  Users,
  Search,
  Filter,
  Edit,
  Mail,
  Phone,
  ArrowUpCircle,
  ArrowDownCircle,
  Briefcase,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'user', label: 'User', color: 'blue', icon: Users },
  { value: 'head', label: 'Head', color: 'purple', icon: Briefcase },
  { value: 'admin', label: 'Admin', color: 'red', icon: Shield },
  { value: 'registrar', label: 'Registrar', color: 'green', icon: Shield },
  { value: 'driver', label: 'Driver', color: 'teal', icon: Briefcase },
];

const getRoleColor = (role) => ROLES.find(r => r.value === role)?.color || 'gray';
const getRoleLabel = (role) => ROLES.find(r => r.value === role)?.label || role;

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({ full_name: '', department: '', designation: '', phone: '' });
  const [saving, setSaving] = useState(false);

  // Promote modal
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userToPromote, setUserToPromote] = useState(null);
  const [targetRole, setTargetRole] = useState('registrar');
  const [promoting, setPromoting] = useState(false);

  // Demote modal
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [userToDemote, setUserToDemote] = useState(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // ── Promote / change role ──────────────────────────────────────────────────
  const promotableUsers = users.filter(u =>
    u.id !== currentUser?.id &&
    (u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
     u.email?.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const handlePromote = async () => {
    if (!userToPromote || !targetRole) return;
    setPromoting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: targetRole, updated_at: new Date().toISOString() })
        .eq('id', userToPromote.id);
      if (error) throw error;

      // If promoting to driver, also create/update the drivers table record
      if (targetRole === 'driver') {
        const { data: existingDriver } = await supabase
          .from('drivers')
          .select('id')
          .ilike('full_name', userToPromote.full_name || '')
          .maybeSingle();

        if (!existingDriver) {
          // Create a basic driver record so the dashboard works immediately
          await supabase.from('drivers').insert([{
            full_name: userToPromote.full_name,
            phone: userToPromote.phone || '',
            license_number: 'PENDING',
            is_available: true,
            notes: `Auto-created when user ${userToPromote.email} was promoted to driver role.`,
          }]);
        }
        toast.success(`${userToPromote.full_name} promoted to Driver! A driver record was also created — update license details in Driver Management.`);
      } else {
        toast.success(`${userToPromote.full_name} promoted to ${getRoleLabel(targetRole)}!`);
      }

      setShowPromoteModal(false);
      setUserToPromote(null);
      setUserSearch('');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to promote user');
    } finally {
      setPromoting(false);
    }
  };

  // ── Demote to user ─────────────────────────────────────────────────────────
  const handleDemote = async () => {
    if (!userToDemote) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'user', updated_at: new Date().toISOString() })
        .eq('id', userToDemote.id);
      if (error) throw error;
      toast.success(`${userToDemote.full_name} demoted to regular user.`);
      setShowDemoteModal(false);
      setUserToDemote(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to demote');
    }
  };

  // ── Edit profile ───────────────────────────────────────────────────────────
  const openEditModal = (u) => {
    setEditingUser(u);
    setEditData({ full_name: u.full_name || '', department: u.department || '', designation: u.designation || '', phone: u.phone || '' });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ ...editData, updated_at: new Date().toISOString() })
        .eq('id', editingUser.id);
      if (error) throw error;
      toast.success('User updated successfully!');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64"><Loader size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>

        {/* Header */}
        <div className="mb-8 animate-slideDown">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">User Management</h1>
              <p className="text-gray-500">Manage roles for registered users. Promote users to Admin or Registrar.</p>
            </div>
            <Button variant="primary" icon={ArrowUpCircle} onClick={() => setShowPromoteModal(true)}>
              Promote User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {ROLES.map(r => (
            <div key={r.value} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setFilterRole(filterRole === r.value ? 'all' : r.value)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{r.label}s</p>
                  <p className={`text-3xl font-bold text-${r.color}-600`}>{users.filter(u => u.role === r.value).length}</p>
                </div>
                <r.icon className={`w-10 h-10 text-${r.color}-400 group-hover:scale-110 transition-transform`} strokeWidth={1.5} />
              </div>
              {/* Animated highlight line */}
              <div className={`mt-3 h-1 rounded-full bg-${r.color}-100 overflow-hidden`}>
                <div className={`h-full w-0 group-hover:w-full bg-${r.color}-500 transition-all duration-500 rounded-full`} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by name, email, or department..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm">
                <option value="all">All Roles</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const color = getRoleColor(u.role);
                    const isSelf = u.id === currentUser?.id;
                    const isElevated = ['admin', 'registrar', 'head'].includes(u.role);
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-full bg-${color}-100 text-${color}-700 flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                              {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{u.full_name} {isSelf && <span className="text-xs text-blue-500">(you)</span>}</p>
                              <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                <Mail className="w-3 h-3 mr-1" />{u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{u.department || <span className="text-gray-400 italic">—</span>}</p>
                          {u.designation && <p className="text-xs text-gray-400">{u.designation}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />{u.phone || 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-1">
                            <button onClick={() => openEditModal(u)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            {!isSelf && isElevated && (
                              <button onClick={() => { setUserToDemote(u); setShowDemoteModal(true); }}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Demote to User">
                                <ArrowDownCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </DashboardLayout>

      {/* ===== Promote Modal ===== */}
      <Modal isOpen={showPromoteModal} onClose={() => { setShowPromoteModal(false); setUserToPromote(null); setUserSearch(''); }} title="Promote User">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select a registered user and assign them a new role.</p>

          {/* Target Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-mono uppercase tracking-tight">Promote to Role</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'registrar', label: 'Registrar' },
                { value: 'admin', label: 'Admin' },
                { value: 'head', label: 'Head' },
                { value: 'driver', label: 'Driver' },
              ].map(r => (
                <button 
                  key={r.value} 
                  type="button"
                  onClick={() => setTargetRole(r.value)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    targetRole === r.value 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-50' 
                      : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:bg-white hover:text-gray-600'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Users */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name or email..." value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* User List */}
          <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {promotableUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                {users.filter(u => u.role === 'user').length === 0
                  ? 'No regular users registered yet.'
                  : 'No users match your search.'}
              </div>
            ) : (
              promotableUsers.map(u => (
                <button key={u.id} onClick={() => setUserToPromote(u)}
                  className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-indigo-50 transition-colors ${userToPromote?.id === u.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{u.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  {userToPromote?.id === u.id && (
                    <span className="text-indigo-600 text-xs font-semibold flex-shrink-0">Selected ✓</span>
                  )}
                </button>
              ))
            )}
          </div>

          {userToPromote && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-800">
              <strong>{userToPromote.full_name}</strong> will be promoted to <strong>{getRoleLabel(targetRole)}</strong>.
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => { setShowPromoteModal(false); setUserToPromote(null); setUserSearch(''); }}>Cancel</Button>
            <Button variant="primary" icon={ArrowUpCircle} onClick={handlePromote} loading={promoting} disabled={!userToPromote}>
              Promote to {getRoleLabel(targetRole)}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== Edit Modal ===== */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User Profile">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input label="Full Name" value={editData.full_name} onChange={(e) => setEditData(p => ({ ...p, full_name: e.target.value }))} placeholder="Full name" required autoComplete="off" />
          <Input label="Email" value={editingUser?.email || ''} disabled helperText="Email cannot be changed" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Department" value={editData.department} onChange={(e) => setEditData(p => ({ ...p, department: e.target.value }))} placeholder="Department" autoComplete="off" />
            <Input label="Designation" value={editData.designation} onChange={(e) => setEditData(p => ({ ...p, designation: e.target.value }))} placeholder="Designation" autoComplete="off" />
          </div>
          <Input label="Phone" type="tel" value={editData.phone} onChange={(e) => setEditData(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" autoComplete="off" />
          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Edit} type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* ===== Demote Modal ===== */}
      <Modal isOpen={showDemoteModal} onClose={() => { setShowDemoteModal(false); setUserToDemote(null); }} title="Demote to Regular User">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-yellow-700 p-3 bg-yellow-50 rounded-lg">
            <ArrowDownCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-semibold text-sm">This will remove their elevated dashboard access.</p>
          </div>
          <p className="text-gray-700">
            Demote <strong>{userToDemote?.full_name}</strong> ({getRoleLabel(userToDemote?.role)}) back to a regular <strong>User</strong>? Their account remains active.
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowDemoteModal(false); setUserToDemote(null); }}>Cancel</Button>
            <Button onClick={handleDemote} className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">Demote to User</Button>
          </div>
        </div>
      </Modal>

      {/* Deletion disabled */}

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideDown { animation: slideDown 0.6s ease-out; }
      `}</style>
    </div>
  );
};

export default UserManagement;
