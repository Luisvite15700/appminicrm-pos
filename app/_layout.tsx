
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SessionProvider, useSession } from '@/hooks/useSession';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';


export const unstable_settings = {
  initialRouteName: 'login',
};

const AppLightTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.background,
  },
};

const AppDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.background,
  },
};

const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.light.tint,
  },
};

const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.dark.tint,
  },
};

function RootLayoutNav() {
    const { session, isLoading } = useSession();
    const segments = useSegments();
    const router = useRouter();
  
    useEffect(() => {
      if (isLoading) return;
  
      const onLoginPage = segments[0] === 'login';
  
      if (!session && !onLoginPage) {
        router.replace('/login');
      } else if (session && onLoginPage) {
        router.replace('/(tabs)');
      }
    }, [session, isLoading, segments, router]);

    const colorScheme = useColorScheme();
    const navigationTheme = colorScheme === 'dark' ? AppDarkTheme : AppLightTheme;
    const paperTheme = colorScheme === 'dark' ? paperDarkTheme : paperLightTheme;

    return (
        <PaperProvider theme={paperTheme}>
            <ThemeProvider value={navigationTheme}>
                <Stack>
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                    <Stack.Screen name="registrar-producto-modal" options={{ presentation: 'modal' }} /> 
                    <Stack.Screen name="producto/[id]" />
                </Stack>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            </ThemeProvider>
        </PaperProvider>
    );
}

export default function RootLayout() {
    return (
        <SessionProvider>
            <RootLayoutNav />
        </SessionProvider>
    )
}
