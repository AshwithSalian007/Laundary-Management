import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import { redisAuth } from '../config/redis.js';

// Generate JWT Token (only id and roleName, permissions stored in Redis)
// NO EXPIRY - Redis controls session lifetime with 1h TTL
const generateToken = (adminId, roleName) => {
  return jwt.sign(
    {
      id: adminId,
      roleName: roleName
    },
    process.env.JWT_SECRET
    // No expiresIn option = token never expires
    // Session validity controlled by Redis (1h TTL with auto-reset)
  );
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find admin and include password field, populate role with permissions
    const admin = await Admin.findOne({ email })
      .select('+password')
      .populate({
        path: 'role',
        populate: {
          path: 'permissions',
          model: 'Permission'
        }
      });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.',
      });
    }

    // Compare password
    const isPasswordMatch = await admin.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Validate role and permissions exist
    if (!admin.role) {
      return res.status(500).json({
        success: false,
        message: 'Account configuration error: Role not found. Please contact administrator.',
      });
    }

    if (!admin.role.permissions || !Array.isArray(admin.role.permissions)) {
      return res.status(500).json({
        success: false,
        message: 'Account configuration error: Permissions not configured. Please contact administrator.',
      });
    }

    // Extract permissions from admin's role
    const permissions = admin.role.permissions.map(p => p.permission_name);

    // Store permissions in Redis with 1 hour TTL
    try {
      await redisAuth.setAdminPermissions(admin._id.toString(), permissions);
    } catch (redisError) {
      console.error('Redis error during login:', redisError.message);
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again in a moment.',
        error: 'Session storage unavailable',
      });
    }

    // Generate JWT token (only id and roleName)
    const token = generateToken(admin._id, admin.role.name);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      admin: adminResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Create staff/sub-admin (only accessible by admin with "all" permission)
// @route   POST /api/auth/create-staff
// @access  Private (Admin with "all" permission only)
export const createStaff = async (req, res) => {
  try {
    const { email, password, roleId, createNewRole, newRoleName, permissionIds } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists',
      });
    }

    let assignedRoleId;

    // Option 1: Create new role and assign
    if (createNewRole) {
      if (!newRoleName || !permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide role name and permission IDs to create a new role',
        });
      }

      // Verify all permission IDs exist
      const permissions = await Permission.find({ _id: { $in: permissionIds } });
      if (permissions.length !== permissionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more permission IDs are invalid',
        });
      }

      // SECURITY: Prevent non-super-admins from creating roles with 'all' permission
      const hasAllPermission = permissions.some(p => p.permission_name === 'all');
      const requesterIsSuperAdmin = req.user.permissions.includes('all');

      if (hasAllPermission && !requesterIsSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only super admins can create roles with super admin permission.',
        });
      }

      // Check if role name already exists
      const existingRole = await Role.findOne({ name: newRoleName.toLowerCase() });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role with this name already exists',
        });
      }

      // Create new role
      const newRole = await Role.create({
        name: newRoleName.toLowerCase(),
        permissions: permissionIds,
      });

      assignedRoleId = newRole._id;
    }
    // Option 2: Assign existing role
    else if (roleId) {
      // Verify role exists and populate permissions
      const existingRole = await Role.findById(roleId).populate('permissions');
      if (!existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role not found',
        });
      }

      // SECURITY: Prevent non-super-admins from creating staff with super admin role
      const roleHasAllPermission = existingRole.permissions.some(p => p.permission_name === 'all');
      const requesterIsSuperAdmin = req.user.permissions.includes('all');

      if (roleHasAllPermission && !requesterIsSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only super admins can create staff with super admin role.',
        });
      }

      assignedRoleId = roleId;
    }
    // No role specified
    else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either roleId or create a new role with newRoleName and permissionIds',
      });
    }

    // Create admin/staff
    const admin = await Admin.create({
      email,
      password,
      role: assignedRoleId,
    });

    // Fetch created admin with populated role
    const createdAdmin = await Admin.findById(admin._id).populate({
      path: 'role',
      populate: {
        path: 'permissions',
        model: 'Permission'
      }
    });

    // Remove password from response
    const adminResponse = createdAdmin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: 'Staff created successfully. They can now login with their credentials.',
      admin: adminResponse,
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during staff creation',
      error: error.message,
    });
  }
};

// @desc    Get current admin profile (from Redis)
// @route   GET /api/admin/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    // req.user contains: { id, roleName, permissions } (from Redis via middleware)
    const { id, roleName, permissions } = req.user;

    res.status(200).json({
      success: true,
      admin: {
        id,
        roleName,
        permissions,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: error.message,
    });
  }
};

