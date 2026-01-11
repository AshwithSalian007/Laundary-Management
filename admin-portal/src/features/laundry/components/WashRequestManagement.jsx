import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard/components/DashboardLayout';
import washRequestService from '../services/washRequestService';
import WashRequestModal from './WashRequestModal';

const WashRequestManagement = () => {
  const [washRequests, setWashRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasPermission, setHasPermission] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch wash requests
  const fetchWashRequests = async () => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter || undefined,
        page: currentPage,
        limit: 20,
      };

      const data = await washRequestService.getAllWashRequests(filters);
      setWashRequests(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
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
        setError(err.message || 'Failed to fetch wash requests');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const data = await washRequestService.getStats();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchWashRequests();
    fetchStats();
  }, [statusFilter, currentPage]);

  // Handle view request details
  const handleViewRequest = async (request) => {
    try {
      const data = await washRequestService.getWashRequestById(request._id);
      setSelectedRequest(data.data);
      setShowModal(true);
    } catch (err) {
      setError(err.message || 'Failed to load request details');
    }
  };

  // Handle modal close and refresh
  const handleModalClose = (shouldRefresh) => {
    setShowModal(false);
    setSelectedRequest(null);
    if (shouldRefresh) {
      fetchWashRequests();
      fetchStats();
      setSuccess('Request updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusColors = {
      pickup_pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      washing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      returned: 'bg-teal-100 text-teal-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status label
  const getStatusLabel = (status) => {
    const statusLabels = {
      pickup_pending: 'Pickup Pending',
      picked_up: 'Picked Up',
      washing: 'Washing',
      completed: 'Completed',
      returned: 'Returned',
      cancelled: 'Cancelled',
    };
    return statusLabels[status] || status;
  };

  if (loading && !washRequests.length) {
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
          <h1 className="text-2xl font-bold text-gray-900">Wash Request Management</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Wash Request Management</h1>
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

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-600 font-medium">Pickup Pending</div>
              <div className="text-2xl font-bold text-yellow-900">{stats.pickup_pending}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Picked Up</div>
              <div className="text-2xl font-bold text-blue-900">{stats.picked_up}</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">Washing</div>
              <div className="text-2xl font-bold text-purple-900">{stats.washing}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Completed</div>
              <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="text-sm text-teal-600 font-medium">Returned</div>
              <div className="text-2xl font-bold text-teal-900">{stats.returned}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-600 font-medium">Cancelled</div>
              <div className="text-2xl font-bold text-red-900">{stats.cancelled}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
              >
                <option value="">All Statuses</option>
                <option value="pickup_pending">Pickup Pending</option>
                <option value="picked_up">Picked Up</option>
                <option value="washing">Washing</option>
                <option value="completed">Completed</option>
                <option value="returned">Returned</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button
              onClick={() => {
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Wash Requests Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cloth Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wash Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {washRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      No wash requests found
                    </td>
                  </tr>
                ) : (
                  washRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.student_id?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.student_id?.registration_number || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.student_id?.batch_id?.batch_label || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.cloth_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.weight_kg ? `${request.weight_kg} kg` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.wash_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewRequest(request)}
                          className="text-[#228B22] hover:text-[#4CAF50]"
                        >
                          View/Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedRequest && (
          <WashRequestModal
            request={selectedRequest}
            onClose={handleModalClose}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default WashRequestManagement;
