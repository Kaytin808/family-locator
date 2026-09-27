import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {AppProvider, useApp} from './src/context/AppContext';
import {AppNavigator} from './src/navigation/AppNavigator';
import {LoadingView} from './src/components/LoadingView';
import {linking} from './src/navigation/linking';

function Root() {
  const {initializing} = useApp();

  if (initializing) {
    return <LoadingView label="Finding your circle…" />;
  }

  return (
    <NavigationContainer linking={linking}>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
