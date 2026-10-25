import React from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MatchMeSharedScreen } from './src/screens/MatchMeSharedScreen';
import { configuredOrigin } from './src/lib/job-links';

export default function App() {
  const origin = configuredOrigin(process.env.EXPO_PUBLIC_MATCHME_WEB_ORIGIN);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {origin ? <MatchMeSharedScreen origin={origin} /> : (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', padding: 24 }}>
          <View accessible accessibilityRole="alert">
            <Text style={{ color: '#0f172a', textAlign: 'center', fontSize: 18, fontWeight: '600' }}>MatchMe</Text>
            <Text style={{ color: '#0f172a', textAlign: 'center', marginTop: 12 }}>
              This mobile build is not configured. Contact MatchMe support.
              {'\n'}لم يتم إعداد نسخة الجوال هذه. تواصل مع دعم MatchMe.
            </Text>
          </View>
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}
