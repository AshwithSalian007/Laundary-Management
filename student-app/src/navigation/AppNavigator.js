import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/context/AuthContext';

// Screens
import LoginScreen from '../features/auth/screens/LoginScreen';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import NewRequestScreen from '../features/washRequests/screens/NewRequestScreen';
import RequestHistoryScreen from '../features/washRequests/screens/RequestHistoryScreen';
import RequestDetailsScreen from '../features/washRequests/screens/RequestDetailsScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3b82f6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ title: 'SmartWash' }}
            />
            <Stack.Screen
              name="NewRequest"
              component={NewRequestScreen}
              options={{ title: 'New Wash Request' }}
            />
            <Stack.Screen
              name="RequestHistory"
              component={RequestHistoryScreen}
              options={{ title: 'Request History' }}
            />
            <Stack.Screen
              name="RequestDetails"
              component={RequestDetailsScreen}
              options={{ title: 'Request Details' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
