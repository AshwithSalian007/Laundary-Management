import { useState, useEffect, useRef } from 'react';
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

  // Ref to track timeouts for cleanup
  const timeoutRefs = useRef([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasPermission, setHasPermission] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showWithoutWashPlan, setShowWithoutWashPlan] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // OTP verification state
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
    createWashPlan: true,
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
  }, [showDeleted, showWithoutWashPlan]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.current = [];
    };
  }, []);

  // Helper to safely set timeout with cleanup tracking
  const setSafeTimeout = (callback, delay) => {
    const timeoutId = setTimeout(callback, delay);
    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Determine which API to call based on filter
      let studentsRes;
      if (showWithoutWashPlan) {
        studentsRes = await studentService.getStudentsWithoutWashPlan();
      } else {
        studentsRes = await studentService.getAllStudents(showDeleted);
      }

      const departmentsRes = await departmentService.getAllDepartments(false);

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

  // State for verification modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [studentPassword, setStudentPassword] = useState('');
  const [createdStudentEmail, setCreatedStudentEmail] = useState('');
  const [createdStudentName, setCreatedStudentName] = useState('');
  const [studentCreateWashPlan, setStudentCreateWashPlan] = useState(false);

  // Handle create student (Step 1: Create student and send OTP)
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

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
        setLoading(false);
        return;
      }

      // Validate phone number
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(createFormData.phone_number)) {
        setError('Please enter a valid 10-digit Indian phone number starting with 6-9');
        setLoading(false);
        return;
      }

      // Validate password length
      if (createFormData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      // Step 1: Create student (without OTP)
      const createResponse = await studentService.createStudent(createFormData);

      // Store password and createWashPlan from response (for verification later)
      setStudentPassword(createResponse.password);
      setCreatedStudentEmail(createFormData.email);
      setCreatedStudentName(createFormData.name);
      setStudentCreateWashPlan(createResponse.createWashPlan || false);

      // Step 2: Send OTP
      await otpService.sendVerificationOTP(createFormData.email, createResponse.createWashPlan);

      // Step 3: Close create modal and show verification modal
      setShowCreateModal(false);
      setShowVerifyModal(true);

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create student');
      setLoading(false);
    }
  };

  // Handle verify email with OTP (Step 2)
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

      if (!otpInput || otpInput.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        setLoading(false);
        return;
      }

      // Verify OTP and send password for welcome email
      const response = await otpService.verifyEmailOTP({
        email: createdStudentEmail,
        otp: otpInput,
        password: studentPassword,
        createWashPlan: studentCreateWashPlan,
      });

      // Check if there's a warning about welcome email
      if (response.warning) {
        setSuccess(`Student created and email verified! Warning: ${response.warning}`);
      } else {
        setSuccess('Student created and email verified successfully!');
      }

      setShowVerifyModal(false);
      resetCreateForm();
      fetchData();
      setSafeTimeout(() => setSuccess(''), 5000); // 5 seconds for warnings
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to verify OTP');
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    try {
      setError('');
      setSendingOTP(true);
      await otpService.sendVerificationOTP(createdStudentEmail, studentCreateWashPlan);
      setSuccess('OTP resent successfully!');
      setSafeTimeout(() => setSuccess(''), 3000);
      setSendingOTP(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend OTP');
      setSendingOTP(false);
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
      setSafeTimeout(() => setSuccess(''), 3000);
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
      setSafeTimeout(() => setSuccess(''), 3000);
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
      setSafeTimeout(() => setSuccess(''), 3000);
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
      createWashPlan: true,
    });
    setOtpInput('');
    setStudentPassword('');
    setCreatedStudentEmail('');
    setCreatedStudentName('');
    setStudentCreateWashPlan(false);
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

  // Handle create wash plan for student
  const handleCreateWashPlan = async (studentId, studentName) => {
    try {
      if (!window.confirm(`Create wash plan for ${studentName}?`)) {
        return;
      }

      setLoading(true);
      setError('');

      await studentService.createWashPlanForStudent(studentId);

      setSuccess(`Wash plan created successfully for ${studentName}!`);
      setSafeTimeout(() => setSuccess(''), 5000);

      // Refresh the list
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create wash plan');
    } finally {
      setLoading(false);
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
              onClick={() => {
                setShowWithoutWashPlan(!showWithoutWashPlan);
                if (!showWithoutWashPlan) {
                  setShowDeleted(false); // Turn off deleted filter when showing without wash plan
                }
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showWithoutWashPlan
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {showWithoutWashPlan ? 'Show All Students' : 'Without Wash Plan'}
            </button>
            <button
              onClick={() => {
                setShowDeleted(!showDeleted);
                if (!showDeleted) {
                  setShowWithoutWashPlan(false); // Turn off wash plan filter when showing deleted
                }
              }}
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
                        {showWithoutWashPlan && (
                          <button
                            onClick={() => handleCreateWashPlan(student._id, student.name)}
                            className="px-3 py-1 bg-[#228B22] text-white rounded hover:bg-[#4CAF50] transition-colors"
                          >
                            Create Wash Plan
                          </button>
                        )}
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
          <div
            className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
                <div className="text-sm text-gray-500">
                  <span>Step 1: Enter Details</span>
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
                      <input
                        type="email"
                        required
                        value={createFormData.email}
                        onChange={(e) =>
                          setCreateFormData({ ...createFormData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22]"
                      />
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

                {/* Wash Plan Options */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                    Wash Plan Options
                  </h3>
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="createWashPlan"
                      checked={createFormData.createWashPlan}
                      onChange={(e) =>
                        setCreateFormData({ ...createFormData, createWashPlan: e.target.checked })
                      }
                      className="w-4 h-4 text-[#228B22] border-gray-300 rounded focus:ring-2 focus:ring-[#228B22]"
                    />
                    <label htmlFor="createWashPlan" className="flex-1 text-sm font-medium text-gray-700 cursor-pointer">
                      Create Yearly Wash Plan for this student
                      <span className="block text-xs text-gray-500 mt-1">
                        Student will be enrolled in the currently active wash policy. Uncheck if you want to add the wash plan later.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors font-medium flex items-center justify-center"
                  >
                    <span>Next →</span>
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

        {/* Verify Email Modal - Step 2 */}
        {showVerifyModal && (
          <div
            className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => {
              setShowVerifyModal(false);
              setOtpInput('');
              setError('');
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all duration-300 ease-out scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Verify Email</h2>
                <div className="text-sm text-gray-500">
                  <span>Step 2: Email Verification</span>
                </div>
              </div>

              {/* Error/Success messages */}
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

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Student:</strong> {createdStudentName}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Email:</strong> {createdStudentEmail}
                </p>
                <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded">
                  An OTP has been sent to the student's email address. Please enter the 6-digit code below.
                </p>
              </div>

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    maxLength="6"
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#228B22] text-lg font-mono text-center"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-[#228B22] text-white rounded-lg hover:bg-[#4CAF50] transition-colors disabled:bg-gray-400 font-medium"
                  >
                    {loading ? 'Verifying...' : 'Verify Email'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={sendingOTP}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 font-medium"
                  >
                    {sendingOTP ? 'Resending...' : 'Resend OTP'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowVerifyModal(false);
                    setOtpInput('');
                    setError('');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {showEditModal && selectedStudent && (
          <div
            className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => {
              setShowEditModal(false);
              setSelectedStudent(null);
              setError('');
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100"
              onClick={(e) => e.stopPropagation()}
            >
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
