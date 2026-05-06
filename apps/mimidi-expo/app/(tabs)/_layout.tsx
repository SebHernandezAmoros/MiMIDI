import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Perform' }} />
      <Tabs.Screen name="smc-pad" options={{ title: 'SMC Pad' }} />
      <Tabs.Screen name="plugins" options={{ title: 'Plugins' }} />
      <Tabs.Screen name="edit" options={{ title: 'Timelines' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
