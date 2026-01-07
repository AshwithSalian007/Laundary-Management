import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useTheme } from './src/context/ThemeContext';

// Wrapper component to access theme context
function AppContent() {
  const { isDark, colors } = useTheme();

  // Force StatusBar update when theme changes
  React.useEffect(() => {
    // This ensures StatusBar is properly updated on theme change
    const timer = setTimeout(() => {
      // Small delay to ensure proper update
    }, 10);
    return () => clearTimeout(timer);
  }, [isDark]);

  return (
    <>
      <StatusBar
        key={isDark ? 'dark' : 'light'}
        style={isDark ? 'light' : 'dark'}
        animated={true}
      />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
