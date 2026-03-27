import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { Users, UserCheck, Search, Edit, Trash2, ArrowDownCircle, ArrowUpCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const HeadManagement = () => {
  const [heads, setHeads] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Modals
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDemoteModal, setShowDemoteModal] = useState(false);

  const [selectedHead, setSelectedHead] = useState(null);
  const [headToDelete, setHeadToDelete] = useState(null);
  const [headToDemote, setHeadToDemote] = useState(null);
  const [userToPromote, setUserToPromote] = useState(null);

  const [editData, setEditData] = useState({ full_name: '', department: '', phone: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [headsRes, usersRes] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'head').order('full_name'),
        supabase.from('users').select('*').eq('role', 'user').order('full_name'),
      ]);
      if (headsRes.error) throw headsRes.error;
      if (usersRes.error) throw usersRes.error;
      setHeads(headsRes.data || []);
      setAllUsers(usersRes.data || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Promote a regular user to head
  const handlePromote = async () => {
    if (!userToPromote) return;
    setFormLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'head', updated_at: new Date().toISOString() })
        .eq('id', userToPromote.id);

      if (error) throw error;

      toast.success(`${userToPromote.full_name} has been promoted to Department Head!`);
      setShowPromoteModal(false);
      setUserToPromote(null);
      setUserSearch('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to promote user');
    } finally {
      setFormLoading(false);
    }
  };

  // Demote head back to regular user
  const handleDemote = async () => {
    if (!headToDemote) return;
    setFormLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'user', updated_at: new Date().toISOString() })
        .eq('id', headToDemote.id);

      if (error) throw error;

      toast.success(`${headToDemote.full_name} has been demoted to regular user.`);
      setShowDemoteModal(false);
      setHeadToDemote(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to demote head');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit head profile info
  const handleEditHead = async () => {
    if (!selectedHead) return;
    setFormLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editData.full_name,
          department: editData.department,
          phone: editData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedHead.id);

      if (error) throw error;

      toast.success('Head profile updated!');
      setShowEditModal(false);
      setSelectedHead(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update head');
    } finally {
      setFormLoading(false);
    }
  };

  // Hard delete from Auth + DB
  const handleDeleteHead = async () => {
    if (!headToDelete) return;
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${apiBase}/users/${headToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to delete');
      toast.success('Head account deleted successfully!');
      setShowDeleteModal(false);
      setHeadToDelete(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete head');
    }
  };

  const openEditModal = (head) => {
    setSelectedHead(head);
    setEditData({ full_name: head.full_name, department: head.department || '', phone: head.phone || '' });
    setShowEditModal(true);
  };

  const filteredHeads = heads.filter(h =>
    h.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64"><Loader size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8 flex justify-between items-center animate-slideDown">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <UserCheck className="w-8 h-8 text-indigo-600" strokeWidth={1.5} />
              <h1 className="text-4xl font-bold text-gray-900">Head Management</h1>
            </div>
            <p className="text-gray-500">Select an existing registered user and promote them to Department Head.</p>
          </div>
          <Button variant="primary" icon={ArrowUpCircle} onClick={() => setShowPromoteModal(true)}>
            Promote User to Head
          </Button>
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <Shield className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-indigo-800">
            <strong>Workflow:</strong> Users must first register their own account from the <em>Sign Up</em> page.
            Once registered, you can select any user here and promote them to a Department Head role.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200"
          style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search current heads by name or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Heads Table */}
        {filteredHeads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center"
            style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
            <p className="text-gray-500 mb-2 font-medium">No Department Heads assigned yet</p>
            <p className="text-sm text-gray-400 mb-6">Users must sign up first, then you can promote them here.</p>
            <Button variant="primary" icon={ArrowUpCircle} onClick={() => setShowPromoteModal(true)}>
              Promote a User to Head
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHeads.map((head, i) => (
                  <tr key={head.id} className="border-b border-gray-100 hover:bg-indigo-50 transition-colors"
                    style={{ animation: 'slideRight 0.4s ease-out', animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                    <td className="px-6 py-4 font-semibold text-gray-900">{head.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{head.email}</td>
                    <td className="px-6 py-4 text-gray-900">{head.department || <span className="text-gray-400 italic text-sm">Not set</span>}</td>
                    <td className="px-6 py-4 text-gray-600">{head.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button onClick={() => openEditModal(head)} className="p-2 hover:bg-indigo-100 rounded-lg transition-colors" title="Edit profile">
                          <Edit className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => { setHeadToDemote(head); setShowDemoteModal(true); }} className="p-2 hover:bg-yellow-50 rounded-lg transition-colors" title="Demote to User">
                          <ArrowDownCircle className="w-4 h-4 text-yellow-600" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => { setHeadToDelete(head); setShowDeleteModal(true); }} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete account">
                          <Trash2 className="w-4 h-4 text-red-600" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardLayout>

      {/* ===== Promote User Modal ===== */}
      <Modal isOpen={showPromoteModal} onClose={() => { setShowPromoteModal(false); setUserToPromote(null); setUserSearch(''); }} title="Promote User to Head">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select a registered user to promote to Department Head.</p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                {allUsers.length === 0
                  ? 'No regular users registered yet. Ask users to sign up first.'
                  : 'No users match your search.'}
              </div>
            ) : (
              filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => setUserToPromote(u)}
                  className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center space-x-3 ${userToPromote?.id === u.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{u.full_name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  {userToPromote?.id === u.id && (
                    <span className="ml-auto text-indigo-600 text-xs font-semibold">Selected ✓</span>
                  )}
                </button>
              ))
            )}
          </div>

          {userToPromote && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-800">
              <strong>{userToPromote.full_name}</strong> will be promoted to <strong>Department Head</strong> and gain access to the Head approval dashboard.
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => { setShowPromoteModal(false); setUserToPromote(null); setUserSearch(''); }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={ArrowUpCircle}
              onClick={handlePromote}
              loading={formLoading}
              disabled={!userToPromote}
            >
              Promote to Head
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== Edit Head Modal ===== */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Head Profile">
        <form onSubmit={(e) => { e.preventDefault(); handleEditHead(); }} className="space-y-4">
          <Input label="Full Name" value={editData.full_name} onChange={(e) => setEditData(p => ({ ...p, full_name: e.target.value }))} placeholder="Full name" required autoComplete="off" />
          <Input label="Email" value={selectedHead?.email || ''} disabled helperText="Email cannot be changed" />
          <Input label="Department" value={editData.department} onChange={(e) => setEditData(p => ({ ...p, department: e.target.value }))} placeholder="e.g. EIED, CSED" autoComplete="off" />
          <Input label="Phone" type="tel" value={editData.phone} onChange={(e) => setEditData(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" autoComplete="off" />
          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Edit} type="submit" loading={formLoading}>Update Profile</Button>
          </div>
        </form>
      </Modal>

      {/* ===== Demote Confirmation ===== */}
      <Modal isOpen={showDemoteModal} onClose={() => { setShowDemoteModal(false); setHeadToDemote(null); }} title="Demote to Regular User">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-yellow-700 p-3 bg-yellow-50 rounded-lg">
            <ArrowDownCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-semibold text-sm">This will remove their Head dashboard access.</p>
          </div>
          <p className="text-gray-700">
            Demote <strong>{headToDemote?.full_name}</strong> back to a regular user? Their account will remain active but they will lose all Head privileges.
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowDemoteModal(false); setHeadToDemote(null); }}>Cancel</Button>
            <Button onClick={handleDemote} loading={formLoading} className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">Demote to User</Button>
          </div>
        </div>
      </Modal>

      {/* ===== Delete Confirmation ===== */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setHeadToDelete(null); }} title="Delete Head Account">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-red-600 p-3 bg-red-50 rounded-lg">
            <Trash2 className="w-6 h-6 flex-shrink-0" />
            <p className="font-semibold text-sm">This permanently deletes the account. Cannot be undone.</p>
          </div>
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{headToDelete?.full_name}</strong>? Their login access will be fully revoked.
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setHeadToDelete(null); }}>Cancel</Button>
            <Button onClick={handleDeleteHead} className="bg-red-600 hover:bg-red-700 text-white border-0">Delete Account</Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default HeadManagement;