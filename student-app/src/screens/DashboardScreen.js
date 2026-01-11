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
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SIZES } from '../constants/theme';
import ProgressRing from '../components/ProgressRing';
import Sidebar from '../components/Sidebar';
import CurrentWashRequest from '../components/CurrentWashRequest';
import {
  getMyWashPlan,
  calculateWashStats,
  formatPlanDate,
} from '../services/washPlanService';
import { getMyWashRequests } from '../services/washRequestService';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isDark, colors } = useTheme();
  const [washPlan, setWashPlan] = useState(null);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

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

  // Fetch current wash request
  const fetchCurrentRequest = async () => {
    try {
      const response = await getMyWashRequests();
      const requests = response.data || [];
      // Find the most recent active request (not returned or cancelled)
      const activeRequest = requests.find(
        (req) => !['returned', 'cancelled'].includes(req.status)
      );
      setCurrentRequest(activeRequest || null);
    } catch (err) {
      console.error('Failed to fetch current request:', err);
    }
  };

  useEffect(() => {
    fetchWashPlan();
    fetchCurrentRequest();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWashPlan();
    fetchCurrentRequest();
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Calculate statistics
  const stats = washPlan ? calculateWashStats(washPlan) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleSidebar}
          activeOpacity={0.7}
        >
          <View style={styles.hamburger}>
            <View style={[styles.hamburgerLine, { backgroundColor: colors.textPrimary }]} />
            <View style={[styles.hamburgerLine, { backgroundColor: colors.textPrimary }]} />
            <View style={[styles.hamburgerLine, { backgroundColor: colors.textPrimary }]} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Dashboard
          </Text>
        </View>
        <View style={styles.menuButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading your wash plan...
            </Text>
          </View>
        )}

        {/* Error State */}
        {!loading && error && (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
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
            <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                    Yearly Wash Plan
                  </Text>
                  <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
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
                  backgroundColor={colors.border}
                  label={stats.remaining_washes.toString()}
                  sublabel="Remaining"
                  sublabelColor={colors.textSecondary}
                />
              </View>

              {/* Date Range */}
              <View style={styles.dateRange}>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  {formatPlanDate(washPlan.start_date)} - {formatPlanDate(washPlan.end_date)}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {stats.total_washes}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Total Washes
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.warning + '15' }]}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {stats.used_washes}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Used
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {washPlan.max_weight_per_wash} kg
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Max Weight
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.info + '15' }]}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  Year {washPlan.year_no}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Academic Year
                </Text>
              </View>
            </View>

            {/* Current Wash Request */}
            {currentRequest && (
              <CurrentWashRequest
                request={currentRequest}
                onViewDetails={() => navigation.navigate('MyRequests')}
              />
            )}

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
              <Text style={[styles.actionsTitle, { color: colors.textPrimary }]}>
                Quick Actions
              </Text>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('WashRequest')}
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
                  style={[
                    styles.actionButton,
                    styles.actionButtonHalf,
                    { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
                  ]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('MyRequests')}
                >
                  <Text style={styles.actionButtonIconSecondary}>📋</Text>
                  <Text style={[styles.actionButtonTitleSecondary, { color: colors.textPrimary }]}>
                    History
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.actionButtonHalf,
                    { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonIconSecondary}>ℹ️</Text>
                  <Text style={[styles.actionButtonTitleSecondary, { color: colors.textPrimary }]}>
                    Plan Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* No Wash Plan State */}
        {!loading && !error && !washPlan && (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Wash Plan Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SIZES.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburger: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 3,
    borderRadius: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
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
  },
  errorText: {
    fontSize: SIZES.base,
    textAlign: 'center',
    marginBottom: SIZES.spacing.md,
  },
  retryButton: {
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
  },
  retryButtonText: {
    color: '#FFFFFF', // Always white on primary button
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SIZES.spacing.sm,
  },
  emptySubtitle: {
    fontSize: SIZES.base,
    textAlign: 'center',
  },

  // Hero Card
  heroCard: {
    borderRadius: SIZES.radius.xl,
    padding: SIZES.spacing.xl,
    marginBottom: SIZES.spacing.lg,
    shadowColor: '#000000',
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
  },
  heroSubtitle: {
    fontSize: SIZES.sm,
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
  statValue: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    marginBottom: SIZES.spacing.xs,
  },
  statLabel: {
    fontSize: SIZES.sm,
    textAlign: 'center',
  },

  // Quick Actions
  actionsContainer: {
    marginBottom: SIZES.spacing.lg,
  },
  actionsTitle: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
    marginBottom: SIZES.spacing.md,
  },
  actionButton: {
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF', // Always white on primary button
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
    color: '#FFFFFF', // Always white on primary button
    marginBottom: SIZES.spacing.xs,
  },
  actionButtonSubtitle: {
    fontSize: SIZES.sm,
    color: '#FFFFFF', // Always white on primary button
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
    textAlign: 'center',
  },
});

export default DashboardScreen;
