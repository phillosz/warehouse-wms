import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import SearchScreen from './screens/SearchScreen';
import RollDetailScreen from './screens/RollDetailScreen';
import RailDetailScreen from './screens/RailDetailScreen';
import SelectRailScreen from './screens/SelectRailScreen';
import ReceiveRollScreen from './screens/ReceiveRollScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Domů' }}
      />
      <Tab.Screen 
        name="Scan" 
        component={ScanScreen}
        options={{ tabBarLabel: 'Skenovat' }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ tabBarLabel: 'Hledat' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="RollDetail" 
              component={RollDetailScreen}
              options={{ title: 'Detail role' }}
            />
            <Stack.Screen 
              name="RailDetail" 
              component={RailDetailScreen}
              options={{ title: 'Detail kolejnice' }}
            />
            <Stack.Screen 
              name="SelectRail" 
              component={SelectRailScreen}
              options={{ title: 'Vybrat kolejnici' }}
            />
            <Stack.Screen 
              name="ReceiveRoll" 
              component={ReceiveRollScreen}
              options={{ title: 'Příjem role' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
