import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, useColorScheme, Pressable } from 'react-native';
import { LayoutDashboard, Activity, Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomTabIcon = ({ focused, IconComponent, isDark }: { focused: boolean, IconComponent: any, isDark: boolean }) => {
  const focusedBg = isDark ? '#FFFFFF' : '#1C1C1E';
  const focusedIcon = isDark ? '#000000' : '#FFFFFF';
  const unfocusedIcon = isDark ? '#A1A1AA' : '#71717A';

  return (
    <View style={{
      width: 56,
      height: 40,
      borderRadius: 20,
      backgroundColor: focused ? focusedBg : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <IconComponent 
        color={focused ? focusedIcon : unfocusedIcon} 
        size={22} 
        strokeWidth={focused ? 2.5 : 2}
      />
    </View>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const bottomMargin = Math.max(insets.bottom, 20);
  const TAB_BAR_HEIGHT = 64;
  
  const bannerBg = isDark ? '#1C1C1E' : '#FFFFFF';
  
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarButton: (props) => (
            <Pressable 
              {...props as any} 
              android_ripple={{ color: 'transparent' }} 
              style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }]} 
            />
          ),
          tabBarStyle: {
            position: 'absolute',
            bottom: bottomMargin,
            alignSelf: 'center',
            left: 24,
            right: 24,
            height: TAB_BAR_HEIGHT,
            borderRadius: 32,
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 16,
            backgroundColor: bannerBg,
            paddingBottom: 0,
            paddingTop: 0,
          },
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            height: TAB_BAR_HEIGHT,
            paddingBottom: 0,
            paddingTop: 0,
            marginTop: Platform.OS === 'ios' ? 12 : 8, // Empuja los iconos hacia abajo
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ focused }) => <CustomTabIcon focused={focused} IconComponent={LayoutDashboard} isDark={isDark} />,
          }}
        />
        <Tabs.Screen
          name="monitor"
          options={{
            title: 'Monitor',
            tabBarIcon: ({ focused }) => <CustomTabIcon focused={focused} IconComponent={Activity} isDark={isDark} />,
          }}
        />
        <Tabs.Screen
          name="sales"
          options={{
            title: 'Caja',
            tabBarIcon: ({ focused }) => <CustomTabIcon focused={focused} IconComponent={Wallet} isDark={isDark} />,
          }}
        />
      </Tabs>
    </View>
  );
}
