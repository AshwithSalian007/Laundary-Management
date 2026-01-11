import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SIZES } from '../constants/theme';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.75;

const Sidebar = ({ visible, onClose, navigation }) => {
  const { user, logout } = useAuth();
  const { isDark, colors } = useTheme();
  const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  React.useEffect(() => {
    let animation;
    if (visible) {
      animation = Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      });
    } else {
      animation = Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      });
    }
    animation.start();

    return () => {
      animation.stop();
    };
  }, [visible, slideAnim]);

  const handleNavigate = (screen) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(screen);
    }, 300);
  };

  const handleLogout = async () => {
    onClose();
    setTimeout(async () => {
      await logout();
    }, 300);
  };

  const menuItems = [
    {
      id: 'account',
      title: 'Account Info',
      icon: '👤',
      screen: 'AccountInfo',
    },
    {
      id: 'requests',
      title: 'My Requests',
      icon: '📋',
      screen: 'MyRequests',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: '⚙️',
      screen: 'Settings',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Animated.View
            style={[
              styles.backdropOverlay,
              { backgroundColor: colors.overlay },
            ]}
          />
        </Pressable>

        {/* Sidebar */}
        <Animated.View
          style={[
            styles.sidebar,
            {
              backgroundColor: colors.card,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Sidebar Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {user?.name?.charAt(0).toUpperCase() || 'S'}
                </Text>
              </View>
            </View>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user?.name || 'Student'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {user?.email || ''}
            </Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => handleNavigate(item.screen)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuText, { color: colors.textPrimary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.menuArrow, { color: colors.textSecondary }]}>
                  ›
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.error + '15' }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={[styles.logoutText, { color: colors.error }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
  },
  backdropOverlay: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    paddingTop: SIZES.spacing.xxl + 20,
    paddingHorizontal: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.lg,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SIZES.spacing.xs,
  },
  userEmail: {
    fontSize: SIZES.sm,
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
    paddingTop: SIZES.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.lg,
    paddingHorizontal: SIZES.spacing.lg,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: SIZES.spacing.md,
    width: 32,
  },
  menuText: {
    fontSize: SIZES.base,
    fontWeight: '500',
    flex: 1,
  },
  menuArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  footer: {
    padding: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.xl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.lg,
    borderRadius: SIZES.radius.lg,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: SIZES.spacing.sm,
  },
  logoutText: {
    fontSize: SIZES.base,
    fontWeight: '600',
  },
});

export default Sidebar;
