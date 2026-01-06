import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { washService } from '../services/washService';

const RequestDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      const response = await washService.getWashRequestDetails(id);
      setRequest(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load request details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
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
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.centerContainer}>
        <Text>Request not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Status Card */}
      <View
        style={[
          styles.statusCard,
          { backgroundColor: getStatusColor(request.status) },
        ]}
      >
        <Text style={styles.statusTitle}>Current Status</Text>
        <Text style={styles.statusValue}>
          {getStatusText(request.status)}
        </Text>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Request Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight</Text>
          <Text style={styles.detailValue}>{request.weight_kg} kg</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Wash Count</Text>
          <Text style={styles.detailValue}>{request.wash_count} wash(es)</Text>
        </View>

        {request.cloth_count > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Number of Clothes</Text>
            <Text style={styles.detailValue}>{request.cloth_count} items</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Submitted Date</Text>
          <Text style={styles.detailValue}>
            {new Date(request.given_date).toLocaleString()}
          </Text>
        </View>

        {request.returned_date && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Returned Date</Text>
            <Text style={styles.detailValue}>
              {new Date(request.returned_date).toLocaleString()}
            </Text>
          </View>
        )}

        {request.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.detailLabel}>Notes</Text>
            <Text style={styles.notesText}>{request.notes}</Text>
          </View>
        )}
      </View>

      {/* Status Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status Timeline</Text>

        <View style={styles.timelineContainer}>
          <TimelineItem
            title="Pickup Pending"
            completed={true}
            active={request.status === 'pickup_pending'}
          />
          <TimelineItem
            title="Picked Up"
            completed={['picked_up', 'washing', 'completed', 'returned'].includes(
              request.status
            )}
            active={request.status === 'picked_up'}
          />
          <TimelineItem
            title="Washing"
            completed={['washing', 'completed', 'returned'].includes(
              request.status
            )}
            active={request.status === 'washing'}
          />
          <TimelineItem
            title="Completed"
            completed={['completed', 'returned'].includes(request.status)}
            active={request.status === 'completed'}
          />
          <TimelineItem
            title="Returned"
            completed={request.status === 'returned'}
            active={request.status === 'returned'}
            isLast={true}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const TimelineItem = ({ title, completed, active, isLast }) => (
  <View style={styles.timelineItem}>
    <View style={styles.timelineLeft}>
      <View
        style={[
          styles.timelineDot,
          completed && styles.timelineDotCompleted,
          active && styles.timelineDotActive,
        ]}
      />
      {!isLast && (
        <View
          style={[
            styles.timelineLine,
            completed && styles.timelineLineCompleted,
          ]}
        />
      )}
    </View>
    <Text
      style={[
        styles.timelineTitle,
        completed && styles.timelineTitleCompleted,
        active && styles.timelineTitleActive,
      ]}
    >
      {title}
    </Text>
  </View>
);

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
  statusCard: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e5e5e5',
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  timelineDotCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  timelineDotActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e5e5',
    marginTop: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#10b981',
  },
  timelineTitle: {
    fontSize: 14,
    color: '#999',
    paddingTop: 2,
  },
  timelineTitleCompleted: {
    color: '#666',
    fontWeight: '500',
  },
  timelineTitleActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default RequestDetailsScreen;
