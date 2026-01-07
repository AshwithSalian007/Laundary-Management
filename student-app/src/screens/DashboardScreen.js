import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';

const DashboardScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation handled automatically by App.js
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Student'}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Content - Empty for now */}
        <View style={styles.content}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Dashboard Coming Soon</Text>
            <Text style={styles.emptySubtitle}>
              This is your home screen. Features will be added here soon.
            </Text>
          </View>

          {/* User Info Card */}
          {user && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Registration No:</Text>
                <Text style={styles.infoValue}>{user.registration_number}</Text>
              </View>
              {user.batch_id && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Batch:</Text>
                    <Text style={styles.infoValue}>{user.batch_id.batch_label}</Text>
                  </View>
                  {user.batch_id.department_id && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Department:</Text>
                      <Text style={styles.infoValue}>
                        {user.batch_id.department_id.name}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SIZES.spacing.xs,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.md,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SIZES.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.xxl,
  },
  emptyTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacing.sm,
  },
  emptySubtitle: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SIZES.spacing.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginTop: SIZES.spacing.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: SIZES.base,
    color: COLORS.textPrimary,
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
});

export default DashboardScreen;
