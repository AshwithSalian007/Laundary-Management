import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard/components/DashboardLayout';
import departmentService from '../services/departmentService';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasPermission, setHasPermission] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    duration_years: '',
  });

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentService.getAllDepartments(showArchived);
      setDepartments(data.data || []);
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
        setError(err.message || 'Failed to fetch departments');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [showArchived]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name || !formData.name.trim()) {
      setError('Department name is required');
      return false;
    }

    if (!formData.duration_years) {
      setError('Duration is required');
      return false;
    }

    const duration = Number(formData.duration_years);
    if (duration < 1 || duration > 6) {
      setError('Duration must be between 1 and 6 years');
      return false;
    }

    return true;
  };

  // Open modal for adding new department
  const handleAddClick = () => {
    setSelectedDepartment(null);
    setFormData({ name: '', duration_years: '' });
    setShowModal(true);
  };

  // Open modal for editing department
  const handleEditClick = (department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      duration_years: department.duration_years,
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
      setError('');
      if (selectedDepartment) {
        await departmentService.updateDepartment(selectedDepartment._id, formData);
        setSuccess('Department updated successfully!');
      } else {
        await departmentService.createDepartment(formData);
        setSuccess('Department created successfully!');
      }
      setShowModal(false);
      fetchDepartments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save department');
    }
  };

  // Handle archive
  const handleArchive = async (departmentId) => {
    if (!window.confirm('Are you sure you want to archive this department?')) {
      return;
    }
    try {
      setError('');
      await departmentService.deleteDepartment(departmentId);
      setSuccess('Department archived successfully!');
      fetchDepartments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to archive department');
    }
  };

  // Handle restore
  const handleRestore = async (departmentId) => {
    if (!window.confirm('Are you sure you want to restore this department?')) {
      return;
    }
    try {
      setError('');
      await departmentService.restoreDepartment(departmentId);
      setSuccess('Department restored successfully!');
      fetchDepartments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to restore department');
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
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {showArchived ? 'Show Active' : 'Show Archived'}
            </button>
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
            >
              + Add Department
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

        {/* Departments Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No departments found
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dept.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dept.duration_years} years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          !dept.isDeleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {!dept.isDeleted ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {!dept.isDeleted ? (
                        <>
                          <button
                            onClick={() => handleEditClick(dept)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleArchive(dept._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Archive
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(dept._id)}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedDepartment ? 'Edit Department' : 'Add Department'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    name="duration_years"
                    value={formData.duration_years}
                    onChange={handleChange}
                    min="1"
                    max="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    placeholder="e.g., 4"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
                  >
                    {selectedDepartment ? 'Update' : 'Create'} Department
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

export default DepartmentManagement;
