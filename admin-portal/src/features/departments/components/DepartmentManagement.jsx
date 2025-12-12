import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import DashboardLayout from '../../dashboard/components/DashboardLayout';
import departmentService from '../services/departmentService';

const DepartmentManagement = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    duration_years: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentService.getAllDepartments(showDeleted);
      setDepartments(data.departments || []);
      setError('');
    } catch (err) {
      const isPermissionError = err.status === 403 ||
        (err.message && err.message.toLowerCase().includes('access denied'));

      if (isPermissionError) {
        setHasPermission(false);
        setError(err.message || 'Access denied. You do not have permission to view this page.');
      } else {
        setError(err.message || 'Failed to fetch departments');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [showDeleted]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Department name is required';
    }

    if (!formData.duration_years) {
      errors.duration_years = 'Duration is required';
    } else if (Number(formData.duration_years) < 1 || Number(formData.duration_years) > 6) {
      errors.duration_years = 'Duration must be between 1 and 6 years';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open modal for adding new department
  const handleAddClick = () => {
    setSelectedDepartment(null);
    setFormData({ name: '', duration_years: '' });
    setFormErrors({});
    setShowModal(true);
  };

  // Open modal for editing department
  const handleEditClick = (department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      duration_years: department.duration_years,
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      if (selectedDepartment) {
        // Update existing department
        await departmentService.updateDepartment(selectedDepartment._id, formData);
      } else {
        // Create new department
        await departmentService.createDepartment(formData);
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to save department' });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (department) => {
    setSelectedDepartment(department);
    setShowDeleteConfirm(true);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setLoading(true);
      await departmentService.deleteDepartment(selectedDepartment._id);
      setShowDeleteConfirm(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (err) {
      setError(err.message || 'Failed to delete department');
    } finally {
      setLoading(false);
    }
  };

  // Handle restore
  const handleRestore = async (departmentId) => {
    try {
      setLoading(true);
      await departmentService.restoreDepartment(departmentId);
      fetchDepartments();
    } catch (err) {
      setError(err.message || 'Failed to restore department');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Show permission denied page
  if (!hasPermission) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Department Management</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Department Management</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {showDeleted ? 'Show Active' : 'Show Archived'}
            </button>
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#1a6b1a]"
            >
              + Add Department
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && hasPermission && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#228B22]"></div>
          </div>
        )}

        {/* Departments Table */}
        {!loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration (Years)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
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
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No departments found
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{dept.duration_years}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(dept.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(dept.updatedAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {dept.isDeleted ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Archived
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {dept.isDeleted ? (
                          <button
                            onClick={() => handleRestore(dept._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditClick(dept)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(dept)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {selectedDepartment ? 'Edit Department' : 'Add Department'}
              </h2>
              <form onSubmit={handleSubmit}>
                {formErrors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {formErrors.submit}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Department Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22] ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Computer Science"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    name="duration_years"
                    value={formData.duration_years}
                    onChange={handleChange}
                    min="1"
                    max="6"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22] ${
                      formErrors.duration_years ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 4"
                  />
                  {formErrors.duration_years && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.duration_years}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#1a6b1a] disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : selectedDepartment ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the department "{selectedDepartment?.name}"? This will move it to archived.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedDepartment(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DepartmentManagement;
