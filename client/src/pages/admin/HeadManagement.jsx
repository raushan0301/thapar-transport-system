import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { Users, Plus, Search, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const HeadManagement = () => {
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHead, setSelectedHead] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    department: '',
    phone: '',
    password: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchHeads();
  }, []);

  const fetchHeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*').eq('role', 'head').order('full_name');
      if (error) throw error;
      setHeads(data || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to fetch heads');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHead = async () => {
    if (!formData.full_name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setFormLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: 'head',
            department: formData.department,
            phone: formData.phone,
          }
        }
      });

      if (authError) throw authError;

      // Insert into users table
      if (authData.user) {
        const { error: insertError } = await supabase.from('users').insert([{
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: 'head',
          department: formData.department,
          phone: formData.phone,
          created_at: new Date().toISOString(),
        }]);

        if (insertError) throw insertError;
      }

      toast.success('Head added successfully!');
      setShowAddModal(false);
      setFormData({ full_name: '', email: '', department: '', phone: '', password: '' });
      fetchHeads();
    } catch (err) {
      console.error('Error adding head:', err);
      toast.error(err.message || 'Failed to add head');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditHead = async () => {
    if (!selectedHead) return;

    setFormLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          department: formData.department,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedHead.id);

      if (error) throw error;

      toast.success('Head updated successfully!');
      setShowEditModal(false);
      setSelectedHead(null);
      setFormData({ full_name: '', email: '', department: '', phone: '', password: '' });
      fetchHeads();
    } catch (err) {
      console.error('Error updating head:', err);
      toast.error('Failed to update head');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteHead = async (headId) => {
    if (!window.confirm('Are you sure you want to delete this head? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase.from('users').delete().eq('id', headId);
      if (error) throw error;

      toast.success('Head deleted successfully!');
      fetchHeads();
    } catch (err) {
      console.error('Error deleting head:', err);
      toast.error('Failed to delete head');
    }
  };

  const openEditModal = (head) => {
    setSelectedHead(head);
    setFormData({
      full_name: head.full_name,
      email: head.email,
      department: head.department || '',
      phone: head.phone || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const filteredHeads = heads.filter(h => h.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || h.department?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="mb-8 flex justify-between items-center animate-slideDown">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-8 h-8 text-indigo-600" strokeWidth={1.5} />
              <h1 className="text-4xl font-bold text-gray-900">Head Management</h1>
            </div>
            <p className="text-gray-600">Manage department heads and approvers</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>Add Head</Button>
        </div>

        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
            <input type="text" placeholder="Search heads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {filteredHeads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
            <p className="text-gray-500 mb-4">No heads found</p>
            <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>Add First Head</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
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
                  <tr key={head.id} className="border-b border-gray-100 hover:bg-indigo-50 transition-colors" style={{ animation: 'slideRight 0.4s ease-out', animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                    <td className="px-6 py-4 font-semibold text-gray-900">{head.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{head.email}</td>
                    <td className="px-6 py-4 text-gray-900">{head.department || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{head.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button onClick={() => openEditModal(head)} className="p-2 hover:bg-indigo-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-indigo-600" strokeWidth={1.5} />
                        </button>
                        <button onClick={() => handleDeleteHead(head.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
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

      {/* Add Head Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Head">
        <div className="space-y-4">
          <Input label="Full Name" name="full_name" value={formData.full_name} onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Enter full name" required />
          <Input label="Email" type="email" name="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@thapar.edu" required />
          <Input label="Password" type="password" name="password" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="Create password (min 6 characters)" required />
          <Input label="Department" name="department" value={formData.department} onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))} placeholder="Enter department" />
          <Input label="Phone" type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="Enter phone number" />

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Plus} onClick={handleAddHead} loading={formLoading}>Add Head</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Head Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Head">
        <div className="space-y-4">
          <Input label="Full Name" name="full_name" value={formData.full_name} onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Enter full name" required />
          <Input label="Email" type="email" name="email" value={formData.email} disabled helperText="Email cannot be changed" />
          <Input label="Department" name="department" value={formData.department} onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))} placeholder="Enter department" />
          <Input label="Phone" type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="Enter phone number" />

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Edit} onClick={handleEditHead} loading={formLoading}>Update Head</Button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default HeadManagement;