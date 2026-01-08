import { useState } from 'react';
import washRequestService from '../services/washRequestService';

const WashRequestModal = ({ request, onClose }) => {
  const [weight, setWeight] = useState(request.weight_kg || '');
  const [status, setStatus] = useState(request.status);
  const [cancellationReason, setCancellationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate wash count based on weight
  const calculateWashCount = (weightValue) => {
    if (!weightValue || !request.plan_id?.max_weight_per_wash) return 0;
    return Math.ceil(parseFloat(weightValue) / request.plan_id.max_weight_per_wash);
  };

  const calculatedWashCount = weight ? calculateWashCount(weight) : request.wash_count || 0;
  const remainingWashes = request.plan_id?.remaining_washes || 0;
  const isInsufficientWashes = calculatedWashCount > remainingWashes;

  // Handle weight update
  const handleWeightSubmit = async () => {
    if (!weight || parseFloat(weight) <= 0) {
      setError('Please enter a valid weight greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await washRequestService.updateWeight(request._id, weight);
      onClose(true); // Close and refresh
    } catch (err) {
      setError(err.message || 'Failed to update weight');
      // If auto-cancelled due to insufficient washes, still refresh
      if (err.status === 400 && err.message?.includes('auto-cancelled')) {
        setTimeout(() => onClose(true), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (status === 'cancelled' && !cancellationReason && !request.cancellation_reason) {
      setError('Please provide a cancellation reason');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await washRequestService.updateStatus(request._id, status, cancellationReason || null);
      onClose(true); // Close and refresh
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Get status label
  const getStatusLabel = (statusValue) => {
    const statusLabels = {
      pickup_pending: 'Pickup Pending',
      picked_up: 'Picked Up',
      washing: 'Washing',
      completed: 'Completed',
      returned: 'Returned',
      cancelled: 'Cancelled',
    };
    return statusLabels[statusValue] || statusValue;
  };

  // Check if weight can be edited
  const canEditWeight = request.status !== 'cancelled' && request.status !== 'returned';

  // Check if status can be changed
  const canChangeStatus = request.status !== 'returned';

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 animate-fadeIn overflow-y-auto"
      onClick={() => onClose(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Wash Request Details</h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Student Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Student Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Name</label>
              <div className="font-medium text-gray-900">{request.student_id?.name || 'N/A'}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Roll Number</label>
              <div className="font-medium text-gray-900">{request.student_id?.roll_no || 'N/A'}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Batch</label>
              <div className="font-medium text-gray-900">
                {request.student_id?.batch_id?.name || 'N/A'}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Department</label>
              <div className="font-medium text-gray-900">
                {request.student_id?.batch_id?.department_id?.name || 'N/A'}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <div className="font-medium text-gray-900">{request.student_id?.email || 'N/A'}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Phone</label>
              <div className="font-medium text-gray-900">{request.student_id?.phone || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Wash Plan Information */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Wash Plan Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">Total Washes</label>
              <div className="font-medium text-gray-900">{request.plan_id?.total_washes || 0}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Used Washes</label>
              <div className="font-medium text-gray-900">{request.plan_id?.used_washes || 0}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Remaining Washes</label>
              <div className={`font-bold ${remainingWashes < 5 ? 'text-red-600' : 'text-green-600'}`}>
                {remainingWashes}
              </div>
            </div>
            <div className="col-span-3">
              <label className="text-sm text-gray-600">Max Weight per Wash</label>
              <div className="font-medium text-gray-900">
                {request.plan_id?.max_weight_per_wash || 0} kg
              </div>
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Cloth Count</label>
              <div className="font-medium text-gray-900">{request.cloth_count || 0}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Submitted On</label>
              <div className="font-medium text-gray-900">
                {new Date(request.createdAt).toLocaleString()}
              </div>
            </div>
            {request.notes && (
              <div className="col-span-2">
                <label className="text-sm text-gray-600">Notes from Student</label>
                <div className="font-medium text-gray-900 bg-gray-50 p-2 rounded">
                  {request.notes}
                </div>
              </div>
            )}
            {request.cancellation_reason && (
              <div className="col-span-2">
                <label className="text-sm text-red-600 font-semibold">Cancellation Reason</label>
                <div className="font-medium text-red-900 bg-red-50 p-2 rounded border border-red-200">
                  {request.cancellation_reason}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weight Management */}
        {canEditWeight && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {request.weight_kg ? 'Update Weight' : 'Add Weight'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="0.1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                  placeholder="Enter laundry weight in kg"
                  disabled={loading}
                />
              </div>

              {weight && (
                <div className="bg-white p-3 rounded border border-gray-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Calculated Wash Count:</span>
                    <span className="font-bold text-lg text-gray-900">{calculatedWashCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Available Washes:</span>
                    <span className={`font-bold text-lg ${isInsufficientWashes ? 'text-red-600' : 'text-green-600'}`}>
                      {remainingWashes}
                    </span>
                  </div>
                  {isInsufficientWashes && (
                    <div className="mt-3 bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded text-sm">
                      ⚠️ <strong>Insufficient washes!</strong> This request will be auto-cancelled if submitted.
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleWeightSubmit}
                disabled={loading || !weight}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  loading || !weight
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isInsufficientWashes
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-[#228B22] hover:bg-[#4CAF50] text-white'
                }`}
              >
                {loading
                  ? 'Updating...'
                  : isInsufficientWashes
                  ? 'Submit (Will Auto-Cancel)'
                  : request.weight_kg
                  ? 'Update Weight'
                  : 'Add Weight & Move to Washing'}
              </button>
            </div>
          </div>
        )}

        {/* Status Management */}
        {canChangeStatus && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Status: <span className="font-bold">{getStatusLabel(request.status)}</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                  disabled={loading}
                >
                  <option value="pickup_pending">Pickup Pending</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="washing">Washing</option>
                  <option value="completed">Completed</option>
                  <option value="returned">Returned</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {status === 'cancelled' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cancellation Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    rows="3"
                    placeholder="Enter reason for cancellation..."
                    disabled={loading}
                  />
                </div>
              )}

              {status !== request.status && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={loading}
                  className={`w-full px-4 py-2 rounded-lg transition-colors ${
                    loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {loading ? 'Updating...' : `Update Status to ${getStatusLabel(status)}`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Current Status Display (if cannot edit) */}
        {!canChangeStatus && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Status</h3>
            <div className="text-2xl font-bold text-green-600">{getStatusLabel(request.status)}</div>
            {request.status === 'returned' && request.returned_date && (
              <div className="text-sm text-gray-600 mt-2">
                Returned on: {new Date(request.returned_date).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={() => onClose(false)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WashRequestModal;
