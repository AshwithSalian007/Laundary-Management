import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SIZES } from '../constants/theme';

const AccountInfoScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isDark, colors } = useTheme();

  const InfoCard = ({ label, value }) => (
    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
        {value || 'Not available'}
      </Text>
    </View>
  );

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Account Information
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: colors.textPrimary }]}>
            {user?.name || 'Student'}
          </Text>
          <Text style={[styles.profileRole, { color: colors.textSecondary }]}>
            Student
          </Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Personal Information
          </Text>
          <InfoCard label="Full Name" value={user?.name} />
          <InfoCard label="Email Address" value={user?.email} />
          <InfoCard label="Registration Number" value={user?.registration_number} />
        </View>

        {/* Academic Information */}
        {(user?.batch_id || user?.year_no) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Academic Information
            </Text>
            {user?.batch_id && (
              <>
                <InfoCard
                  label="Batch"
                  value={user.batch_id.batch_label}
                />
                {user.batch_id.department_id && (
                  <InfoCard
                    label="Department"
                    value={user.batch_id.department_id.name}
                  />
                )}
              </>
            )}
          </View>
        )}

        {/* Account Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Account Status
          </Text>
          <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                Account Status
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: colors.success }]}>
                  Active
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: SIZES.spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xxl,
    paddingHorizontal: SIZES.spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    marginBottom: SIZES.spacing.xs,
  },
  profileRole: {
    fontSize: SIZES.base,
  },
  section: {
    paddingHorizontal: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.xl,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    marginBottom: SIZES.spacing.md,
  },
  infoCard: {
    padding: SIZES.spacing.lg,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.spacing.md,
    borderWidth: 1,
  },
  infoLabel: {
    fontSize: SIZES.sm,
    marginBottom: SIZES.spacing.xs,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: SIZES.base,
    fontWeight: '400',
  },
  statusCard: {
    padding: SIZES.spacing.lg,
    borderRadius: SIZES.radius.lg,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: SIZES.base,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.full,
  },
  statusBadgeText: {
    fontSize: SIZES.sm,
    fontWeight: '600',
  },
});

export default AccountInfoScreen;
