import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { SIZES } from '../constants/theme';
import { getMyWashPlan } from '../services/washPlanService';
import { createWashRequest, getMyWashRequests } from '../services/washRequestService';

const WashRequestScreen = ({ navigation }) => {
  const { isDark, colors } = useTheme();

  // Form state
  const [clothCount, setClothCount] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [washPlan, setWashPlan] = useState(null);
  const [errors, setErrors] = useState({});
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [checkFailed, setCheckFailed] = useState(false);

  // Fetch wash plan to display remaining washes
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchWashPlan(), checkActiveRequests()]);
  };

  const fetchWashPlan = async () => {
    try {
      setLoading(true);
      const response = await getMyWashPlan();
      setWashPlan(response.data);
    } catch (error) {
      console.error('Failed to fetch wash plan:', error);
      Alert.alert(
        'Error',
        'Failed to load wash plan details. Please try again.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const checkActiveRequests = async () => {
    try {
      const response = await getMyWashRequests();
      const requests = response.data || [];
      // Find any request that is NOT returned or cancelled
      const active = requests.find(
        (req) => !['returned', 'cancelled'].includes(req.status)
      );

      if (active) {
        setHasActiveRequest(true);
        setActiveRequest(active);
      } else {
        setHasActiveRequest(false);
        setActiveRequest(null);
      }
      setCheckFailed(false);
    } catch (error) {
      console.error('Failed to check active requests:', error);
      setCheckFailed(true);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate cloth count if provided
    if (clothCount && (isNaN(clothCount) || parseInt(clothCount) < 0)) {
      newErrors.clothCount = 'Please enter a valid number';
    } else if (clothCount && parseInt(clothCount) > 1000) {
      newErrors.clothCount = 'Cloth count cannot exceed 1000';
    }

    // Validate notes length
    if (notes && notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Check if there's already an active request
    if (hasActiveRequest) {
      Alert.alert(
        'Active Request Exists',
        'You already have an active wash request. Please wait for it to be completed or cancelled before creating a new one.',
        [
          {
            text: 'View Request',
            onPress: () => navigation.navigate('MyRequests'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const clothCountValue = clothCount ? parseInt(clothCount) : 0;
      const notesValue = notes.trim();

      await createWashRequest(clothCountValue, notesValue);

      // Show success alert
      Alert.alert(
        'Success',
        'Your wash request has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create wash request:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create wash request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          New Wash Request
        </Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading...
              </Text>
            </View>
          ) : (
            <View style={styles.content}>
              {/* Remaining Washes Info Card */}
              {washPlan && (
                <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Remaining Washes
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.primary }]}>
                      {washPlan.remaining_washes} / {washPlan.total_washes}
                    </Text>
                  </View>
                  <Text style={[styles.infoNote, { color: colors.textSecondary }]}>
                    Weight will be measured by admin during pickup
                  </Text>
                </View>
              )}

              {/* Active Request Warning */}
              {hasActiveRequest && activeRequest && (
                <View style={[styles.warningCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                  <Text style={[styles.warningIcon, { color: colors.warning }]}>⚠️</Text>
                  <View style={styles.warningContent}>
                    <Text style={[styles.warningTitle, { color: colors.textPrimary }]}>
                      Active Request Found
                    </Text>
                    <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                      You already have an active wash request with status: {activeRequest.status.replace('_', ' ')}
                    </Text>
                    <TouchableOpacity
                      style={[styles.warningButton, { backgroundColor: colors.warning }]}
                      onPress={() => navigation.navigate('MyRequests')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.warningButtonText}>View Request</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Check Failed Warning */}
              {checkFailed && !hasActiveRequest && (
                <View style={[styles.warningCard, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                  <Text style={[styles.warningIcon, { color: colors.error }]}>⚠️</Text>
                  <View style={styles.warningContent}>
                    <Text style={[styles.warningTitle, { color: colors.textPrimary }]}>
                      Connection Issue
                    </Text>
                    <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                      Could not verify active requests. Please check your internet connection and try again.
                    </Text>
                    <TouchableOpacity
                      style={[styles.warningButton, { backgroundColor: colors.error }]}
                      onPress={checkActiveRequests}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.warningButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Form */}
              <View style={styles.form}>
                {/* Cloth Count Input */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>
                    Number of Clothes (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: errors.clothCount ? colors.error : colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="Enter number of clothes"
                    placeholderTextColor={colors.textDisabled}
                    value={clothCount}
                    onChangeText={(text) => {
                      setClothCount(text);
                      if (errors.clothCount) {
                        setErrors({ ...errors, clothCount: null });
                      }
                    }}
                    keyboardType="numeric"
                    editable={!submitting}
                  />
                  {errors.clothCount && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errors.clothCount}
                    </Text>
                  )}
                </View>

                {/* Notes Input */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>
                    Additional Notes (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: colors.background,
                        borderColor: errors.notes ? colors.error : colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="Any special instructions or notes..."
                    placeholderTextColor={colors.textDisabled}
                    value={notes}
                    onChangeText={(text) => {
                      setNotes(text);
                      if (errors.notes) {
                        setErrors({ ...errors, notes: null });
                      }
                    }}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!submitting}
                    maxLength={500}
                  />
                  {errors.notes && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                      {errors.notes}
                    </Text>
                  )}
                  <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
                    {notes.length}/500 characters
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: colors.primary },
                    submitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  )}
                </TouchableOpacity>

                {/* Info Text */}
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                  After submission, your laundry will be picked up and weighed by the admin.
                  The wash count will be calculated based on the actual weight.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SIZES.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SIZES.spacing.md,
  },
  spacer: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xxl,
  },
  loadingText: {
    marginTop: SIZES.spacing.md,
    fontSize: SIZES.base,
  },
  content: {
    padding: SIZES.spacing.lg,
  },
  infoCard: {
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  infoLabel: {
    fontSize: SIZES.base,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
  },
  infoNote: {
    fontSize: SIZES.sm,
    fontStyle: 'italic',
  },
  form: {
    gap: SIZES.spacing.lg,
  },
  inputContainer: {
    marginBottom: SIZES.spacing.md,
  },
  label: {
    fontSize: SIZES.base,
    fontWeight: '600',
    marginBottom: SIZES.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.md,
    fontSize: SIZES.base,
  },
  textArea: {
    minHeight: 100,
    paddingTop: SIZES.spacing.md,
  },
  errorText: {
    fontSize: SIZES.sm,
    marginTop: SIZES.spacing.xs,
  },
  characterCount: {
    fontSize: SIZES.xs,
    marginTop: SIZES.spacing.xs,
    textAlign: 'right',
  },
  submitButton: {
    borderRadius: SIZES.radius.lg,
    paddingVertical: SIZES.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.lg,
    fontWeight: '600',
  },
  helpText: {
    fontSize: SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SIZES.spacing.md,
  },
  warningCard: {
    flexDirection: 'row',
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.xl,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 28,
    marginRight: SIZES.spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: SIZES.base,
    fontWeight: '600',
    marginBottom: SIZES.spacing.xs,
  },
  warningText: {
    fontSize: SIZES.sm,
    lineHeight: 20,
    marginBottom: SIZES.spacing.md,
  },
  warningButton: {
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    alignSelf: 'flex-start',
  },
  warningButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
});

export default WashRequestScreen;
