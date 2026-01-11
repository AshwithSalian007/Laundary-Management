import { useState } from 'react';
import washRequestService from '../services/washRequestService';

const WashRequestModal = ({ request, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [weight, setWeight] = useState(request.weight_kg || '');
  const [cancellationReason, setCancellationReason] = useState('');

  // Status workflow
  const statusFlow = {
    pickup_pending: { next: 'picked_up', prev: null, label: 'Pickup Pending' },
    picked_up: { next: 'washing', prev: 'pickup_pending', label: 'Picked Up' },
    washing: { next: 'completed', prev: 'picked_up', label: 'Washing' },
    completed: { next: 'returned', prev: 'washing', label: 'Completed' },
    returned: { next: null, prev: null, label: 'Returned' },
    cancelled: { next: null, prev: null, label: 'Cancelled' },
  };

  const currentStatusInfo = statusFlow[request.status] || {};
  const remainingWashes = request.plan_id?.remaining_washes || 0;
  const canEdit = !['returned', 'cancelled'].includes(request.status);

  // Calculate wash count based on weight
  const calculateWashCount = (weightValue) => {
    if (!weightValue || !request.plan_id?.max_weight_per_wash) return 0;
    return Math.ceil(parseFloat(weightValue) / request.plan_id.max_weight_per_wash);
  };

  const calculatedWashCount = weight ? calculateWashCount(weight) : request.wash_count || 0;
  const isInsufficientWashes = calculatedWashCount > remainingWashes;

  // Handle moving to next status
  const handleNextStatus = async () => {
    // Special handling for moving to washing - requires weight
    if (currentStatusInfo.next === 'washing') {
      setShowWeightInput(true);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await washRequestService.updateStatus(request._id, currentStatusInfo.next);
      onClose(true); // Close and refresh
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Handle moving to previous status
  const handlePrevStatus = async () => {
    if (!currentStatusInfo.prev) return;

    try {
      setLoading(true);
      setError('');
      await washRequestService.updateStatus(request._id, currentStatusInfo.prev);
      onClose(true);
    } catch (err) {
      setError(err.message || 'Failed to revert status');
    } finally {
      setLoading(false);
    }
  };

  // Handle weight submission and move to washing
  const handleWeightSubmit = async () => {
    if (!weight || parseFloat(weight) <= 0) {
      setError('Please enter a valid weight greater than 0');
      return;
    }

    if (isInsufficientWashes) {
      const confirmMessage = `This will AUTO-CANCEL the request due to insufficient washes (needs ${calculatedWashCount}, has ${remainingWashes}). Continue?`;
      if (!window.confirm(confirmMessage)) return;
    }

    try {
      setLoading(true);
      setError('');
      await washRequestService.updateWeight(request._id, weight);
      onClose(true);
    } catch (err) {
      setError(err.message || 'Failed to update weight');
      if (err.status === 400 && err.message?.includes('auto-cancelled')) {
        setTimeout(() => onClose(true), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle cancellation with refund
  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }

    const hasDeductedWashes = ['washing', 'completed', 'returned'].includes(request.status);
    const confirmMessage = hasDeductedWashes
      ? `This will REFUND ${request.wash_count} washes and cancel the request. Continue?`
      : 'Cancel this request?';

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      setError('');
      await washRequestService.updateStatus(request._id, 'cancelled', cancellationReason);
      onClose(true);
    } catch (err) {
      setError(err.message || 'Failed to cancel request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pickup_pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      washing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      returned: 'bg-teal-100 text-teal-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 animate-fadeIn overflow-y-auto"
      onClick={() => onClose(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-600 mb-1">Current Status</h3>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                {currentStatusInfo.label}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Submitted</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(request.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Student Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Name</label>
              <div className="font-medium text-gray-900">{request.student_id?.name || 'N/A'}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Roll Number</label>
              <div className="font-medium text-gray-900">{request.student_id?.registration_number || 'N/A'}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Batch</label>
              <div className="font-medium text-gray-900">
                {request.student_id?.batch_id?.batch_label || 'N/A'}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Department</label>
              <div className="font-medium text-gray-900">
                {request.student_id?.batch_id?.department_id?.name || 'N/A'}
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
              <div className="font-medium text-gray-900">{request.cloth_count || 0} items</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Weight</label>
              <div className="font-medium text-gray-900">
                {request.weight_kg ? `${request.weight_kg} kg` : 'Not added yet'}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Washes Used</label>
              <div className="font-medium text-gray-900">{request.wash_count || 0}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Remaining Washes</label>
              <div className={`font-bold text-lg ${remainingWashes < 5 ? 'text-red-600' : 'text-green-600'}`}>
                {remainingWashes}
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

        {/* Weight Input (only shows when moving to washing) */}
        {showWeightInput && canEdit && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">⚖️</span>
              Add Weight to Move to Washing
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min="0.1"
                  step="0.1"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg"
                  placeholder="Enter laundry weight"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {weight && (
                <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <span className="text-sm text-gray-600">Calculated Washes:</span>
                      <span className="ml-2 font-bold text-xl text-gray-900">{calculatedWashCount}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Available Washes:</span>
                      <span className={`ml-2 font-bold text-xl ${isInsufficientWashes ? 'text-red-600' : 'text-green-600'}`}>
                        {remainingWashes}
                      </span>
                    </div>
                  </div>
                  {isInsufficientWashes && (
                    <div className="mt-3 bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded text-sm">
                      ⚠️ <strong>Insufficient washes!</strong> This request will be auto-cancelled.
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowWeightInput(false);
                    setWeight(request.weight_kg || '');
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWeightSubmit}
                  disabled={loading || !weight}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium ${
                    loading || !weight
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isInsufficientWashes
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                >
                  {loading ? 'Saving...' : isInsufficientWashes ? 'Submit (Will Auto-Cancel)' : 'Confirm & Move to Washing'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Input */}
        {showCancelInput && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
              <span className="text-2xl mr-2">🚫</span>
              Cancel Request
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="3"
                  placeholder="Enter reason for cancellation..."
                  disabled={loading}
                  autoFocus
                />
              </div>

              {['washing', 'completed', 'returned'].includes(request.status) && request.wash_count > 0 && (
                <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded text-sm">
                  💰 <strong>Note:</strong> {request.wash_count} washes will be refunded to student's plan.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelInput(false);
                    setCancellationReason('');
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading || !cancellationReason.trim()}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium ${
                    loading || !cancellationReason.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canEdit && !showWeightInput && !showCancelInput && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Actions</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Previous Status Button */}
              {currentStatusInfo.prev && (
                <button
                  onClick={handlePrevStatus}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center"
                >
                  <span className="text-xl mr-2">←</span>
                  Back to {statusFlow[currentStatusInfo.prev]?.label}
                </button>
              )}

              {/* Next Status Button */}
              {currentStatusInfo.next && (
                <button
                  onClick={handleNextStatus}
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center ${
                    currentStatusInfo.next === 'washing'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white col-span-2'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  Move to {statusFlow[currentStatusInfo.next]?.label}
                  <span className="text-xl ml-2">→</span>
                </button>
              )}
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowCancelInput(true)}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium border border-red-300"
            >
              🚫 Cancel Request
            </button>
          </div>
        )}

        {/* Close Button for completed states */}
        {!canEdit && (
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => onClose(false)}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WashRequestModal;
