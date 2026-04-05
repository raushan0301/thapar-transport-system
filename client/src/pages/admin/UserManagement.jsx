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
  Shield,
  CreditCard,
  Truck,
  CheckCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'user', label: 'User', color: 'blue', icon: Users },
  { value: 'head', label: 'Head', color: 'purple', icon: Briefcase },
  { value: 'admin', label: 'Admin', color: 'red', icon: Shield },
  { value: 'registrar', label: 'Registrar', color: 'green', icon: Shield },
  { value: 'driver', label: 'Driver', color: 'teal', icon: Truck },
];

const getRoleColor = (role) => ROLES.find(r => r.value === role)?.color || 'gray';
const getRoleLabel = (role) => ROLES.find(r => r.value === role)?.label || role;

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({ 
    full_name: '', 
    department: '', 
    designation: '', 
    phone: '',
    // Driver fields
    license_number: '',
    license_expiry: '',
    assigned_vehicle_id: '',
    is_available: true
  });
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

  useEffect(() => { 
    fetchAllData(); 
  }, []);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drivers.find(d => d.user_id === u.id)?.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    setFilteredUsers(filtered);
  }, [users, drivers, searchTerm, filterRole]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (userError) throw userError;

      // 2. Fetch Drivers
      const { data: driverData } = await supabase
        .from('drivers')
        .select(`*, vehicle:vehicles(id, vehicle_number, vehicle_type)`);
      setDrivers(driverData || []);

      // 3. Fetch Vehicles
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('id, vehicle_number, vehicle_type')
        .order('vehicle_number', { ascending: true });
      setVehicles(vehicleData || []);

      setUsers(userData || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

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

      if (targetRole === 'driver') {
        const existingDriver = drivers.find(d => d.user_id === userToPromote.id);
        if (!existingDriver) {
          await supabase.from('drivers').insert([{
            full_name: userToPromote.full_name,
            phone: userToPromote.phone || '',
            license_number: 'PENDING',
            user_id: userToPromote.id,
            is_available: true,
            notes: 'Auto-created on promotion.'
          }]);
        }
      }

      toast.success(`${userToPromote.full_name} promoted to ${getRoleLabel(targetRole)}!`);
      setShowPromoteModal(false);
      setUserToPromote(null);
      setUserSearch('');
      fetchAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to promote user');
    } finally {
      setPromoting(false);
    }
  };

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
      fetchAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to demote');
    }
  };

  const openEditModal = (u) => {
    const driverRecord = drivers.find(d => d.user_id === u.id);
    setEditingUser(u);
    setEditData({ 
      full_name: u.full_name || '', 
      department: u.department || '', 
      designation: u.designation || '', 
      phone: u.phone || '',
      license_number: driverRecord?.license_number || '',
      license_expiry: driverRecord?.license_expiry || '',
      assigned_vehicle_id: driverRecord?.assigned_vehicle_id || '',
      is_available: driverRecord?.is_available ?? true
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editData.full_name,
          department: editData.department,
          designation: editData.designation,
          phone: editData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);
      if (error) throw error;

      if (editingUser.role === 'driver') {
        const driverRecord = drivers.find(d => d.user_id === editingUser.id);
        if (driverRecord) {
           await supabase.from('drivers').update({
              full_name: editData.full_name,
              phone: editData.phone,
              license_number: editData.license_number,
              license_expiry: editData.license_expiry || null,
              assigned_vehicle_id: editData.assigned_vehicle_id || null,
              is_available: editData.is_available
           }).eq('id', driverRecord.id);
        }
      }

      toast.success('User updated successfully!');
      setShowEditModal(false);
      fetchAllData();
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
              <p className="text-gray-500">Manage roles for registered users. Promote users to Admin, Registrar, or Driver.</p>
            </div>
            <Button variant="primary" icon={ArrowUpCircle} onClick={() => setShowPromoteModal(true)}>
              Promote User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {ROLES.map(r => (
            <div key={r.value} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setFilterRole(filterRole === r.value ? 'all' : r.value)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{r.label}s</p>
                  <p className={`text-2xl font-bold text-${r.color}-600`}>{users.filter(u => u.role === r.value).length}</p>
                </div>
                <r.icon className={`w-8 h-8 text-${r.color}-400 group-hover:scale-110 transition-transform`} strokeWidth={1.5} />
              </div>
              <div className={`mt-3 h-1 rounded-full bg-${r.color}-100 overflow-hidden`}>
                <div className={`h-full w-0 group-hover:w-full bg-${r.color}-500 transition-all duration-500 rounded-full`} />
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search name, email, department, or license..." value={searchTerm}
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No matching users found</td></tr>
                ) : (
                  filteredUsers.map((u) => {
                    const color = getRoleColor(u.role);
                    const isDriver = u.role === 'driver';
                    const driver = drivers.find(d => d.user_id === u.id);
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full bg-${color}-100 text-${color}-700 flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                              {u.full_name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                               <p className="font-medium text-gray-900 text-sm">{u.full_name} {isSelf && <span className="text-xs text-blue-500">(you)</span>}</p>
                               <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-${color}-100 text-${color}-700 mt-1`}>{u.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           {isDriver ? (
                              <div className="space-y-1">
                                 <p className="text-xs font-medium text-gray-700 flex items-center gap-1"><CreditCard className="w-3 h-3"/> {driver?.license_number || 'No License'}</p>
                                 <p className="text-[10px] text-gray-400 flex items-center gap-1"><Truck className="w-3 h-3"/> {driver?.vehicle?.vehicle_number || 'No Vehicle'}</p>
                              </div>
                           ) : (
                              <div className="space-y-1">
                                 <p className="text-sm text-gray-900">{u.department || '—'}</p>
                                 <p className="text-[10px] text-gray-400 uppercase tracking-wider">{u.designation || '—'}</p>
                              </div>
                           )}
                        </td>
                        <td className="px-6 py-4">
                           {isDriver ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${driver?.is_available ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                 {driver?.is_available ? <CheckCircle className="w-3 h-3"/> : <Clock className="w-3 h-3" />}
                                 {driver?.is_available ? 'Available' : 'On Duty'}
                              </span>
                           ) : (
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Account</span>
                           )}
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-xs text-gray-600 flex items-center"><Mail className="w-3 h-3 mr-1"/>{u.email}</p>
                           <p className="text-[10px] text-gray-400 mt-1 flex items-center"><Phone className="w-3 h-3 mr-1"/>{u.phone || 'No phone'}</p>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                           <button onClick={() => openEditModal(u)}
                             className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex">
                             <Edit className="w-4 h-4" />
                           </button>
                           {!isSelf && u.role !== 'user' && (
                              <button onClick={() => { setUserToDemote(u); setShowDemoteModal(true); }}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors inline-flex">
                                <ArrowDownCircle className="w-4 h-4" />
                              </button>
                           )}
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

      {/* Modals remain structurally similar but consistent with original styling */}
      
      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User Profile">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input label="Full Name" value={editData.full_name} onChange={(e) => setEditData(p => ({ ...p, full_name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Department" value={editData.department} onChange={(e) => setEditData(p => ({ ...p, department: e.target.value }))} />
            <Input label="Designation" value={editData.designation} onChange={(e) => setEditData(p => ({ ...p, designation: e.target.value }))} />
          </div>
          <Input label="Phone" value={editData.phone} onChange={(e) => setEditData(p => ({ ...p, phone: e.target.value }))} />

          {editingUser?.role === 'driver' && (
             <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-teal-800 uppercase tracking-widest">Driver Specification</h4>
                <div className="grid grid-cols-2 gap-3">
                   <Input label="License No." value={editData.license_number} onChange={(e) => setEditData(p => ({ ...p, license_number: e.target.value }))} />
                   <Input label="Expiry Date" type="date" value={editData.license_expiry} onChange={(e) => setEditData(p => ({ ...p, license_expiry: e.target.value }))} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">Assigned Vehicle</label>
                   <select 
                      value={editData.assigned_vehicle_id}
                      onChange={(e) => setEditData(p => ({ ...p, assigned_vehicle_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                   >
                      <option value="">None</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number} ({v.vehicle_type})</option>)}
                   </select>
                </div>
                <div className="flex items-center gap-2">
                   <input type="checkbox" checked={editData.is_available} onChange={(e) => setEditData(p => ({ ...p, is_available: e.target.checked }))} />
                   <span className="text-xs font-medium text-gray-700">Available for duty</span>
                </div>
             </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={saving} icon={Edit}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Promotion Modal */}
      <Modal isOpen={showPromoteModal} onClose={() => { setShowPromoteModal(false); setUserToPromote(null); setUserSearch(''); }} title="Promote User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Role</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLES.filter(r => r.value !== 'user').map(r => (
                <button key={r.value} type="button" onClick={() => setTargetRole(r.value)}
                  className={`py-2 border-2 rounded-lg text-xs font-bold uppercase transition-all ${targetRole === r.value ? `border-${r.color}-500 bg-${r.color}-50 text-${r.color}-700` : 'border-gray-100 text-gray-400'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search user..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="max-h-48 overflow-y-auto border rounded-xl divide-y">
            {promotableUsers.map(u => (
               <button key={u.id} onClick={() => setUserToPromote(u)}
                 className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${userToPromote?.id === u.id ? 'bg-blue-50' : ''}`}>
                 <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">{u.full_name?.charAt(0)}</div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{u.email}</p>
                 </div>
                 {userToPromote?.id === u.id && <CheckCircle className="w-4 h-4 text-blue-500" />}
               </button>
            ))}
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowPromoteModal(false)}>Cancel</Button>
            <Button variant="primary" icon={ArrowUpCircle} onClick={handlePromote} loading={promoting} disabled={!userToPromote}>Confirm Promotion</Button>
          </div>
        </div>
      </Modal>

      {/* Demote Modal */}
      <Modal isOpen={showDemoteModal} onClose={() => setShowDemoteModal(false)} title="Demote User">
        <div className="space-y-4">
          <p className="text-gray-700">Demote <strong>{userToDemote?.full_name}</strong> to a regular user?</p>
          <div className="flex justify-end space-x-3">
             <Button variant="secondary" onClick={() => setShowDemoteModal(false)}>Cancel</Button>
             <Button className="bg-yellow-500 hover:bg-yellow-600 text-white border-0" onClick={handleDemote}>Demote</Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideDown { animation: slideDown 0.6s ease-out; }
      `}</style>
    </div>
  );
};

export default UserManagement;
