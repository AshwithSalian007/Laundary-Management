import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SIZES } from '../constants/theme';
import { formatStatus } from '../services/washRequestService';

const CurrentWashRequest = ({ request, onViewDetails }) => {
  const { colors } = useTheme();

  if (!request) {
    return null;
  }

  const statusInfo = formatStatus(request.status);

  // Timeline steps
  const steps = [
    { key: 'pickup_pending', label: 'Pickup', icon: '📦' },
    { key: 'picked_up', label: 'Picked Up', icon: '✓' },
    { key: 'washing', label: 'Washing', icon: '🧺' },
    { key: 'completed', label: 'Done', icon: '✨' },
    { key: 'returned', label: 'Returned', icon: '✓' },
  ];

  // Determine which step is active
  const statusOrder = ['pickup_pending', 'picked_up', 'washing', 'completed', 'returned'];
  const currentIndex = statusOrder.indexOf(request.status);
  const isCancelled = request.status === 'cancelled';

  const getStepStatus = (index) => {
    if (isCancelled) return 'cancelled';
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Current Request
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Submitted {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Cancelled Status */}
      {isCancelled && (
        <View style={[styles.cancelledContainer, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
          <Text style={[styles.cancelledIcon]}>⚠️</Text>
          <View style={styles.cancelledTextContainer}>
            <Text style={[styles.cancelledTitle, { color: colors.error }]}>
              Request Cancelled
            </Text>
            {request.cancellation_reason && (
              <Text style={[styles.cancelledReason, { color: colors.textSecondary }]}>
                {request.cancellation_reason}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Timeline for active requests */}
      {!isCancelled && (
        <>
          <View style={styles.timelineContainer}>
            {steps.map((step, index) => {
              const stepStatus = getStepStatus(index);
              const isCompleted = stepStatus === 'completed';
              const isActive = stepStatus === 'active';
              const isPending = stepStatus === 'pending';

              return (
                <View key={step.key} style={styles.timelineStep}>
                  {/* Step Circle */}
                  <View style={styles.stepCircleContainer}>
                    {index > 0 && (
                      <View
                        style={[
                          styles.stepLine,
                          styles.stepLineBefore,
                          {
                            backgroundColor: isCompleted || isActive
                              ? colors.success
                              : colors.border,
                          },
                        ]}
                      />
                    )}
                    <View
                      style={[
                        styles.stepCircle,
                        {
                          backgroundColor: isCompleted
                            ? colors.success
                            : isActive
                            ? statusInfo.color
                            : colors.background,
                          borderColor: isCompleted || isActive
                            ? (isCompleted ? colors.success : statusInfo.color)
                            : colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.stepIcon}>
                        {isCompleted || isActive ? step.icon : '○'}
                      </Text>
                    </View>
                    {index < steps.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          styles.stepLineAfter,
                          {
                            backgroundColor: isCompleted
                              ? colors.success
                              : colors.border,
                          },
                        ]}
                      />
                    )}
                  </View>

                  {/* Step Label */}
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: isCompleted || isActive
                          ? colors.textPrimary
                          : colors.textSecondary,
                        fontWeight: isActive ? '600' : '400',
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Request Details */}
          <View style={[styles.detailsContainer, { backgroundColor: colors.background }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Cloth Count:
              </Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {request.cloth_count || 0} items
              </Text>
            </View>

            {request.weight_kg && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Weight:
                </Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {request.weight_kg} kg
                </Text>
              </View>
            )}

            {request.wash_count > 0 && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Washes Used:
                </Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                  {request.wash_count}
                </Text>
              </View>
            )}

            {request.notes && (
              <View style={styles.notesContainer}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Your Notes:
                </Text>
                <Text style={[styles.notesText, { color: colors.textPrimary }]}>
                  {request.notes}
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* View Details Button */}
      <TouchableOpacity
        style={[styles.viewButton, { backgroundColor: colors.primary }]}
        onPress={onViewDetails}
        activeOpacity={0.8}
      >
        <Text style={styles.viewButtonText}>View All Requests</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius.xl,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.spacing.lg,
  },
  title: {
    fontSize: SIZES.lg,
    fontWeight: 'bold',
  },
  subtitle: {
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

  // Cancelled Status
  cancelledContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    marginBottom: SIZES.spacing.md,
  },
  cancelledIcon: {
    fontSize: 24,
    marginRight: SIZES.spacing.sm,
  },
  cancelledTextContainer: {
    flex: 1,
  },
  cancelledTitle: {
    fontSize: SIZES.base,
    fontWeight: '600',
    marginBottom: SIZES.spacing.xs,
  },
  cancelledReason: {
    fontSize: SIZES.sm,
    lineHeight: 18,
  },

  // Timeline
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.lg,
    paddingHorizontal: SIZES.spacing.sm,
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginBottom: SIZES.spacing.sm,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepIcon: {
    fontSize: 16,
  },
  stepLine: {
    position: 'absolute',
    height: 2,
    width: '50%',
    top: 17,
    zIndex: 1,
  },
  stepLineBefore: {
    right: '50%',
  },
  stepLineAfter: {
    left: '50%',
  },
  stepLabel: {
    fontSize: SIZES.xs,
    textAlign: 'center',
  },

  // Details
  detailsContainer: {
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.md,
    marginBottom: SIZES.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.sm,
  },
  detailLabel: {
    fontSize: SIZES.sm,
  },
  detailValue: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: SIZES.spacing.xs,
  },
  notesText: {
    fontSize: SIZES.sm,
    marginTop: SIZES.spacing.xs,
    lineHeight: 18,
  },

  // View Button
  viewButton: {
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.base,
    fontWeight: '600',
  },
});

export default CurrentWashRequest;
