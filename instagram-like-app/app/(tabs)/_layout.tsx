import { Tabs } from 'expo-router';
import React from 'react';

import { useApp } from '../../contexts/AppContext';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { role } = useApp();

  const canSeeMembership = role === 'admin' || role === 'member';
  const canSeeDonations = role !== 'guest';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Posts',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="text.bubble" color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: 'Media',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="play.rectangle" color={color} />,
        }}
      />
      {canSeeMembership && (
        <Tabs.Screen
          name="members"
          options={{
            title: 'Members',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.3.fill" color={color} />,
          }}
        />
      )}
      {canSeeDonations && (
        <Tabs.Screen
          name="donations"
          options={{
            title: 'Donations',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.circle" color={color} />,
          }}
        />
      )}
      <Tabs.Screen
        name="funds"
        options={{
          title: 'Relief',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="hands.sparkles.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
