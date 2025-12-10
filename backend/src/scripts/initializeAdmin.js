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

    // Step 1: Create default permissions if they don't exist
    const defaultPermissions = [
      { permission_name: 'all' },
      { permission_name: 'create_users' },
      { permission_name: 'read_users' },
      { permission_name: 'update_users' },
      { permission_name: 'delete_users' },
      { permission_name: 'manage_roles' },
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

    // Step 2: Create "Super Admin" role if it doesn't exist
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

    // Step 3: Create main admin if it doesn't exist
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
