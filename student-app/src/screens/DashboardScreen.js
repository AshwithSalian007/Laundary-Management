import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants/theme';
import ProgressRing from '../components/ProgressRing';
import {
  getMyWashPlan,
  calculateWashStats,
  formatPlanDate,
} from '../services/washPlanService';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [washPlan, setWashPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch wash plan data
  const fetchWashPlan = async () => {
    try {
      setError(null);
      const response = await getMyWashPlan();
      setWashPlan(response.data);
    } catch (err) {
      console.error('Failed to fetch wash plan:', err);
      setError(err.message || 'Failed to load wash plan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWashPlan();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWashPlan();
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  // Calculate statistics
  const stats = washPlan ? calculateWashStats(washPlan) : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Student'}</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettingsPress}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your wash plan...</Text>
          </View>
        )}

        {/* Error State */}
        {!loading && error && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchWashPlan}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Wash Plan Content */}
        {!loading && !error && washPlan && stats && (
          <View style={styles.content}>
            {/* Hero Card - Wash Plan Overview */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroTitle}>Yearly Wash Plan</Text>
                  <Text style={styles.heroSubtitle}>
                    {washPlan.policy_id?.name || 'Standard Plan'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: stats.statusColor + '20' }]}>
                  <Text style={[styles.statusText, { color: stats.statusColor }]}>
                    {stats.statusText}
                  </Text>
                </View>
              </View>

              {/* Circular Progress */}
              <View style={styles.progressContainer}>
                <ProgressRing
                  percentage={stats.remainingPercentage}
                  size={180}
                  strokeWidth={14}
                  color={stats.statusColor}
                  label={stats.remaining_washes.toString()}
                  sublabel="Remaining"
                />
              </View>

              {/* Date Range */}
              <View style={styles.dateRange}>
                <Text style={styles.dateText}>
                  {formatPlanDate(washPlan.start_date)} - {formatPlanDate(washPlan.end_date)}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardPrimary]}>
                <Text style={styles.statValue}>{stats.total_washes}</Text>
                <Text style={styles.statLabel}>Total Washes</Text>
              </View>

              <View style={[styles.statCard, styles.statCardWarning]}>
                <Text style={styles.statValue}>{stats.used_washes}</Text>
                <Text style={styles.statLabel}>Used</Text>
              </View>

              <View style={[styles.statCard, styles.statCardSuccess]}>
                <Text style={styles.statValue}>{washPlan.max_weight_per_wash} kg</Text>
                <Text style={styles.statLabel}>Max Weight</Text>
              </View>

              <View style={[styles.statCard, styles.statCardInfo]}>
                <Text style={styles.statValue}>Year {washPlan.year_no}</Text>
                <Text style={styles.statLabel}>Academic Year</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>Quick Actions</Text>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                activeOpacity={0.8}
              >
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonIcon}>+</Text>
                  <View style={styles.actionButtonTextContainer}>
                    <Text style={styles.actionButtonTitle}>New Wash Request</Text>
                    <Text style={styles.actionButtonSubtitle}>
                      Create a new laundry request
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary, styles.actionButtonHalf]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonIconSecondary}>📋</Text>
                  <Text style={styles.actionButtonTitleSecondary}>History</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary, styles.actionButtonHalf]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonIconSecondary}>ℹ️</Text>
                  <Text style={styles.actionButtonTitleSecondary}>Plan Details</Text>
                </TouchableOpacity>
              </View>
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
                      <Text style={styles.infoValue}>
                        {user.batch_id.batch_label}
                      </Text>
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
        )}

        {/* No Wash Plan State */}
        {!loading && !error && !washPlan && (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyTitle}>No Wash Plan Found</Text>
            <Text style={styles.emptySubtitle}>
              Please contact your administrator to set up your wash plan.
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SIZES.spacing.xl,
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.full,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsIcon: {
    fontSize: 20,
  },
  content: {
    padding: SIZES.spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xxl,
    paddingHorizontal: SIZES.spacing.lg,
  },
  loadingText: {
    marginTop: SIZES.spacing.md,
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: SIZES.base,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.spacing.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: SIZES.base,
    fontWeight: '600',
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
  },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.spacing.xl,
    marginBottom: SIZES.spacing.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.spacing.xl,
  },
  heroTitle: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  heroSubtitle: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SIZES.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.full,
  },
  statusText: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.spacing.xl,
  },
  dateRange: {
    alignItems: 'center',
    marginTop: SIZES.spacing.md,
  },
  dateText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SIZES.spacing.xs,
    marginBottom: SIZES.spacing.lg,
  },
  statCard: {
    width: '47%',
    margin: SIZES.spacing.xs,
    padding: SIZES.spacing.lg,
    borderRadius: SIZES.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardPrimary: {
    backgroundColor: COLORS.primary + '15',
  },
  statCardWarning: {
    backgroundColor: COLORS.warning + '15',
  },
  statCardSuccess: {
    backgroundColor: COLORS.success + '15',
  },
  statCardInfo: {
    backgroundColor: COLORS.info + '15',
  },
  statValue: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacing.xs,
  },
  statLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Quick Actions
  actionsContainer: {
    marginBottom: SIZES.spacing.lg,
  },
  actionsTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.spacing.md,
  },
  actionButton: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionButtonSecondary: {
    backgroundColor: COLORS.white,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginRight: SIZES.spacing.md,
    width: 40,
    textAlign: 'center',
  },
  actionButtonTextContainer: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SIZES.spacing.xs,
  },
  actionButtonSubtitle: {
    fontSize: SIZES.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButtonHalf: {
    width: '48%',
    marginBottom: 0,
  },
  actionButtonIconSecondary: {
    fontSize: 28,
    marginBottom: SIZES.spacing.sm,
    textAlign: 'center',
  },
  actionButtonTitleSecondary: {
    fontSize: SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  // User Info Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
