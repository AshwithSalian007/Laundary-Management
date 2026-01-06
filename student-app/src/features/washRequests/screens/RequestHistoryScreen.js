import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { washService } from '../services/washService';

const RequestHistoryScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await washService.getMyWashRequests();
      setRequests(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load wash requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, []);

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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => navigation.navigate('RequestDetails', { id: item._id })}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestWeight}>{item.weight_kg} kg</Text>
          <Text style={styles.requestWashes}>
            {item.wash_count} wash(es)
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <Text style={styles.detailLabel}>Submitted:</Text>
        <Text style={styles.detailValue}>
          {new Date(item.given_date).toLocaleString()}
        </Text>
      </View>

      {item.returned_date && (
        <View style={styles.requestDetails}>
          <Text style={styles.detailLabel}>Returned:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.returned_date).toLocaleString()}
          </Text>
        </View>
      )}

      {item.cloth_count > 0 && (
        <View style={styles.requestDetails}>
          <Text style={styles.detailLabel}>Clothes:</Text>
          <Text style={styles.detailValue}>{item.cloth_count} items</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No wash requests yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first wash request to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestWeight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  requestWashes: {
    fontSize: 14,
    color: '#666',
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
  requestDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});

export default RequestHistoryScreen;
