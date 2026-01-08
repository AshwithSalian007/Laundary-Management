import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AccountInfoScreen from '../screens/AccountInfoScreen';
import WashRequestScreen from '../screens/WashRequestScreen';

const Stack = createStackNavigator();

// Fade transition interpolator - defined outside component to prevent recreation
const fadeTransition = ({ current: { progress } }) => ({
  cardStyle: {
    opacity: progress,
  },
});

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark, colors } = useTheme();

  // Create custom navigation theme based on current theme
  const navigationTheme = React.useMemo(() => ({
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.primary,
    },
  }), [isDark, colors]);

  // Memoize card style to prevent recreation
  const cardStyle = React.useMemo(() => ({
    backgroundColor: colors.background,
  }), [colors.background]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: cardStyle,
          cardStyleInterpolator: fadeTransition,
        }}
      >
        {isAuthenticated ? (
          // User is authenticated - Show app screens
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AccountInfo" component={AccountInfoScreen} />
            <Stack.Screen name="WashRequest" component={WashRequestScreen} />
          </>
        ) : (
          // User is not authenticated - Show auth screens
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