// @desc    Logout admin (clears Redis session)
// @route   POST /api/admin/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    // Delete admin session from Redis
    await redisAuth.deleteAdminSession(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message,
    });
  }
};

// @desc    Get all roles
// @route   GET /api/auth/roles
// @access  Private (Admin only)
export const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate('permissions');

    res.status(200).json({
      success: true,
      count: roles.length,
      roles,
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching roles',
      error: error.message,
    });
  }
};

// @desc    Get all permissions
// @route   GET /api/admin/permissions
// @access  Private (Super Admin only)
export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();

    res.status(200).json({
      success: true,
      count: permissions.length,
      permissions,
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching permissions',
      error: error.message,
    });
  }
};

// ==================== STAFF MANAGEMENT ====================

// @desc    Get all staff/admins
// @route   GET /api/admin/staff
// @access  Private (Super Admin only)
export const getAllStaff = async (req, res) => {
  try {
    const staff = await Admin.find()
      .select('-password')
      .populate({
        path: 'role',
        populate: {
          path: 'permissions',
          model: 'Permission'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff',
      error: error.message,
    });
  }
};

// @desc    Update staff role
// @route   PUT /api/admin/staff/:id/role
// @access  Private (Super Admin only)
export const updateStaffRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roleId',
      });
    }

    // Check if new role exists
    const newRole = await Role.findById(roleId).populate('permissions');
    if (!newRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Fetch target staff with current role
    const targetStaff = await Admin.findById(id).populate({
      path: 'role',
      populate: {
        path: 'permissions',
        model: 'Permission'
      }
    });

    if (!targetStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    // SECURITY: Prevent non-super-admins from editing super admin staff
    const requesterIsSuperAdmin = req.user.permissions.includes('all');
    const targetHasAllPermission = targetStaff.role.permissions.some(p => p.permission_name === 'all');
    const newRoleHasAllPermission = newRole.permissions.some(p => p.permission_name === 'all');

    if (!requesterIsSuperAdmin && (targetHasAllPermission || newRoleHasAllPermission)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admins can modify super admin staff or assign super admin roles.',
      });
    }

    // Update admin role in MongoDB
    const admin = await Admin.findByIdAndUpdate(
      id,
      { role: roleId },
      { new: true }
    ).populate({
      path: 'role',
      populate: {
        path: 'permissions',
        model: 'Permission'
      }
    });

    // Extract new permissions
    const permissions = newRole.permissions.map(p => p.permission_name);

    // Update permissions in Redis if staff is logged in (preserves remaining TTL)
    let redisUpdated = false;
    let redisError = null;

    try {
      redisUpdated = await redisAuth.updateAdminPermissionsPreserveTTL(id, permissions);
    } catch (error) {
      console.error('Redis error during staff role update:', error.message);
      redisError = true;
      // Continue - DB update succeeded, Redis update failed
    }

    let message;
    if (redisError) {
      message = 'Staff role updated in database. Session update failed - staff should re-login for changes to take effect.';
    } else if (redisUpdated) {
      message = 'Staff role updated successfully. Changes applied immediately.';
    } else {
      message = 'Staff role updated successfully. Changes will apply when staff logs in.';
    }

    res.status(200).json({
      success: true,
      message,
      admin,
      ...(redisError && { warning: 'Session storage temporarily unavailable' }),
    });
  } catch (error) {
    console.error('Update staff role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating staff role',
      error: error.message,
    });
  }
};

// @desc    Delete/Deactivate staff
// @route   DELETE /api/admin/staff/:id
// @access  Private (Super Admin only)
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent super admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    // Fetch target staff to check their role
    const targetStaff = await Admin.findById(id).populate({
      path: 'role',
      populate: {
        path: 'permissions',
        model: 'Permission'
      }
    });

    if (!targetStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
    }

    // SECURITY: Prevent non-super-admins from deleting super admin staff
    const requesterIsSuperAdmin = req.user.permissions.includes('all');
    const targetHasAllPermission = targetStaff.role.permissions.some(p => p.permission_name === 'all');

    if (!requesterIsSuperAdmin && targetHasAllPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admins can delete super admin staff.',
      });
    }

    // Deactivate admin in MongoDB
    const admin = await Admin.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');

    // Remove from Redis (force logout)
    await redisAuth.deleteAdminSession(id);

    res.status(200).json({
      success: true,
      message: 'Staff deactivated and logged out successfully',
      admin,
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting staff',
      error: error.message,
    });
  }
};

