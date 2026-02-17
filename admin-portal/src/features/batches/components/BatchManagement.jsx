import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard/components/DashboardLayout';
import batchService from '../services/batchService';
import departmentService from '../../departments/services/departmentService';

// Helper function to format date as dd-mm-yyyy
const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasPermission, setHasPermission] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewYearsModal, setShowViewYearsModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Form data for create
  const [createFormData, setCreateFormData] = useState({
    department_id: '',
    start_year: '',
    end_year: '',
    year_1_start_date: '',
    year_1_end_date: '',
  });

  // Form data for edit (years array)
  const [editYearsData, setEditYearsData] = useState([]);

  // Form data for promote
  const [promoteFormData, setPromoteFormData] = useState({
    use_active_policy: true,
    total_washes: '',
    max_weight_per_wash: '',
  });

  // Fetch batches and departments on component mount
  useEffect(() => {
    fetchData();
  }, [showArchived]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes, departmentsRes] = await Promise.all([
        batchService.getAllBatches(showArchived),
        departmentService.getAllDepartments(false),
      ]);
      setBatches(batchesRes.data || []);
      setDepartments(departmentsRes.data || []);
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
        setError(err.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Validate years
      const startYear = Number(createFormData.start_year);
      const endYear = Number(createFormData.end_year);

      if (isNaN(startYear) || isNaN(endYear)) {
        setError('Please enter valid years');
        return;
      }

      if (startYear >= endYear) {
        setError('End year must be after start year');
        return;
      }

      if (startYear < 2000 || startYear > 2100 || endYear < 2000 || endYear > 2100) {
        setError('Years must be between 2000 and 2100');
        return;
      }

      // Validate dates (end_date is optional)
      if (createFormData.year_1_end_date) {
        const year1Start = new Date(createFormData.year_1_start_date);
        const year1End = new Date(createFormData.year_1_end_date);

        if (year1End <= year1Start) {
          setError('Year 1 end date must be after start date');
          return;
        }
      }

      await batchService.createBatch(createFormData);
      setSuccess('Batch created successfully!');
      setShowCreateModal(false);
      resetCreateForm();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create batch');
    }
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Validate all years
      for (let i = 0; i < editYearsData.length; i++) {
        const year = editYearsData[i];

        // Start date is required if end date is provided
        if (!year.start_date && year.end_date) {
          setError(`Year ${year.year_no}: Start date is required when end date is provided`);
          return;
        }

        // If both dates are provided, validate end_date > start_date
        if (year.start_date && year.end_date) {
          const startDate = new Date(year.start_date);
          const endDate = new Date(year.end_date);

          if (endDate <= startDate) {
            setError(`Year ${year.year_no}: End date must be after start date`);
            return;
          }
        }
      }

      // Validate no overlapping dates between ANY years (not just consecutive)
      const yearsWithDates = editYearsData.filter(y => y.start_date && y.end_date);

      for (let i = 0; i < yearsWithDates.length - 1; i++) {
        for (let j = i + 1; j < yearsWithDates.length; j++) {
          const yearA = yearsWithDates[i];
          const yearB = yearsWithDates[j];
          const endDateA = new Date(yearA.end_date);
          const startDateB = new Date(yearB.start_date);

          // Check if dates overlap or don't have minimum 1 day gap
          if (endDateA >= startDateB) {
            setError(
              `Year ${yearA.year_no} end date (${formatDate(yearA.end_date)}) must be before Year ${yearB.year_no} start date (${formatDate(yearB.start_date)}). Minimum 1 day gap required.`
            );
            return;
          }
        }
      }

      await batchService.updateBatch(selectedBatch._id, {
        years: editYearsData,
      });
      setSuccess('Batch updated successfully!');
      setShowEditModal(false);
      setSelectedBatch(null);
      setEditYearsData([]);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update batch');
    }
  };

  const handleArchiveBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to archive this batch?')) {
      return;
    }
    try {
      setError('');
      await batchService.deleteBatch(batchId);
      setSuccess('Batch archived successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to archive batch');
    }
  };

  const handleRestoreBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to restore this batch?')) {
      return;
    }
    try {
      setError('');
      await batchService.restoreBatch(batchId);
      setSuccess('Batch restored successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to restore batch');
    }
  };

  const openPromoteModal = (batch) => {
    setError('');
    setSelectedBatch(batch);
    setPromoteFormData({
      use_active_policy: true,
      total_washes: '',
      max_weight_per_wash: '',
    });
    setShowPromoteModal(true);
  };

  const handlePromoteBatch = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Build payload based on form data
      let payload = {};
      if (!promoteFormData.use_active_policy) {
        // Validate custom policy values
        const totalWashes = Number(promoteFormData.total_washes);
        const maxWeight = Number(promoteFormData.max_weight_per_wash);

        if (isNaN(totalWashes) || totalWashes < 0) {
          setError('Total washes must be a non-negative number');
          return;
        }

        if (isNaN(maxWeight) || maxWeight < 0.1) {
          setError('Maximum weight must be at least 0.1 kg');
          return;
        }

        payload.total_washes = totalWashes;
        payload.max_weight_per_wash = maxWeight;
      }

      const result = await batchService.promoteBatch(selectedBatch._id, payload);
      setSuccess(result.message || 'Batch promoted successfully!');
      setShowPromoteModal(false);
      setSelectedBatch(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to promote batch');
    }
  };

  const openEditModal = (batch) => {
    setError('');
    setSelectedBatch(batch);
    // Deep copy years array for editing
    setEditYearsData(
      batch.years.map((year) => ({
        year_no: year.year_no,
        start_date: year.start_date ? year.start_date.split('T')[0] : '',
        end_date: year.end_date ? year.end_date.split('T')[0] : '',
      }))
    );
    setShowEditModal(true);
  };

  const openViewYearsModal = (batch) => {
    setSelectedBatch(batch);
    setShowViewYearsModal(true);
  };

  const resetCreateForm = () => {
    setCreateFormData({
      department_id: '',
      start_year: '',
      end_year: '',
      year_1_start_date: '',
      year_1_end_date: '',
    });
  };

  const handleDepartmentChange = (departmentId) => {
    const department = departments.find((d) => d._id === departmentId);
    if (department && createFormData.start_year) {
      const startYear = Number(createFormData.start_year);
      const endYear = startYear + department.duration_years;
      setCreateFormData({
        ...createFormData,
        department_id: departmentId,
        end_year: endYear.toString(),
      });
    } else {
      setCreateFormData({ ...createFormData, department_id: departmentId });
    }
  };

  const handleStartYearChange = (startYear) => {
    const department = departments.find((d) => d._id === createFormData.department_id);
    if (department && startYear) {
      const endYear = Number(startYear) + department.duration_years;
      setCreateFormData({
        ...createFormData,
        start_year: startYear,
        end_year: endYear.toString(),
      });
    } else {
      setCreateFormData({ ...createFormData, start_year: startYear });
    }
  };

  const updateYearField = (index, field, value) => {
    const updatedYears = [...editYearsData];
    updatedYears[index][field] = value;
    setEditYearsData(updatedYears);
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

  if (!hasPermission) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {showArchived ? 'Show Active' : 'Show Archived'}
            </button>
            <button
              onClick={() => {
                setError('');
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
            >
              + Add Batch
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

        {/* Batches Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year 1 Period
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
              {batches.map((batch) => (
                <tr key={batch._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {batch.batch_label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {batch.department_id?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Year {batch.current_year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {batch.years?.[0]?.start_date
                      ? `${formatDate(batch.years[0].start_date)} to ${
                          batch.years[0]?.end_date
                            ? formatDate(batch.years[0].end_date)
                            : 'Not set'
                        }`
                      : 'Start date not set'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        !batch.isDeleted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {!batch.isDeleted ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openViewYearsModal(batch)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      View Years
                    </button>
                    {!batch.isDeleted ? (
                      <>
                        <button
                          onClick={() => openEditModal(batch)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        {batch.current_year <= batch.department_id?.duration_years && (
                          <button
                            onClick={() => openPromoteModal(batch)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Promote
                          </button>
                        )}
                        <button
                          onClick={() => handleArchiveBatch(batch._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Archive
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleRestoreBatch(batch._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Batch Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 animate-fadeIn"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Batch</h2>

              {/* Error message inside modal */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    required
                    value={createFormData.department_id}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.duration_years} years)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Year
                  </label>
                  <input
                    type="text"
                    value="1"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    New batches always start at Year 1
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Year
                    </label>
                    <input
                      type="number"
                      required
                      min="2000"
                      max="2100"
                      value={createFormData.start_year}
                      onChange={(e) => handleStartYearChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      placeholder="2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Year
                    </label>
                    <input
                      type="number"
                      required
                      min="2000"
                      max="2100"
                      value={createFormData.end_year}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Year 1 Dates
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        required
                        value={createFormData.year_1_start_date}
                        onChange={(e) =>
                          setCreateFormData({
                            ...createFormData,
                            year_1_start_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date <span className="text-gray-500 text-xs">(Optional)</span>
                      </label>
                      <input
                        type="date"
                        value={createFormData.year_1_end_date}
                        onChange={(e) =>
                          setCreateFormData({
                            ...createFormData,
                            year_1_end_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Years 2 onwards will be auto-generated with empty dates that you can
                    edit later.
                  </p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
                  >
                    Create Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setShowCreateModal(false);
                      resetCreateForm();
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

        {/* Edit Batch Modal */}
        {showEditModal && selectedBatch && (
          <div
            className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 animate-fadeIn"
            onClick={() => {
              setShowEditModal(false);
              setSelectedBatch(null);
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Edit Batch: {selectedBatch.batch_label}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Department: {selectedBatch.department_id?.name} | Current Year:{' '}
                {selectedBatch.current_year}
              </p>

              {/* Error message inside modal */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdateBatch} className="space-y-4">
                <div className="space-y-4">
                  {editYearsData.map((year, index) => (
                    <div
                      key={year.year_no}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Year {year.year_no}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date <span className="text-gray-500 text-xs">(Optional)</span>
                          </label>
                          <input
                            type="date"
                            value={year.start_date}
                            onChange={(e) =>
                              updateYearField(index, 'start_date', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date <span className="text-gray-500 text-xs">(Optional)</span>
                          </label>
                          <input
                            type="date"
                            value={year.end_date}
                            onChange={(e) =>
                              updateYearField(index, 'end_date', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
                  >
                    Update Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setShowEditModal(false);
                      setSelectedBatch(null);
                      setEditYearsData([]);
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

        {/* View Years Modal */}
        {showViewYearsModal && selectedBatch && (
          <div
            className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 animate-fadeIn"
            onClick={() => {
              setShowViewYearsModal(false);
              setSelectedBatch(null);
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Years for Batch: {selectedBatch.batch_label}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Department: {selectedBatch.department_id?.name}
              </p>

              <div className="space-y-3">
                {selectedBatch.years?.map((year) => (
                  <div
                    key={year.year_no}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Year {year.year_no}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          year.start_date && year.end_date
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {year.start_date && year.end_date
                          ? 'Dates Set'
                          : 'Dates Pending'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Start Date:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {formatDate(year.start_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">End Date:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {formatDate(year.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowViewYearsModal(false);
                    setSelectedBatch(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Promote Batch Modal */}
        {showPromoteModal && selectedBatch && (
          <div
            className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 animate-fadeIn"
            onClick={() => {
              setShowPromoteModal(false);
              setSelectedBatch(null);
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Promote Batch
              </h2>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Batch:</span> {selectedBatch.batch_label}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Department:</span> {selectedBatch.department_id?.name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Current Year:</span> {selectedBatch.current_year}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Promoting to:</span> Year {selectedBatch.current_year + 1}
                </p>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handlePromoteBatch}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Policy Configuration
                  </label>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="policyType"
                        checked={promoteFormData.use_active_policy}
                        onChange={() =>
                          setPromoteFormData({
                            ...promoteFormData,
                            use_active_policy: true,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Use Active Policy</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="policyType"
                        checked={!promoteFormData.use_active_policy}
                        onChange={() =>
                          setPromoteFormData({
                            ...promoteFormData,
                            use_active_policy: false,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Custom Policy Values</span>
                    </label>
                  </div>
                </div>

                {!promoteFormData.use_active_policy && (
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Washes
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={promoteFormData.total_washes}
                        onChange={(e) =>
                          setPromoteFormData({
                            ...promoteFormData,
                            total_washes: e.target.value,
                          })
                        }
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
                        min="0.1"
                        step="0.1"
                        value={promoteFormData.max_weight_per_wash}
                        onChange={(e) =>
                          setPromoteFormData({
                            ...promoteFormData,
                            max_weight_per_wash: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                        placeholder="e.g., 7.0"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">
                    This will:
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>Close all Year {selectedBatch.current_year} wash plans</li>
                    {selectedBatch.current_year === selectedBatch.department_id?.duration_years ? (
                      <>
                        <li>Mark students as graduated (no new plans created)</li>
                        <li>Update batch to Year {selectedBatch.current_year + 1} (graduated)</li>
                      </>
                    ) : (
                      <>
                        <li>Create Year {selectedBatch.current_year + 1} plans for active students</li>
                        <li>Update batch to Year {selectedBatch.current_year + 1}</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
                  >
                    Promote Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPromoteModal(false);
                      setSelectedBatch(null);
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

export default BatchManagement;
