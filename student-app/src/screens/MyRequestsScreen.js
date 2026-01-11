import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { SIZES } from '../constants/theme';
import { getMyWashRequests, formatStatus } from '../services/washRequestService';

const MyRequestsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Filter options
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // Fetch wash requests
  const fetchRequests = async () => {
    try {
      setError(null);
      const response = await getMyWashRequests();
      setRequests(response.data || []);
      applyFilter(selectedFilter, response.data || []);
    } catch (err) {
      console.error('Failed to fetch wash requests:', err);
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  // Apply filter
  const applyFilter = (filter, data = requests) => {
    setSelectedFilter(filter);

    if (filter === 'all') {
      setFilteredRequests(data);
    } else if (filter === 'active') {
      setFilteredRequests(
        data.filter((req) =>
          ['pickup_pending', 'picked_up', 'washing', 'completed'].includes(req.status)
        )
      );
    } else if (filter === 'completed') {
      setFilteredRequests(
        data.filter((req) => req.status === 'completed' || req.status === 'returned')
      );
    } else if (filter === 'cancelled') {
      setFilteredRequests(data.filter((req) => req.status === 'cancelled'));
    }
  };

  // Render request card
  const renderRequestCard = ({ item }) => {
    const statusInfo = formatStatus(item.status);
    const isCancelled = item.status === 'cancelled';
    const isReturned = item.status === 'returned';

    return (
      <View
        style={[
          styles.requestCard,
          { backgroundColor: colors.card, borderLeftColor: statusInfo.color },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.requestDate, { color: colors.textPrimary }]}>
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={[styles.requestTime, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Cloth Count:
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {item.cloth_count || 0} items
            </Text>
          </View>

          {item.weight_kg && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Weight:
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {item.weight_kg} kg
              </Text>
            </View>
          )}

          {item.wash_count > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Washes Used:
              </Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                {item.wash_count}
              </Text>
            </View>
          )}

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>
                Notes:
              </Text>
              <Text style={[styles.notesText, { color: colors.textPrimary }]} numberOfLines={2}>
                {item.notes}
              </Text>
            </View>
          )}

          {isCancelled && item.cancellation_reason && (
            <View style={[styles.cancelledBox, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.cancelledLabel, { color: colors.error }]}>
                Cancelled:
              </Text>
              <Text style={[styles.cancelledText, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.cancellation_reason}
              </Text>
            </View>
          )}

          {isReturned && item.returned_date && (
            <View style={[styles.returnedBox, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.returnedLabel, { color: colors.success }]}>
                Returned on {new Date(item.returned_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            My Requests
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterPill,
              {
                backgroundColor: selectedFilter === filter.key ? colors.primary : colors.card,
                borderColor: selectedFilter === filter.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => applyFilter(filter.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: selectedFilter === filter.key ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: selectedFilter === filter.key ? '600' : '400',
                },
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your requests...
          </Text>
        </View>
      )}

      {/* Error State */}
      {!loading && error && (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchRequests}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!loading && !error && filteredRequests.length === 0 && (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No Requests Found
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {selectedFilter === 'all'
              ? "You haven't made any wash requests yet"
              : `No ${selectedFilter} requests`}
          </Text>
          {selectedFilter === 'all' && (
            <TouchableOpacity
              style={[styles.newRequestButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('WashRequest')}
              activeOpacity={0.8}
            >
              <Text style={styles.newRequestButtonText}>Create New Request</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Requests List */}
      {!loading && !error && filteredRequests.length > 0 && (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequestCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
  },

  // Filters
  filterContainer: {
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
  },
  filterPill: {
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.full,
    marginRight: SIZES.spacing.sm,
    borderWidth: 1,
  },
  filterText: {
    fontSize: SIZES.sm,
  },

  // List
  listContent: {
    padding: SIZES.spacing.lg,
  },

  // Request Card
  requestCard: {
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.spacing.md,
  },
  cardHeaderLeft: {},
  requestDate: {
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  requestTime: {
    fontSize: SIZES.sm,
    marginTop: SIZES.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.full,
  },
  statusText: {
    fontSize: SIZES.xs,
    fontWeight: '600',
  },

  // Card Body
  cardBody: {},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.xs,
  },
  infoLabel: {
    fontSize: SIZES.sm,
  },
  infoValue: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: SIZES.spacing.sm,
  },
  notesLabel: {
    fontSize: SIZES.sm,
    marginBottom: SIZES.spacing.xs,
  },
  notesText: {
    fontSize: SIZES.sm,
    lineHeight: 18,
  },
  cancelledBox: {
    marginTop: SIZES.spacing.sm,
    padding: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
  },
  cancelledLabel: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    marginBottom: SIZES.spacing.xs,
  },
  cancelledText: {
    fontSize: SIZES.sm,
    lineHeight: 16,
  },
  returnedBox: {
    marginTop: SIZES.spacing.sm,
    padding: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
  },
  returnedLabel: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },

  // Center Container (Loading/Error/Empty)
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
    color: '#FFFFFF',
    fontSize: SIZES.base,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.spacing.md,
  },
  emptyTitle: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    marginBottom: SIZES.spacing.sm,
  },
  emptySubtitle: {
    fontSize: SIZES.base,
    textAlign: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  newRequestButton: {
    paddingHorizontal: SIZES.spacing.xl,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
  },
  newRequestButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.base,
    fontWeight: '600',
  },
});

export default MyRequestsScreen;
