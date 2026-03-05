import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/context/auth-context';
import { submissionsApi, API_BASE_URL } from '@/services/api';

type ExamQuestion = {
  number: number;
  imagePath: string;
};

type Exam = {
  code: string;
  title: string;
  questions: ExamQuestion[];
};

const LETTERS = ['A', 'B', 'C', 'D'];

export default function ExamScreen() {
  const { examCode } = useLocalSearchParams<{ examCode: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});

  useEffect(() => {
    const fetchExam = async () => {
      try {
        // Generate 25 questions for the exam code
        const questions: ExamQuestion[] = Array.from({ length: 25 }, (_, i) => {
          const number = i + 1;
          const imageName = `${examCode}-${String(number).padStart(2, '0')}.JPG`;
          return {
            number,
            imagePath: `${API_BASE_URL}/assets/${examCode}/${imageName}`,
          };
        });

        setExam({
          code: examCode || 'B01',
          title: `Examen Catégorie ${examCode}`,
          questions,
        });
      } catch (error: any) {
        Alert.alert('Erreur', 'Examen introuvable');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (examCode) {
      fetchExam();
    }
  }, [examCode]);

  const currentQuestion = useMemo(() => exam?.questions?.[index], [exam, index]);
  const selected = answers[currentQuestion?.number || 0] || [];

  const toggleLetter = (letter: string) => {
    if (!currentQuestion) {
      return;
    }

    const qNum = currentQuestion.number;
    const current = answers[qNum] || [];
    const exists = current.includes(letter);
    const next = exists ? current.filter((v) => v !== letter) : [...current, letter];

    setAnswers((prev) => ({
      ...prev,
      [qNum]: next.sort(),
    }));
  };

  const onSubmit = async () => {
    if (!user?.id || !examCode) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      return;
    }

    setSubmitting(true);
    try {
      // Convert answers to format expected by backend
      // Backend expects { "1": ["A"], "2": ["B", "C"], ... }
      const payload = Object.keys(answers).reduce((acc, key) => {
        acc[key] = answers[Number(key)] || [];
        return acc;
      }, {} as Record<string, string[]>);

      const response = await submissionsApi.submitExam(user.id, examCode, payload);
      
      // Store result data and navigate to result screen
      router.push({
        pathname: '/result',
        params: { 
          examCode,
          userId: user.id.toString(),
        },
      });
    } catch (error: any) {
      Alert.alert('Soumission échouée', error?.response?.data?.message || 'Réessayez dans quelques secondes.');
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !exam || !currentQuestion) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f4c81" />
      </View>
    );
  }

  const isLast = index === exam.questions.length - 1;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.examTitle}>{exam.code} - {exam.title}</Text>
      <Text style={styles.progress}>Question {index + 1} / {exam.questions.length}</Text>

      <Image 
        source={{ uri: currentQuestion.imagePath }} 
        style={styles.image}
        onError={(error) => {
          console.log('Image load error for', currentQuestion.imagePath);
        }}
      />

      <View style={styles.optionsWrap}>
        {LETTERS.map((letter) => {
          const active = selected.includes(letter);
          return (
            <Pressable
              key={letter}
              onPress={() => toggleLetter(letter)}
              style={[styles.option, active && styles.optionActive]}>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{letter}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.nav}>
        <Pressable
          style={[styles.navButton, index === 0 && styles.navButtonDisabled]}
          disabled={index === 0}
          onPress={() => setIndex((v) => v - 1)}>
          <Text style={styles.navText}>Précédent</Text>
        </Pressable>

        {!isLast ? (
          <Pressable style={styles.navButton} onPress={() => setIndex((v) => v + 1)}>
            <Text style={styles.navText}>Suivant</Text>
          </Pressable>
        ) : (
          <Pressable 
            style={[styles.navButton, styles.submitButton]} 
            onPress={onSubmit} 
            disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.navText}>Valider l'examen</Text>}
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fb' },
  container: { padding: 16, backgroundColor: '#f4f7fb', gap: 10, paddingBottom: 32 },
  examTitle: { fontSize: 18, fontWeight: '700', color: '#102a43' },
  progress: { color: '#486581', marginBottom: 4, fontSize: 14 },
  image: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    backgroundColor: '#bcccdc',
  },
  optionsWrap: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginTop: 8 },
  option: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#9fb3c8',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  optionActive: { backgroundColor: '#0f4c81', borderColor: '#0f4c81' },
  optionText: { fontWeight: '700', color: '#243b53' },
  optionTextActive: { color: '#fff' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 16 },
  navButton: {
    flex: 1,
    backgroundColor: '#334e68',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonDisabled: { opacity: 0.35 },
  submitButton: { backgroundColor: '#0f4c81' },
  navText: { color: '#fff', fontWeight: '700' },
});
