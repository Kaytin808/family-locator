import React from 'react';
import {Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useApp} from '../context/AppContext';
import {AuthScreen} from '../screens/AuthScreen';
import {InviteScreen} from '../screens/InviteScreen';
import {MapScreen} from '../screens/MapScreen';
import {PlacesScreen} from '../screens/PlacesScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {colors} from '../theme';

export type RootTabParamList = {Map: undefined; Places: undefined; Invite: {inviteId?: string} | undefined; Settings: undefined};
const Tab = createBottomTabNavigator<RootTabParamList>();
const icons: Record<keyof RootTabParamList, string> = {Map: '⌖', Places: '◆', Invite: '+', Settings: '☰'};

export function AppNavigator() {
  const {user} = useApp();
  if (!user) return <AuthScreen />;
  return (
        <Tab.Navigator screenOptions={({route}) => ({headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: {backgroundColor: colors.surface, borderTopColor: colors.line, height: 82, paddingTop: 7}, tabBarLabelStyle: {fontSize: 11, fontWeight: '700', paddingBottom: 7}, tabBarIcon: ({color}) => <TextIcon value={icons[route.name]} color={color} />})}>
      <Tab.Screen name="Map" component={MapScreen} /><Tab.Screen name="Places" component={PlacesScreen} /><Tab.Screen name="Invite" component={InviteScreen} /><Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function TextIcon({value, color}: {value: string; color: string}) {
  return <Text style={{color, fontSize: 23, fontWeight: '800'}}>{value}</Text>;
}
