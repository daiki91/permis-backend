import { Link, router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const onLogin = async () => {
    try {
      await signIn(email.trim(), password);
      router.replace('/exams');
    } catch (error: any) {
      Alert.alert('Connexion impossible', error?.response?.data?.message || 'Verifier vos identifiants.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <View style={styles.container}>
              <Text style={styles.title}>Permis</Text>
              <Text style={styles.subtitle}>Connexion utilisateur</Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#a8b8c8"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                returnKeyLabel="Suivant"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#a8b8c8"
                secureTextEntry
                returnKeyType="go"
                returnKeyLabel="Se connecter"
                onSubmitEditing={onLogin}
                blurOnSubmit
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={onLogin}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Se connecter</Text>
                )}
              </Pressable>

              <Link href="/register" asChild>
                <Pressable hitSlop={12}>
                  <Text style={styles.link}>Pas de compte ? S'inscrire</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f7fb' },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
    minHeight: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#143d59',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#486581',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d9e2ec',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 15,
    color: '#102a43',
  },
  button: {
    backgroundColor: '#0f4c81',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  buttonPressed: { backgroundColor: '#0a3563', opacity: 0.9 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  link: {
    textAlign: 'center',
    marginTop: 20,
    color: '#0f4c81',
    fontWeight: '600',
    fontSize: 14,
    paddingVertical: 8,
  },
});
