import Admin from '../models/Admin.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';

/**
 * Initialize default permissions, roles, and super admin
 * This runs on server startup to ensure the system has required data
 */
export const initializeAdmin = async () => {
  try {
    console.log('🔄 Initializing admin system...');

    // Step 1: Clean up deprecated/old permissions
    const deprecatedPermissions = ['create_users', 'read_users', 'update_users', 'delete_users'];

    // Find roles that have deprecated permissions
    const rolesWithDeprecatedPerms = await Role.find({
      permissions: { $exists: true }
    }).populate('permissions');

    // Check if any deprecated permissions are in use
    let hasDeprecatedInUse = false;
    for (const role of rolesWithDeprecatedPerms) {
      const deprecatedInRole = role.permissions.filter(p =>
        deprecatedPermissions.includes(p.permission_name)
      );
      if (deprecatedInRole.length > 0) {
        console.log(`⚠️  Role "${role.name}" has deprecated permissions: ${deprecatedInRole.map(p => p.permission_name).join(', ')}`);
        hasDeprecatedInUse = true;
      }
    }

    if (!hasDeprecatedInUse) {
      // Safe to delete deprecated permissions
      const deleteResult = await Permission.deleteMany({
        permission_name: { $in: deprecatedPermissions }
      });

      if (deleteResult.deletedCount > 0) {
        console.log(`✅ Cleaned up ${deleteResult.deletedCount} deprecated permission(s): ${deprecatedPermissions.join(', ')}`);
      }
    } else {
      console.log('⚠️  Cannot auto-delete deprecated permissions - they are still assigned to roles. Please manually reassign roles first.');
    }

    // Step 2: Create default permissions if they don't exist
    const defaultPermissions = [
      { permission_name: 'all' },
      { permission_name: 'manage_staff' },
      { permission_name: 'manage_roles' },
      { permission_name: 'manage_departments' },
    ];

    const createdPermissions = {};

    for (const permData of defaultPermissions) {
      let permission = await Permission.findOne({ permission_name: permData.permission_name });

      if (!permission) {
        permission = await Permission.create(permData);
        console.log(`✅ Created permission: ${permData.permission_name}`);
      } else {
        console.log(`ℹ️  Permission already exists: ${permData.permission_name}`);
      }

      createdPermissions[permData.permission_name] = permission._id;
    }

    // Step 3: Create "Super Admin" role if it doesn't exist
    let superAdminRole = await Role.findOne({ name: 'super admin' });

    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'super admin',
        permissions: [createdPermissions['all']],
      });
      console.log('✅ Created role: Super Admin with "all" permission');
    } else {
      console.log('ℹ️  Role already exists: Super Admin');
    }

    // Step 4: Create main admin if it doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@laundry.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    let mainAdmin = await Admin.findOne({ email: adminEmail });

    if (!mainAdmin) {
      mainAdmin = await Admin.create({
        email: adminEmail,
        password: adminPassword,
        role: superAdminRole._id,
      });
      console.log(`✅ Created main admin: ${adminEmail}`);
      console.log(`🔑 Default password: ${adminPassword}`);
      console.log('⚠️  IMPORTANT: Please change the default password after first login!');
    } else {
      console.log(`ℹ️  Main admin already exists: ${adminEmail}`);
    }

    console.log('✅ Admin system initialization complete!\n');
  } catch (error) {
    console.error('❌ Error initializing admin system:', error);
    throw error;
  }
};
