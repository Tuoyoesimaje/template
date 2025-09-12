import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../screens/ChatScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RemindersScreen from '../screens/RemindersScreen';
import NotesEditorScreen from '../screens/NotesEditorScreen';
import QuizScreen from '../screens/QuizScreen';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export type RootStackParamList = {
  Chat: undefined;
  Login: undefined;
  Signup: undefined;
  Profile: undefined;
  Reminders: undefined;
  Notes: undefined;
  Quiz: { topic?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingGate({ theme }: { theme: any }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme['--bg-gradient'] || '#f5f7fa' }}>
      <ActivityIndicator size="large" color={theme['--accent-1'] || '#4f46e5'} />
    </View>
  );
}

export default function RootNavigator() {
  const { token, initializing } = useAuth();
  const { theme } = useTheme();

  const navTheme: Theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme['--bg-gradient'] || '#f5f7fa',
      card: theme['--panel-bg'] || '#ffffff',
      text: theme['--text-primary'] || '#2c3e50',
      border: theme['--border'] || 'rgba(0,0,0,0.1)',
      primary: theme['--accent-1'] || '#4f46e5'
    }
  };

  if (initializing) return <LoadingGate theme={theme} />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={token ? 'Chat' : 'Login'}>
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Reminders" component={RemindersScreen} />
        <Stack.Screen name="Notes" component={NotesEditorScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}