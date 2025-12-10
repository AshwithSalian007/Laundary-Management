import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard/components/DashboardLayout';
import staffService from '../services/staffService';
import roleService from '../../roles/services/roleService';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    roleId: '',
  });

  // Fetch staff and roles on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, rolesRes] = await Promise.all([
        staffService.getAllStaff(),
        roleService.getAllRoles(),
      ]);
      setStaff(staffRes.staff || []);
      setRoles(rolesRes.roles || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await staffService.createStaff(formData);
      setSuccess('Staff created successfully!');
      setShowCreateModal(false);
      setFormData({ email: '', password: '', roleId: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create staff');
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await staffService.updateStaffRole(selectedStaff._id, formData.roleId);
      setSuccess('Staff role updated successfully!');
      setShowEditModal(false);
      setSelectedStaff(null);
      setFormData({ email: '', password: '', roleId: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update staff role');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to deactivate this staff member?')) {
      return;
    }
    try {
      setError('');
      await staffService.deleteStaff(staffId);
      setSuccess('Staff deactivated successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to deactivate staff');
    }
  };

  const openEditModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData({ ...formData, roleId: staffMember.role._id });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
          >
            + Add Staff
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {member.role?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {member.role?.permissions?.slice(0, 3).map((perm) => (
                        <span
                          key={perm._id}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {perm.permission_name}
                        </span>
                      ))}
                      {member.role?.permissions?.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{member.role.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(member)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit Role
                    </button>
                    {member.isActive && (
                      <button
                        onClick={() => handleDeleteStaff(member._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Staff Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Staff</h2>
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    required
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id} className="capitalize">
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
                  >
                    Create Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ email: '', password: '', roleId: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Staff Role Modal */}
        {showEditModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Edit Role for {selectedStaff.email}
              </h2>
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Role
                  </label>
                  <select
                    required
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id} className="capitalize">
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
                  >
                    Update Role
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedStaff(null);
                      setFormData({ email: '', password: '', roleId: '' });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffManagement;
