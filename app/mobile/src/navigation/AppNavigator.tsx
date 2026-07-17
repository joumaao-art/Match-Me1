/**
 * Main app navigation - handles auth state and role-based routing.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores';
import { AuthScreen } from '../screens/AuthScreen';
import { SeekerSwipeScreen } from '../screens/SeekerSwipeScreen';
import { SeekerDashboardScreen } from '../screens/SeekerDashboardScreen';
import { CompanyDashboardScreen } from '../screens/CompanyDashboardScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { useTheme } from '../hooks/useTheme';

const Stack = createNativeStackNavigator();
const SeekerTab = createBottomTabNavigator();
const CompanyTab = createBottomTabNavigator();

function SeekerTabs() {
  const { colors } = useTheme();
  return (
    <SeekerTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <SeekerTab.Screen name="Discover" component={SeekerSwipeScreen} options={{ tabBarLabel: 'Discover' }} />
      <SeekerTab.Screen name="Dashboard" component={SeekerDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <SeekerTab.Screen name="Messages" component={MessagesScreen} options={{ tabBarLabel: 'Messages' }} />
      <SeekerTab.Screen name="Subscription" component={SubscriptionScreen} options={{ tabBarLabel: 'Premium' }} />
    </SeekerTab.Navigator>
  );
}

function CompanyTabs() {
  const { colors } = useTheme();
  return (
    <CompanyTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <CompanyTab.Screen name="Dashboard" component={CompanyDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <CompanyTab.Screen name="Messages" component={MessagesScreen} options={{ tabBarLabel: 'Messages' }} />
      <CompanyTab.Screen name="Subscription" component={SubscriptionScreen} options={{ tabBarLabel: 'Premium' }} />
    </CompanyTab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, userRole } = useAuthStore();
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : userRole === 'company' ? (
          <Stack.Screen name="CompanyTabs" component={CompanyTabs} />
        ) : (
          <Stack.Screen name="SeekerTabs" component={SeekerTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;