import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, Button, Title, useTheme, Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/hooks/useSession';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordSecure, setIsPasswordSecure] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const { setSession } = useSession();

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

      if (response.ok) {
        if (data.token) {
          setSession(data.token);
          // On successful login, navigate to the main app screen
          router.replace('/(tabs)');
        } else {
          setError(data.error || 'Authentication failed');
        }
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }

    setLoading(false);
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
          right={<TextInput.Icon icon={isPasswordSecure ? "eye-off" : "eye"} onPress={() => setIsPasswordSecure(!isPasswordSecure)} />}
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
