import React from 'react';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {firebaseConfigured} from './src/config/build';

function FirebaseSetupRequired() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.eyebrow}>FAMILY LOCATOR</Text>
        <Text style={styles.title}>Firebase setup required</Text>
        <Text style={styles.body}>
          This preview opened safely, but it cannot sign in or share locations
          until a real GoogleService-Info.plist is added to the GitHub build.
        </Text>
        <Text style={styles.detail}>
          Add the GOOGLE_SERVICE_INFO_PLIST_BASE64 repository secret, then run
          the iOS workflow again.
        </Text>
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  if (!firebaseConfigured) {
    return <FirebaseSetupRequired />;
  }

  // Keep Firebase-dependent modules unevaluated in placeholder builds. Their
  // getApp() calls are only safe after the native default app is configured.
  const ConfiguredApp = require('./src/ConfiguredApp').default;
  return <ConfiguredApp />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#F4F7FB',
  },
  eyebrow: {
    color: '#3973E6',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  title: {
    color: '#152238',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
  },
  body: {
    color: '#41516A',
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 14,
  },
  detail: {
    color: '#68778E',
    fontSize: 14,
    lineHeight: 21,
  },
});
