import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../auth/context/AuthContext';
import { washService } from '../../washRequests/services/washService';
import Button from '../../../shared/components/Button';

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [washPlan, setWashPlan] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch both in parallel but handle errors independently
      const [planResult, requestsResult] = await Promise.allSettled([
        washService.getMyWashPlan(),
        washService.getMyWashRequests(),
      ]);

      // Handle wash plan result
      if (planResult.status === 'fulfilled') {
        setWashPlan(planResult.value.data);
      } else {
        console.error('Failed to fetch wash plan:', planResult.reason);
        if (planResult.reason?.message !== 'No active wash plan found') {
          // Only show error if it's not about missing wash plan
          Alert.alert('Error', 'Failed to load wash plan');
        }
      }

      // Handle requests result
      if (requestsResult.status === 'fulfilled') {
        setRecentRequests(requestsResult.value.data?.slice(0, 3) || []);
      } else {
        console.error('Failed to fetch requests:', requestsResult.reason);
      }
    } catch (error) {
      console.error('Unexpected error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const getStatusColor = (status) => {
    const colors = {
      pickup_pending: '#f59e0b',
      picked_up: '#3b82f6',
      washing: '#8b5cf6',
      completed: '#10b981',
      returned: '#059669',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status) => {
    const texts = {
      pickup_pending: 'Pickup Pending',
      picked_up: 'Picked Up',
      washing: 'Washing',
      completed: 'Completed',
      returned: 'Returned',
      cancelled: 'Cancelled',
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Wash Plan Card */}
      {washPlan ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Wash Plan</Text>
          <View style={styles.washPlanContent}>
            <View style={styles.washStat}>
              <Text style={styles.statValue}>{washPlan.remaining_washes}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.washStat}>
              <Text style={styles.statValue}>{washPlan.used_washes}</Text>
              <Text style={styles.statLabel}>Used</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.washStat}>
              <Text style={styles.statValue}>{washPlan.total_washes}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
          <Text style={styles.maxWeightText}>
            Max weight per wash: {washPlan.max_weight_per_wash} kg
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No Active Wash Plan</Text>
          <Text style={styles.noDataText}>
            Please contact the hostel administration to activate your wash plan.
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title="New Wash Request"
          onPress={() => navigation.navigate('NewRequest')}
          disabled={!washPlan || washPlan.remaining_washes === 0}
        />
        <Button
          title="View All Requests"
          onPress={() => navigation.navigate('RequestHistory')}
          variant="secondary"
          style={styles.secondaryButton}
        />
      </View>

      {/* Recent Requests */}
      {recentRequests.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Requests</Text>
          {recentRequests.map((request) => (
            <TouchableOpacity
              key={request._id}
              style={styles.requestItem}
              onPress={() =>
                navigation.navigate('RequestDetails', { id: request._id })
              }
            >
              <View style={styles.requestInfo}>
                <Text style={styles.requestWeight}>{request.weight_kg} kg</Text>
                <Text style={styles.requestDate}>
                  {new Date(request.given_date).toLocaleDateString()}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(request.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(request.status)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  washPlanContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  washStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: '#e5e5e5',
  },
  maxWeightText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  secondaryButton: {
    marginTop: 8,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestInfo: {
    flex: 1,
  },
  requestWeight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DashboardScreen;