// ==================== ROLE MANAGEMENT ====================

// @desc    Create new role
// @route   POST /api/admin/roles
// @access  Private (Super Admin only)
export const createRole = async (req, res) => {
  try {
    const { name, permissionIds } = req.body;

    if (!name || !permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide role name and permission IDs',
      });
    }

    // Verify all permission IDs exist
    const permissions = await Permission.find({ _id: { $in: permissionIds } });
    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more permission IDs are invalid',
      });
    }

    // SECURITY: Prevent non-super-admins from creating roles with 'all' permission
    const hasAllPermission = permissions.some(p => p.permission_name === 'all');
    const requesterIsSuperAdmin = req.user.permissions.includes('all');

    if (hasAllPermission && !requesterIsSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admins can create roles with super admin permission.',
      });
    }

    // Check if role name already exists
    const existingRole = await Role.findOne({ name: name.toLowerCase() });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists',
      });
    }

    // Create new role
    const newRole = await Role.create({
      name: name.toLowerCase(),
      permissions: permissionIds,
    });

    // Populate permissions for response
    const populatedRole = await Role.findById(newRole._id).populate('permissions');

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      role: populatedRole,
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating role',
      error: error.message,
    });
  }
};

// @desc    Update role permissions
// @route   PUT /api/admin/roles/:id
// @access  Private (Super Admin only)
export const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide permission IDs',
      });
    }

    // Verify all permission IDs exist
    const permissions = await Permission.find({ _id: { $in: permissionIds } });
    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more permission IDs are invalid',
      });
    }

    // Fetch existing role to check its current state
    const existingRole = await Role.findById(id).populate('permissions');
    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // SECURITY: Prevent non-super-admins from modifying super admin role
    const requesterIsSuperAdmin = req.user.permissions.includes('all');
    const isSuperAdminRole = existingRole.name === 'super admin';
    const currentHasAllPermission = existingRole.permissions.some(p => p.permission_name === 'all');
    const newHasAllPermission = permissions.some(p => p.permission_name === 'all');

    if (!requesterIsSuperAdmin && (isSuperAdminRole || currentHasAllPermission || newHasAllPermission)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admins can modify super admin role or assign super admin permission.',
      });
    }

    // Update role in MongoDB
    const role = await Role.findByIdAndUpdate(
      id,
      { permissions: permissionIds },
      { new: true }
    ).populate('permissions');

    // Find all admins with this role
    const adminsWithRole = await Admin.find({ role: id });
    const adminIds = adminsWithRole.map(admin => admin._id.toString());

    // Extract new permission names
    const permissionNames = permissions.map(p => p.permission_name);

    // Update Redis for all logged-in admins with this role (preserves TTL)
    let updatedCount = 0;
    let redisError = null;

    if (adminIds.length > 0) {
      try {
        updatedCount = await redisAuth.updateMultipleAdminPermissionsPreserveTTL(adminIds, permissionNames);
      } catch (error) {
        console.error('Redis error during role permissions update:', error.message);
        redisError = true;
        // Continue - DB update succeeded, Redis update failed
      }
    }

    let message;
    if (redisError) {
      message = `Role permissions updated in database. Session update failed - ${adminIds.length} staff member(s) should re-login for changes to take effect.`;
    } else if (updatedCount > 0) {
      message = `Role permissions updated successfully. ${updatedCount} logged-in staff member(s) updated immediately. ${adminIds.length - updatedCount} offline staff will get updates on next login.`;
    } else {
      message = `Role permissions updated successfully. ${adminIds.length} staff member(s) will get new permissions when they login.`;
    }

    res.status(200).json({
      success: true,
      message,
      role,
      ...(redisError && { warning: 'Session storage temporarily unavailable' }),
    });
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating role permissions',
      error: error.message,
    });
  }
};

// @desc    Delete role
// @route   DELETE /api/admin/roles/:id
// @access  Private (Super Admin only)
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Find role
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Prevent deletion of Super Admin role
    if (role.name === 'super admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete Super Admin role',
      });
    }

    // Check if any admins have this role
    const adminsWithRole = await Admin.countDocuments({ role: id });
    if (adminsWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${adminsWithRole} staff member(s) are assigned to this role.`,
      });
    }

    // Delete role
    await Role.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting role',
      error: error.message,
    });
  }
};
