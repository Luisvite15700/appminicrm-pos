
import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, Button, Title, useTheme, Text, ActivityIndicator, Checkbox } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/hooks/useSession';
import * as SecureStore from 'expo-secure-store';

// Keys for secure storage
const USER_KEY = 'remembered_user';
const PASSWORD_KEY = 'remembered_password';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const { setSession } = useSession();

  // On component mount, try to load saved credentials
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedUser = await SecureStore.getItemAsync(USER_KEY);
        const savedPassword = await SecureStore.getItemAsync(PASSWORD_KEY);
        if (savedUser && savedPassword) {
          setUsuario(savedUser);
          setPassword(savedPassword);
        }
      } catch (e) {
        // It's not a critical error, so we can just log it.
        console.warn('Could not load credentials from store', e);
      }
    };
    loadCredentials();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(process.env.EXPO_PUBLIC_LOGIN_API!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // --- Credential Saving Logic ---
        if (rememberMe) {
          await SecureStore.setItemAsync(USER_KEY, usuario);
          await SecureStore.setItemAsync(PASSWORD_KEY, password);
        } else {
          // If the user unchecks "Remember me", we should clear the stored credentials
          await SecureStore.deleteItemAsync(USER_KEY);
          await SecureStore.deleteItemAsync(PASSWORD_KEY);
        }
        // --- End Logic ---

        setSession(data.token);
        router.replace('/(tabs)');

      } else {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        // For security, we don't want to keep a wrong password saved.
        await SecureStore.deleteItemAsync(PASSWORD_KEY);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 16,
    },
    title: {
      marginBottom: 32,
      textAlign: 'center',
    },
    input: {
      marginBottom: 16,
    },
    button: {
      marginTop: 16,
    },
    error: {
      marginTop: 16,
      color: theme.colors.error,
      textAlign: 'center',
    },
    // The Checkbox.Item provides its own layout, so we just need to style it
    checkbox: {
        marginBottom: 10,
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Title style={styles.title}>Login</Title>
        <TextInput
          label="Usuario"
          value={usuario}
          onChangeText={setUsuario}
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry={isPasswordSecure}
          right={<TextInput.Icon icon={isPasswordSecure ? 'eye-off' : 'eye'} onPress={() => setIsPasswordSecure(!isPasswordSecure)} />}
        />
        
        <Checkbox.Item
            label="Recordar mis datos"
            status={rememberMe ? 'checked' : 'unchecked'}
            onPress={() => setRememberMe(!rememberMe)}
            style={styles.checkbox}
            labelStyle={{color: theme.colors.onSurface}}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator animating={true} style={styles.button} />
        ) : (
          <Button mode="contained" onPress={handleLogin} style={styles.button}>
            Login
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}
