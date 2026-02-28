import { CommonActions } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import React from 'react';
import { BottomNavigation, Icon, useTheme } from 'react-native-paper';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          style={{ backgroundColor: theme.colors.surface }}
          activeColor={theme.colors.primary}
          inactiveColor={theme.colors.onSurfaceVariant}
          onTabPress={({ route }) => {
            navigation.dispatch(CommonActions.navigate(route.name));
          }}
          renderIcon={({ route, focused, color }) => {
            const { options } = descriptors[route.key];
            if (options.tabBarIcon) {
              return options.tabBarIcon({ focused, color, size: 24 });
            }
            return null;
          }}
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            return label as string;
          }}
        />
      )}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Icon source="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventario"
        options={{
          tabBarLabel: 'Inventario',
          tabBarIcon: ({ color, size }) => (
            <Icon source="format-list-bulleted" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          tabBarLabel: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <Icon source="account-group" size={size} color={color} />
          ),
        }}
      />
        <Tabs.Screen
            name="reportes"
            options={{
                tabBarLabel: 'Reportes',
                tabBarIcon: ({ color, size }) => (
                    <Icon source="chart-bar" size={size} color={color} />
                ),
            }}
        />
      <Tabs.Screen
        name="about"
        options={{
          tabBarLabel: 'Nosotros',
          tabBarIcon: ({ color, size }) => (
            <Icon source="information" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
