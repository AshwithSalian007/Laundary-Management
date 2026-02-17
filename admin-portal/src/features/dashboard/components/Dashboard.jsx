import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import DashboardLayout from './DashboardLayout';
import dashboardService from '../services/dashboardService';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      // Use Promise.allSettled so one failure doesn't block the other
      const [statsResult, recentResult] = await Promise.allSettled([
        dashboardService.getWashRequestStats(),
        dashboardService.getRecentWashRequests(5),
      ]);

      // Handle stats response
      if (statsResult.status === 'fulfilled' && statsResult.value.success) {
        setStats(statsResult.value.data);
      }

      // Handle recent requests response
      if (recentResult.status === 'fulfilled' && recentResult.value.success) {
        setRecentRequests(recentResult.value.data || []);
      }

      // Set error only if both failed
      if (statsResult.status === 'rejected' && recentResult.status === 'rejected') {
        setError('Failed to load dashboard data. Please try again.');
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  // Calculate active orders (pickup_pending + picked_up + washing)
  const activeOrders = stats
    ? (stats.pickup_pending || 0) + (stats.picked_up || 0) + (stats.washing || 0)
    : 0;

  // Status badge colors
  const getStatusBadge = (status) => {
    const statusConfig = {
      pickup_pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pickup Pending' },
      picked_up: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Picked Up' },
      washing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Washing' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      returned: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Returned' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
    };
    return statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h2>
          <p className="text-gray-600">
            Your role: <span className="font-medium text-[#228B22] capitalize">{user?.roleName}</span>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Stats Grid - Laundry Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pickup Pending */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pickup Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats?.pickup_pending || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Orders (In Progress) */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : activeOrders}
                </p>
                {!loading && stats && (
                  <p className="text-xs text-gray-500 mt-1">
                    In washing: {stats.washing || 0}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats?.completed || 0}
                </p>
                {!loading && stats && (
                  <p className="text-xs text-gray-500 mt-1">
                    Returned: {stats.returned || 0}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Requests */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '-' : stats?.total || 0}
                </p>
                {!loading && stats && stats.cancelled > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Cancelled: {stats.cancelled}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Wash Requests</h3>
            <p className="text-sm text-gray-500 mt-1">Latest activity in the system</p>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : recentRequests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No wash requests yet</div>
            ) : (
              recentRequests.map((request) => {
                const statusBadge = getStatusBadge(request.status);
                return (
                  <div key={request._id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {request.student_id?.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {request.student_id?.name || 'Unknown Student'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {request.student_id?.registration_number || 'N/A'} • {request.cloth_count || 0} clothes
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Role and Permissions Info */}
        {user?.roleName && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Role & Permissions
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Role: </span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {user.roleName}
                </span>
              </div>
              {user.permissions && user.permissions.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600 block mb-2">Permissions:</span>
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.map((permission, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#228B22] bg-opacity-10 text-[#e8f3e8] text-xs font-medium rounded-full"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
