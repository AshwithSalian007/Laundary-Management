import axiosInstance from '../../../config/axios';

const batchService = {
  /**
   * Get all batches
   * @param {boolean} includeDeleted - Whether to include soft-deleted batches
   * @returns {Promise} API response with batches array
   */
  getAllBatches: async (includeDeleted = false) => {
    const params = includeDeleted ? { includeDeleted: 'true' } : {};
    const response = await axiosInstance.get('/admin/batches', { params });
    return response.data;
  },

  /**
   * Create new batch
   * @param {Object} batchData - Batch data object
   * @param {string} batchData.department_id - Department ID
   * @param {string} batchData.start_year - Start year (e.g., "2024")
   * @param {string} batchData.end_year - End year (e.g., "2028")
   * @param {string} batchData.year_1_start_date - Year 1 start date
   * @param {string} batchData.year_1_end_date - Year 1 end date
   * @returns {Promise} API response with created batch
   */
  createBatch: async (batchData) => {
    const response = await axiosInstance.post('/admin/batches', batchData);
    return response.data;
  },

  /**
   * Update batch (only years array can be updated)
   * @param {string} batchId - Batch ID
   * @param {Object} batchData - Batch data object
   * @param {Array} batchData.years - Years array with updated dates
   * @returns {Promise} API response with updated batch
   */
  updateBatch: async (batchId, batchData) => {
    const response = await axiosInstance.put(`/admin/batches/${batchId}`, batchData);
    return response.data;
  },

  /**
   * Soft delete batch
   * @param {string} batchId - Batch ID to delete
   * @returns {Promise} API response
   */
  deleteBatch: async (batchId) => {
    const response = await axiosInstance.delete(`/admin/batches/${batchId}`);
    return response.data;
  },

  /**
   * Restore soft deleted batch
   * @param {string} batchId - Batch ID to restore
   * @returns {Promise} API response with restored batch
   */
  restoreBatch: async (batchId) => {
    const response = await axiosInstance.put(`/admin/batches/${batchId}/restore`);
    return response.data;
  },
};

export default batchService;
