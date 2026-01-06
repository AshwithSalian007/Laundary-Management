import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { washService } from '../services/washService';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

const NewRequestScreen = ({ navigation }) => {
  const [washPlan, setWashPlan] = useState(null);
  const [weight, setWeight] = useState('');
  const [clothCount, setClothCount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchWashPlan();
  }, []);

  const fetchWashPlan = async () => {
    try {
      const response = await washService.getMyWashPlan();
      setWashPlan(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load wash plan');
      navigation.goBack();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!weight) {
      newErrors.weight = 'Weight is required';
    } else if (parseFloat(weight) <= 0) {
      newErrors.weight = 'Weight must be greater than 0';
    } else if (parseFloat(weight) > washPlan?.max_weight_per_wash * 3) {
      newErrors.weight = `Weight seems too high. Max recommended: ${
        washPlan?.max_weight_per_wash * 3
      } kg`;
    }

    if (clothCount && parseInt(clothCount) < 0) {
      newErrors.clothCount = 'Cloth count cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateWashCount = () => {
    if (!weight || !washPlan) return 0;
    return Math.ceil(parseFloat(weight) / washPlan.max_weight_per_wash);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const washCount = calculateWashCount();

    if (washCount > washPlan.remaining_washes) {
      Alert.alert(
        'Insufficient Washes',
        `This request requires ${washCount} washes but you only have ${washPlan.remaining_washes} remaining.`
      );
      return;
    }

    Alert.alert(
      'Confirm Request',
      `This will use ${washCount} wash(es) from your plan. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              await washService.createWashRequest({
                weight_kg: parseFloat(weight),
                cloth_count: clothCount ? parseInt(clothCount) : 0,
                notes: notes.trim(),
              });

              Alert.alert('Success', 'Wash request submitted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert(
                'Error',
                error.message || 'Failed to create wash request'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!washPlan) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const washCount = calculateWashCount();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Available Washes</Text>
          <Text style={styles.infoValue}>
            {washPlan.remaining_washes} / {washPlan.total_washes}
          </Text>
          <Text style={styles.infoSubtext}>
            Max weight per wash: {washPlan.max_weight_per_wash} kg
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Weight (kg) *"
            placeholder="Enter laundry weight"
            value={weight}
            onChangeText={(text) => {
              setWeight(text);
              if (errors.weight) {
                setErrors({ ...errors, weight: '' });
              }
            }}
            error={errors.weight}
            keyboardType="decimal-pad"
          />

          {weight && washCount > 0 && (
            <View style={styles.washCountInfo}>
              <Text style={styles.washCountText}>
                This will use {washCount} wash(es)
              </Text>
            </View>
          )}

          <Input
            label="Number of Clothes (Optional)"
            placeholder="Enter cloth count"
            value={clothCount}
            onChangeText={(text) => {
              setClothCount(text);
              if (errors.clothCount) {
                setErrors({ ...errors, clothCount: '' });
              }
            }}
            error={errors.clothCount}
            keyboardType="number-pad"
          />

          <Input
            label="Notes (Optional)"
            placeholder="Any special instructions..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />

          <Button
            title="Submit Request"
            onPress={handleSubmit}
            loading={loading}
            disabled={!weight || washCount > washPlan.remaining_washes}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#3b82f6',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  infoValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 8,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  form: {
    padding: 16,
  },
  washCountInfo: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  washCountText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
  },
});

export default NewRequestScreen;
