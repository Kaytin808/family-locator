import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {AppProvider, useApp} from './context/AppContext';
import {AppNavigator} from './navigation/AppNavigator';
import {LoadingView} from './components/LoadingView';
import {linking} from './navigation/linking';

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

export default function ConfiguredApp() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
