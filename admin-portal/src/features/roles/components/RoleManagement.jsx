import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard/components/DashboardLayout';
import roleService from '../services/roleService';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasPermission, setHasPermission] = useState(true);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    permissionIds: [],
  });

  // Fetch roles and permissions on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        roleService.getAllRoles(),
        roleService.getAllPermissions(),
      ]);
      setRoles(rolesRes.roles || []);
      setPermissions(permissionsRes.permissions || []);
      setError('');
      setHasPermission(true);
    } catch (err) {
      // Check if it's a permission denied error (403 status or "Access denied" message)
      const isPermissionError = err.status === 403 ||
                                (err.message && err.message.toLowerCase().includes('access denied'));

      if (isPermissionError) {
        setHasPermission(false);
        setError(err.message || 'Access denied. You do not have permission to view this page.');
      } else {
        setError(err.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await roleService.createRole(formData);
      setSuccess('Role created successfully!');
      setShowCreateModal(false);
      setFormData({ name: '', permissionIds: [] });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create role');
    }
  };

  const handleUpdatePermissions = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await roleService.updateRolePermissions(selectedRole._id, formData.permissionIds);
      setSuccess('Role permissions updated successfully!');
      setShowEditModal(false);
      setSelectedRole(null);
      setFormData({ name: '', permissionIds: [] });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update role permissions');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }
    try {
      setError('');
      await roleService.deleteRole(roleId);
      setSuccess('Role deleted successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete role');
    }
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    const permIds = role.permissions.map((p) => p._id);
    setFormData({ ...formData, permissionIds: permIds });
    setShowEditModal(true);
  };

  const togglePermission = (permissionId) => {
    setFormData((prev) => {
      const isSelected = prev.permissionIds.includes(permissionId);
      if (isSelected) {
        return {
          ...prev,
          permissionIds: prev.permissionIds.filter((id) => id !== permissionId),
        };
      } else {
        return {
          ...prev,
          permissionIds: [...prev.permissionIds, permissionId],
        };
      }
    });
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

  // Show permission denied page if user doesn't have access
  if (!hasPermission) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
          >
            + Add Role
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

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div
              key={role._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">{role.name}</h3>
                {role.name !== 'super admin' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(role)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role._id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Permissions:</p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.length === 0 ? (
                    <span className="text-sm text-gray-400 italic">No permissions assigned</span>
                  ) : (
                    role.permissions.map((perm) => (
                      <span
                        key={perm._id}
                        className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm font-medium rounded-md border border-gray-300"
                      >
                        {perm.permission_name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Role Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 animate-fadeIn"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Role</h2>
              <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    placeholder="e.g., Manager, Staff"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions (select multiple)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {permissions.map((permission) => (
                      <label key={permission._id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissionIds.includes(permission._id)}
                          onChange={() => togglePermission(permission._id)}
                          className="w-4 h-4 text-[#228B22] focus:ring-[#228B22] rounded"
                        />
                        <span className="text-sm text-gray-700">{permission.permission_name}</span>
                      </label>
                    ))}
                  </div>
                  {formData.permissionIds.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Please select at least one permission</p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={formData.permissionIds.length === 0}
                    className="flex-1 px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Create Role
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ name: '', permissionIds: [] });
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

        {/* Edit Role Permissions Modal */}
        {showEditModal && selectedRole && (
          <div
            className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 animate-fadeIn"
            onClick={() => {
              setShowEditModal(false);
              setSelectedRole(null);
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Edit Permissions for {selectedRole.name}
              </h2>
              <form onSubmit={handleUpdatePermissions} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions (select multiple)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {permissions.map((permission) => (
                      <label key={permission._id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissionIds.includes(permission._id)}
                          onChange={() => togglePermission(permission._id)}
                          className="w-4 h-4 text-[#228B22] focus:ring-[#228B22] rounded"
                        />
                        <span className="text-sm text-gray-700">{permission.permission_name}</span>
                      </label>
                    ))}
                  </div>
                  {formData.permissionIds.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Please select at least one permission</p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={formData.permissionIds.length === 0}
                    className="flex-1 px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Update Permissions
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedRole(null);
                      setFormData({ name: '', permissionIds: [] });
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

export default RoleManagement;
