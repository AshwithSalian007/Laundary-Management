import { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard/components/DashboardLayout';
import studentService from '../services/studentService';
import otpService from '../services/otpService';
import departmentService from '../../departments/services/departmentService';
import batchService from '../../batches/services/batchService';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasPermission, setHasPermission] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // OTP verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);

  // Form data for create (Step 1: Basic Info)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',
    registration_number: '',
    gender: 'male',
    department_id: '',
    batch_id: '',
    hostel_status: 'active',
  });

  // OTP input
  const [otpInput, setOtpInput] = useState('');

  // Form data for edit
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    registration_number: '',
    gender: 'male',
    batch_id: '',
    hostel_status: 'active',
    password: '',
  });

  // Fetch students and departments on component mount
  useEffect(() => {
    fetchData();
  }, [showDeleted]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, departmentsRes] = await Promise.all([
        studentService.getAllStudents(showDeleted),
        departmentService.getAllDepartments(false),
      ]);
      setStudents(studentsRes.data || []);
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
        setError(err.response?.data?.message || err.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch batches when department is selected
  const fetchBatchesForDepartment = async (departmentId, isEdit = false) => {
    try {
      const batchesRes = await batchService.getAllBatches(false);
      const filteredBatches = batchesRes.data.filter(
        (batch) => batch.department_id?._id === departmentId && !batch.isDeleted
      );
      setBatches(filteredBatches);

      // Reset batch selection when department changes
      if (isEdit) {
        setEditFormData((prev) => ({ ...prev, batch_id: '' }));
      } else {
        setCreateFormData((prev) => ({ ...prev, batch_id: '' }));
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
  };

  // Handle send OTP
  const handleSendOTP = async () => {
    try {
      setError('');
      setSendingOTP(true);

      // Validate email
      if (!createFormData.email) {
        setError('Please enter email address');
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(createFormData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      await otpService.sendVerificationOTP(createFormData.email);
      setOtpSent(true);
      setSuccess('OTP sent to email successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  // Handle create student (Step 2: Verify OTP and Create)
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Validate all fields
      if (
        !createFormData.name ||
        !createFormData.email ||
        !createFormData.password ||
        !createFormData.phone_number ||
        !createFormData.registration_number ||
        !createFormData.gender ||
        !createFormData.batch_id
      ) {
        setError('Please fill in all required fields');
        return;
      }

      if (!otpSent) {
        setError('Please send OTP first');
        return;
      }

      if (!otpInput) {
        setError('Please enter the OTP');
        return;
      }

      // Validate phone number
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(createFormData.phone_number)) {
        setError('Please enter a valid 10-digit Indian phone number starting with 6-9');
        return;
      }

      // Validate password length
      if (createFormData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      // Create student with OTP
      await studentService.createStudent({
        ...createFormData,
        otp: otpInput,
      });

      setSuccess('Student created successfully!');
      setShowCreateModal(false);
      resetCreateForm();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create student');
    }
  };

  // Handle update student
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Validate phone number if provided
      if (editFormData.phone_number) {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(editFormData.phone_number)) {
          setError('Please enter a valid 10-digit Indian phone number starting with 6-9');
          return;
        }
      }

      // Validate password if provided
      if (editFormData.password && editFormData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      // Prepare update data (exclude password if empty)
      const updateData = { ...editFormData };
      if (!updateData.password) {
        delete updateData.password;
      }

      await studentService.updateStudent(selectedStudent._id, updateData);
      setSuccess('Student updated successfully!');
      setShowEditModal(false);
      setSelectedStudent(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update student');
    }
  };

  // Handle delete student
  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }
    try {
      setError('');
      await studentService.deleteStudent(studentId);
      setSuccess('Student deleted successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete student');
    }
  };

  // Handle restore student
  const handleRestoreStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to restore this student?')) {
      return;
    }
    try {
      setError('');
      await studentService.restoreStudent(studentId);
      setSuccess('Student restored successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to restore student');
    }
  };

  const openEditModal = (student) => {
    setError('');
    setSelectedStudent(student);
    setEditFormData({
      name: student.name,
      email: student.email,
      phone_number: student.phone_number,
      registration_number: student.registration_number,
      gender: student.gender,
      batch_id: student.batch_id?._id || '',
      hostel_status: student.hostel_status,
      password: '',
    });

    // Fetch batches for the student's department
    if (student.batch_id?.department_id?._id) {
      fetchBatchesForDepartment(student.batch_id.department_id._id, true);
    }

    setShowEditModal(true);
  };

  const resetCreateForm = () => {
    setCreateFormData({
      name: '',
      email: '',
      password: '',
      phone_number: '',
      registration_number: '',
      gender: 'male',
      department_id: '',
      batch_id: '',
      hostel_status: 'active',
    });
    setOtpInput('');
    setOtpSent(false);
    setOtpVerified(false);
    setBatches([]);
  };

  const handleDepartmentChange = (departmentId, isEdit = false) => {
    if (isEdit) {
      setEditFormData({ ...editFormData, department_id: departmentId });
    } else {
      setCreateFormData({ ...createFormData, department_id: departmentId });
    }
    if (departmentId) {
      fetchBatchesForDepartment(departmentId, isEdit);
    } else {
      setBatches([]);
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

  if (!hasPermission) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {showDeleted ? 'Show Active' : 'Show Deleted'}
            </button>
            <button
              onClick={() => {
                setError('');
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors"
            >
              + Add Student
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

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reg. Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
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
              {students.map((student) => (
                <tr key={student._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.email}
                    {student.email_verified && (
                      <span className="ml-2 text-green-600">✓</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.registration_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.batch_id?.department_id?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.batch_id?.isDeleted ? (
                      <span className="text-red-600">Batch Deleted</span>
                    ) : (
                      student.batch_id?.batch_label || 'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        !student.isDeleted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {!student.isDeleted ? student.hostel_status : 'Deleted'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {!student.isDeleted ? (
                      <>
                        <button
                          onClick={() => openEditModal(student)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleRestoreStudent(student._id)}
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

        {/* Create Student Modal - Two Steps */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
                <div className="text-sm text-gray-500">
                  {otpSent ? (
                    <span className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      OTP Sent
                    </span>
                  ) : (
                    <span>Step 1: Enter Details</span>
                  )}
                </div>
              </div>

              {/* Error message inside modal */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {/* Success message inside modal */}
              {success && (
                <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {success}
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateStudent} className="space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createFormData.name}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    />
                  </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          required
                          value={createFormData.email}
                          onChange={(e) =>
                            setCreateFormData({ ...createFormData, email: e.target.value })
                          }
                          disabled={otpSent}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22] disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        {!otpSent && (
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={sendingOTP || !createFormData.email}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                          >
                            {sendingOTP ? 'Sending...' : 'Send OTP'}
                          </button>
                        )}
                        {otpSent && (
                          <span className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Sent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* OTP Verification Section - Show only after OTP is sent */}
                {otpSent && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Email Verification
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Enter OTP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        maxLength="6"
                        placeholder="Enter 6-digit OTP"
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-mono text-center"
                      />
                      <p className="text-sm text-blue-700 mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Check the student's email ({createFormData.email}) for the verification code
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact & Academic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Contact & Academic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                    <input
                      type="tel"
                      required
                      value={createFormData.phone_number}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, phone_number: e.target.value })
                      }
                      placeholder="10-digit number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createFormData.registration_number}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          registration_number: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    />
                  </div>
                </div>
                </div>

                {/* Security & Batch Assignment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Security & Batch Assignment
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={createFormData.gender}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, gender: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Initial Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={createFormData.password}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, password: e.target.value })
                        }
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                    <select
                      required
                      value={createFormData.department_id}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={createFormData.batch_id}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, batch_id: e.target.value })
                      }
                      disabled={!createFormData.department_id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22] disabled:bg-gray-100"
                    >
                      <option value="">
                        {createFormData.department_id
                          ? 'Select Batch'
                          : 'Select Department First'}
                      </option>
                      {batches.map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.batch_label}
                        </option>
                      ))}
                    </select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={!otpSent}
                    className="flex-1 px-6 py-3 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                  >
                    {!otpSent ? (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Send OTP First
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Student
                      </>
                    )}
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

        {/* Edit Student Modal */}
        {showEditModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit Student
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {selectedStudent.registration_number}
                </span>
              </div>

              {/* Error message inside modal */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleUpdateStudent} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      />
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Changing email will require re-verification
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact & Academic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Contact & Academic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editFormData.phone_number}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, phone_number: e.target.value })
                        }
                        placeholder="10-digit number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        value={editFormData.registration_number}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            registration_number: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Batch Assignment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Status & Batch Assignment
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={editFormData.gender}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, gender: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hostel Status
                      </label>
                      <select
                        value={editFormData.hostel_status}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, hostel_status: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      >
                        <option value="active">Active</option>
                        <option value="dropped">Dropped</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch
                    </label>
                    <select
                      value={editFormData.batch_id}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, batch_id: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                    >
                      <option value="">Select Batch</option>
                      {batches.map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.batch_label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Security - Password Reset */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Password Reset
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={editFormData.password}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, password: e.target.value })
                      }
                      placeholder="Leave blank to keep current password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <p className="text-xs text-gray-600 mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Only fill this if you want to reset the student's password
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors font-medium flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setShowEditModal(false);
                      setSelectedStudent(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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

export default StudentManagement;
