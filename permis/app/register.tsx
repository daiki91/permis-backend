import { router } from 'expo-router';
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

export default function RegisterScreen() {
  const { signUp, loading } = useAuth();
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const onRegister = async () => {
    if (!nom.trim() || !email.trim() || !telephone.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    try {
      await signUp(nom.trim(), email.trim(), telephone.trim(), password);
      router.replace('/exams');
    } catch (error: any) {
      Alert.alert('Inscription impossible', error?.response?.data?.message || 'Verifier les informations.');
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
              <Text style={styles.title}>Inscription</Text>
              <Text style={styles.subtitle}>Créer un nouveau compte</Text>

              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor="#a8b8c8"
                autoCapitalize="words"
                returnKeyType="next"
                returnKeyLabel="Suivant"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
                value={nom}
                onChangeText={setNom}
                editable={!loading}
              />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#a8b8c8"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                returnKeyLabel="Suivant"
                onSubmitEditing={() => phoneRef.current?.focus()}
                blurOnSubmit={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
              <TextInput
                ref={phoneRef}
                style={styles.input}
                placeholder="Téléphone"
                placeholderTextColor="#a8b8c8"
                keyboardType="phone-pad"
                returnKeyType="next"
                returnKeyLabel="Suivant"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                value={telephone}
                onChangeText={setTelephone}
                editable={!loading}
              />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#a8b8c8"
                secureTextEntry
                returnKeyType="go"
                returnKeyLabel="S'inscrire"
                onSubmitEditing={onRegister}
                blurOnSubmit
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={onRegister}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Créer mon compte</Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.back()} hitSlop={12}>
                <Text style={styles.link}>Déjà inscrit ? Retour connexion</Text>
              </Pressable>
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
    minHeight: 500,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#143d59',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#486581',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d9e2ec',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
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
