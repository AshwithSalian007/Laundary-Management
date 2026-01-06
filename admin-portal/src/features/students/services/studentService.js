import axiosInstance from '../../../config/axios';

const studentService = {
  /**
   * Get all students
   * @param {boolean} includeDeleted - Whether to include soft-deleted students
   * @returns {Promise} API response with students array
   */
  getAllStudents: async (includeDeleted = false) => {
    const params = includeDeleted ? { includeDeleted: 'true' } : {};
    const response = await axiosInstance.get('/admin/students', { params });
    return response.data;
  },

  /**
   * Create new student
   * @param {Object} studentData - Student data object
   * @returns {Promise} API response with created student
   */
  createStudent: async (studentData) => {
    const response = await axiosInstance.post('/admin/students', studentData);
    return response.data;
  },

  /**
   * Update student
   * @param {string} studentId - Student ID
   * @param {Object} studentData - Student data object
   * @returns {Promise} API response with updated student
   */
  updateStudent: async (studentId, studentData) => {
    const response = await axiosInstance.put(`/admin/students/${studentId}`, studentData);
    return response.data;
  },

  /**
   * Soft delete student
   * @param {string} studentId - Student ID to delete
   * @returns {Promise} API response
   */
  deleteStudent: async (studentId) => {
    const response = await axiosInstance.delete(`/admin/students/${studentId}`);
    return response.data;
  },

  /**
   * Restore soft deleted student
   * @param {string} studentId - Student ID to restore
   * @returns {Promise} API response with restored student
   */
  restoreStudent: async (studentId) => {
    const response = await axiosInstance.put(`/admin/students/${studentId}/restore`);
    return response.data;
  },

  /**
   * Get students without wash plan
   * @returns {Promise} API response with students without wash plan
   */
  getStudentsWithoutWashPlan: async () => {
    const response = await axiosInstance.get('/admin/students/without-wash-plan');
    return response.data;
  },

  /**
   * Create wash plan for a student
   * @param {string} studentId - Student ID
   * @returns {Promise} API response with created wash plan
   */
  createWashPlanForStudent: async (studentId) => {
    const response = await axiosInstance.post(`/admin/students/${studentId}/create-wash-plan`);
    return response.data;
  },
};

export default studentService;
