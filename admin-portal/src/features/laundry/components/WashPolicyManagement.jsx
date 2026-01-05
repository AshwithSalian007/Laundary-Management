import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard/components/DashboardLayout';
import washPolicyService from '../services/washPolicyService';

const WashPolicyManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasPermission, setHasPermission] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    total_washes: 30,
    max_weight_per_wash: 7,
    is_active: false,
  });

  // Fetch policies
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const data = await washPolicyService.getAllPolicies(showArchived);
      setPolicies(data.data || []);
      setError('');
      setHasPermission(true);
    } catch (err) {
      const isPermissionError =
        err.status === 403 ||
        (err.message && err.message.toLowerCase().includes('access denied'));

      if (isPermissionError) {
        setHasPermission(false);
        setError(
          err.message ||
            'Access denied. You do not have permission to view this page.'
        );
      } else {
        setError(err.message || 'Failed to fetch policies');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [showArchived]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name || !formData.name.trim()) {
      setModalError('Policy name is required');
      return false;
    }

    const totalWashes = Number(formData.total_washes);
    if (isNaN(totalWashes) || totalWashes < 0) {
      setModalError('Total washes must be a non-negative number');
      return false;
    }

    const maxWeight = Number(formData.max_weight_per_wash);
    if (isNaN(maxWeight) || maxWeight < 0.1) {
      setModalError('Maximum weight per wash must be at least 0.1 kg');
      return false;
    }

    return true;
  };

  // Open modal for adding new policy
  const handleAddClick = () => {
    setSelectedPolicy(null);
    setModalError('');
    setFormData({
      name: '',
      total_washes: 30,
      max_weight_per_wash: 7,
      is_active: false,
    });
    setShowModal(true);
  };

  // Open modal for editing policy
  const handleEditClick = (policy) => {
    setSelectedPolicy(policy);
    setModalError('');
    setFormData({
      name: policy.name,
      total_washes: policy.total_washes,
      max_weight_per_wash: policy.max_weight_per_wash,
      is_active: policy.is_active,
    });
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setModalError('');
      setError('');
      if (selectedPolicy) {
        await washPolicyService.updatePolicy(selectedPolicy._id, formData);
        setSuccess('Policy updated successfully!');
      } else {
        await washPolicyService.createPolicy(formData);
        setSuccess('Policy created successfully!');
      }
      setShowModal(false);
      fetchPolicies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setModalError(err.message || 'Failed to save policy');
    }
  };

  // Handle toggle active/inactive
  const handleToggleActive = async (policy) => {
    try {
      setModalError('');
      setError('');
      const newActiveState = !policy.is_active;
      const updatedData = {
        name: policy.name,
        total_washes: policy.total_washes,
        max_weight_per_wash: policy.max_weight_per_wash,
        is_active: newActiveState,
      };
      await washPolicyService.updatePolicy(policy._id, updatedData);
      setSuccess(`Policy ${newActiveState ? 'activated' : 'deactivated'} successfully!`);
      setShowModal(false);
      fetchPolicies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setModalError(err.message || 'Failed to toggle policy status');
    }
  };

  // Handle delete
  const handleArchive = async (policyId) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) {
      return;
    }
    try {
      setError('');
      await washPolicyService.deletePolicy(policyId);
      setSuccess('Policy deleted successfully!');
      fetchPolicies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete policy');
    }
  };

  // Handle restore
  const handleRestore = async (policyId) => {
    if (!window.confirm('Are you sure you want to restore this policy?')) {
      return;
    }
    try {
      setError('');
      await washPolicyService.restorePolicy(policyId);
      setSuccess('Policy restored successfully!');
      fetchPolicies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to restore policy');
    }
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

  // Show permission denied page
  if (!hasPermission) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Wash Policy Management</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Wash Policy Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {showArchived ? 'Show Active' : 'Show Deleted'}
            </button>
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
            >
              + Add Policy
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}
        {error && hasPermission && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Policies Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Washes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Weight/Wash (kg)
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
              {policies.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No policies found
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {policy.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {policy.total_washes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {policy.max_weight_per_wash} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          policy.isDeleted
                            ? 'bg-red-100 text-red-800'
                            : policy.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {policy.isDeleted ? 'Deleted' : policy.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {!policy.isDeleted ? (
                        <>
                          <button
                            onClick={() => handleEditClick(policy)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleArchive(policy._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(policy._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div
            className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 animate-fadeIn"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedPolicy ? 'Edit Policy' : 'Add Policy'}
              </h2>

              {/* Modal Error Message */}
              {modalError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Policy Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    placeholder="e.g., Default Yearly Policy"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Washes
                  </label>
                  <input
                    type="number"
                    name="total_washes"
                    value={formData.total_washes}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    placeholder="e.g., 30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Weight per Wash (kg)
                  </label>
                  <input
                    type="number"
                    name="max_weight_per_wash"
                    value={formData.max_weight_per_wash}
                    onChange={handleChange}
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    placeholder="e.g., 7"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#228B22] border-gray-300 rounded focus:ring-[#228B22]"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Set as Active Policy
                  </label>
                </div>

                {selectedPolicy && selectedPolicy.is_active && (
                  <div className="pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(selectedPolicy)}
                      className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Deactivate Policy
                    </button>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
                  >
                    {selectedPolicy ? 'Update' : 'Create'} Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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

export default WashPolicyManagement;
