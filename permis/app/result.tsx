import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/context/auth-context';
import { submissionsApi } from '@/services/api';

type DetailItem = {
  questionNum: number;
  correctAnswers: string[];
  userAnswers: string[];
  isCorrect: boolean;
};

type ResultData = {
  examCode: string;
  userId: number;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  isPassed: boolean;
  details: DetailItem[];
};

export default function ResultScreen() {
  const { examCode, userId } = useLocalSearchParams<{ examCode: string; userId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!user?.id || !examCode) {
        setLoading(false);
        setError('Données manquantes');
        return;
      }

      try {
        const res = await submissionsApi.getExamResult(user.id, examCode);
        if (res.success && res.data) {
          setResult(res.data);
        } else {
          setError('Résultat non disponible');
        }
      } catch (err: any) {
        console.error('Error fetching result:', err);
        setError(err?.response?.data?.message || 'Erreur lors de la récupération du résultat');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [user?.id, examCode]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f4c81" />
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Aucun résultat disponible'}</Text>
        <Pressable 
          style={[styles.button, { marginTop: 20 }]} 
          onPress={() => router.replace('/exams')}>
          <Text style={styles.buttonText}>Retour aux examens</Text>
        </Pressable>
      </View>
    );
  }

  const isPassed = result.percentage >= 80;
  const passStyle = isPassed ? styles.badgePass : styles.badgeFail;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Résultat {result.examCode}</Text>
      
      <View style={[styles.badge, passStyle]}>
        <Text style={styles.badgeText}>{isPassed ? '✓ RÉUSSI' : '✗ ÉCHOUÉ'}</Text>
      </View>
      
      <Text style={styles.score}>{result.percentage}%</Text>
      <Text style={styles.meta}>{result.correctCount} / {result.totalQuestions} bonnes réponses</Text>

      <Text style={styles.sectionTitle}>Détails par question</Text>
      
      <FlatList
        data={result.details || []}
        keyExtractor={(item) => String(item.questionNum)}
        scrollEnabled={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.row, item.isCorrect ? styles.rowCorrect : styles.rowWrong]}>
            <View style={styles.questionNumber}>
              <Text style={[styles.qNum, item.isCorrect ? styles.textCorrect : styles.textWrong]}>
                {item.questionNum}
              </Text>
            </View>
            <View style={styles.answerSection}>
              <Text style={styles.labelUser}>Votre réponse:</Text>
              <View style={[styles.answerBadge, item.isCorrect ? { backgroundColor: '#dcfce7' } : { backgroundColor: '#fee2e2' }]}>
                <Text style={item.isCorrect ? styles.textCorrect : styles.textWrong}>
                  {item.userAnswers.length > 0 ? item.userAnswers.join(', ') : '-'}
                </Text>
              </View>
              
              <Text style={styles.labelCorrect}>Réponse correcte:</Text>
              <View style={{ backgroundColor: '#dbeafe', borderRadius: 6, padding: 8 }}>
                <Text style={{ color: '#0f4c81', fontWeight: '600' }}>
                  {item.correctAnswers.length > 0 ? item.correctAnswers.join(', ') : '-'}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={() => router.replace('/exams')}>
          <Text style={styles.buttonText}>Retour aux examens</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.secondary]}
          onPress={() => {
            router.push({ pathname: '/exam/[examCode]', params: { examCode: result.examCode } });
          }}>
          <Text style={styles.buttonText}>Refaire l'examen</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f7fb', 
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#102a43', 
    textAlign: 'center',
    marginBottom: 12,
  },
  badge: { 
    alignSelf: 'center', 
    borderRadius: 999, 
    paddingHorizontal: 20, 
    paddingVertical: 8, 
    marginVertical: 12,
  },
  badgePass: { backgroundColor: '#22c55e' },
  badgeFail: { backgroundColor: '#ef4444' },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  score: { 
    fontSize: 48, 
    fontWeight: '800', 
    textAlign: 'center', 
    color: '#0f4c81', 
    marginVertical: 8,
  },
  meta: { 
    textAlign: 'center', 
    color: '#486581', 
    marginBottom: 16,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102a43',
    marginVertical: 12,
    marginTop: 20,
  },
  list: { gap: 8, paddingBottom: 20 },
  row: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    gap: 12,
  },
  rowCorrect: { borderLeftColor: '#22c55e' },
  rowWrong: { borderLeftColor: '#ef4444' },
  questionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e6ed',
  },
  qNum: { fontWeight: '700', fontSize: 16 },
  textCorrect: { color: '#22c55e', fontWeight: '700' },
  textWrong: { color: '#ef4444', fontWeight: '700' },
  answerSection: { flex: 1 },
  labelUser: { fontWeight: '600', color: '#486581', fontSize: 12, marginBottom: 4 },
  labelCorrect: { fontWeight: '600', color: '#486581', fontSize: 12, marginBottom: 4, marginTop: 8 },
  answerBadge: { 
    borderRadius: 6, 
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  actions: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 16,
    marginBottom: 20,
  },
  button: { 
    flex: 1, 
    backgroundColor: '#0f4c81', 
    borderRadius: 10, 
    padding: 14, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: '#334e68' },
  buttonText: { color: '#fff', fontWeight: '700' },
  errorText: { color: '#486581', fontSize: 16, textAlign: 'center' },
});
