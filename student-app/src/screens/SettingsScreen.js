import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SIZES } from '../constants/theme';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { isDark, themeMode, setTheme, colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation handled automatically by App.js
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'system':
        return `System (${isDark ? 'Dark' : 'Light'})`;
      default:
        return 'System';
    }
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Choose Theme',
      'Select your preferred theme',
      [
        {
          text: 'Light',
          onPress: () => setTheme('light'),
        },
        {
          text: 'Dark',
          onPress: () => setTheme('dark'),
        },
        {
          text: 'System',
          onPress: () => setTheme('system'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Appearance
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={handleThemeChange}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Theme
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  {getThemeLabel()}
                </Text>
              </View>
            </View>
            <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Profile & Account
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('AccountInfo')}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>👤</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Account Information
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  {user?.name || 'View your profile'}
                </Text>
              </View>
            </View>
            <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>🔑</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Change Password
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  Update your password
                </Text>
              </View>
            </View>
            <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Notifications
          </Text>

          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Push Notifications
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notificationsEnabled ? colors.primary : (isDark ? colors.surface : colors.white)}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>📧</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Email Notifications
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  {emailNotifications ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={emailNotifications ? colors.primary : (isDark ? colors.surface : colors.white)}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            About & Support
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>ℹ️</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  About App
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  Version 1.0.0
                </Text>
              </View>
            </View>
            <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>❓</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Help & Support
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  Get help and FAQs
                </Text>
              </View>
            </View>
            <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>📄</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Privacy Policy
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  Read our privacy policy
                </Text>
              </View>
            </View>
            <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>📋</Text>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  Terms of Service
                </Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  Read our terms
                </Text>
              </View>
            </View>
            <Text style={[styles.settingArrow, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Student Info */}
        {user && (
          <View style={styles.studentInfo}>
            <Text style={[styles.studentInfoText, { color: colors.textSecondary }]}>
              Signed in as {user.email}
            </Text>
            <Text style={[styles.studentInfoText, { color: colors.textSecondary }]}>
              Registration: {user.registration_number}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  backIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingVertical: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.xxl,
  },
  section: {
    marginBottom: SIZES.spacing.lg,
    paddingHorizontal: SIZES.spacing.lg,
  },
  sectionTitle: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SIZES.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: SIZES.spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: SIZES.base,
    fontWeight: '600',
    marginBottom: SIZES.spacing.xs / 2,
  },
  settingSubtext: {
    fontSize: SIZES.sm,
  },
  settingArrow: {
    fontSize: 24,
    marginLeft: SIZES.spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: SIZES.spacing.sm,
  },
  logoutText: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: '#FFFFFF', // Always white on error button
  },
  studentInfo: {
    marginTop: SIZES.spacing.xl,
    paddingHorizontal: SIZES.spacing.lg,
    alignItems: 'center',
  },
  studentInfoText: {
    fontSize: SIZES.sm,
    marginBottom: SIZES.spacing.xs,
  },
});

export default SettingsScreen;
