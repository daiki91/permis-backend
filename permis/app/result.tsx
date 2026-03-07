import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
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

/**
 * Génère une appréciation motivante basée sur le score
 */
function getAppreciation(percentage: number): { emoji: string; title: string; message: string; color: string } {
  if (percentage >= 95) {
    return {
      emoji: '🏆',
      title: 'EXCELLENT !',
      message: 'Performance exceptionnelle ! Vous maîtrisez parfaitement le sujet.',
      color: '#eab308',
    };
  } else if (percentage >= 85) {
    return {
      emoji: '🎉',
      title: 'TRÈS BIEN !',
      message: 'Bravo ! Vous avez largement dépassé le seuil de réussite.',
      color: '#22c55e',
    };
  } else if (percentage >= 80) {
    return {
      emoji: '✅',
      title: 'RÉUSSI !',
      message: 'Félicitations ! Vous avez obtenu votre examen.',
      color: '#22c55e',
    };
  } else if (percentage >= 70) {
    return {
      emoji: '💪',
      title: 'PRESQUE !',
      message: 'Vous êtes tout proche ! Encore un petit effort et c\'est gagné.',
      color: '#f59e0b',
    };
  } else if (percentage >= 60) {
    return {
      emoji: '📚',
      title: 'BIEN ESSAYÉ',
      message: 'Vous progressez ! Révisez les points faibles et réessayez.',
      color: '#f59e0b',
    };
  } else if (percentage >= 40) {
    return {
      emoji: '🎯',
      title: 'CONTINUEZ !',
      message: 'Vous avez des bases. Concentrez-vous sur les erreurs et persévérez.',
      color: '#ef4444',
    };
  } else {
    return {
      emoji: '💡',
      title: 'NE LÂCHEZ PAS !',
      message: 'Chaque tentative vous rapproche du succès. Révisez et recommencez !',
      color: '#ef4444',
    };
  }
}

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
  const appreciation = getAppreciation(result.percentage);
  
  // Calculer les statistiques
  const wrongAnswers = result.details.filter(d => !d.isCorrect);
  const unansweredCount = result.details.filter(d => d.userAnswers.length === 0).length;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}>
      
      <Text style={styles.title}>Résultat {result.examCode}</Text>
      
      <View style={[styles.badge, passStyle]}>
        <Text style={styles.badgeText}>{isPassed ? '✓ RÉUSSI' : '✗ ÉCHOUÉ'}</Text>
      </View>
      
      <Text style={styles.score}>{result.percentage}%</Text>
      <Text style={styles.meta}>{result.correctCount} / {result.totalQuestions} bonnes réponses</Text>

      {/* Appréciation motivante */}
      <View style={[styles.appreciationCard, { borderLeftColor: appreciation.color }]}>
        <Text style={styles.appreciationEmoji}>{appreciation.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.appreciationTitle, { color: appreciation.color }]}>
            {appreciation.title}
          </Text>
          <Text style={styles.appreciationMessage}>{appreciation.message}</Text>
        </View>
      </View>

      {/* Statistiques supplémentaires */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{result.correctCount}</Text>
          <Text style={styles.statLabel}>✅ Correctes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {wrongAnswers.length - unansweredCount}
          </Text>
          <Text style={styles.statLabel}>❌ Erreurs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{unansweredCount}</Text>
          <Text style={styles.statLabel}>⚠️ Non répondues</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        📋 Détails par question ({wrongAnswers.length} {wrongAnswers.length > 1 ? 'erreurs' : 'erreur'})
      </Text>
      
      {result.details.map((item) => (
        <View 
          key={item.questionNum}
          style={[styles.row, item.isCorrect ? styles.rowCorrect : styles.rowWrong]}>
          <View style={[
            styles.questionNumber,
            item.isCorrect 
              ? { backgroundColor: '#dcfce7', borderColor: '#22c55e' }
              : { backgroundColor: '#fee2e2', borderColor: '#ef4444' }
          ]}>
            <Text style={[styles.qNum, item.isCorrect ? styles.textCorrect : styles.textWrong]}>
              {item.questionNum}
            </Text>
          </View>
          <View style={styles.answerSection}>
            <Text style={styles.labelUser}>
              {item.isCorrect ? '✅ Votre réponse (correcte)' : '❌ Votre réponse'}
            </Text>
            <View style={[
              styles.answerBadge, 
              item.isCorrect 
                ? { backgroundColor: '#dcfce7', borderColor: '#22c55e' } 
                : { backgroundColor: '#fee2e2', borderColor: '#ef4444' }
            ]}>
              <Text style={[
                styles.answerText,
                item.isCorrect ? styles.textCorrect : styles.textWrong
              ]}>
                {item.userAnswers.length > 0 ? item.userAnswers.join(', ') : '- (Non répondue)'}
              </Text>
            </View>
            
            {!item.isCorrect && (
              <>
                <Text style={styles.labelCorrect}>✓ Réponse correcte</Text>
                <View style={styles.correctAnswerBadge}>
                  <Text style={styles.correctAnswerText}>
                    {item.correctAnswers.join(', ')}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      ))}

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={() => router.replace('/exams')}>
          <Text style={styles.buttonText}>📚 Retour aux examens</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.secondary]}
          onPress={() => {
            router.push({ pathname: '/exam/[examCode]', params: { examCode: result.examCode } });
          }}>
          <Text style={styles.buttonText}>🔄 Refaire</Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f7fb',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#102a43', 
    textAlign: 'center',
    marginBottom: 12,
  },
  badge: { 
    alignSelf: 'center', 
    borderRadius: 999, 
    paddingHorizontal: 24, 
    paddingVertical: 10, 
    marginVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  badgePass: { backgroundColor: '#22c55e' },
  badgeFail: { backgroundColor: '#ef4444' },
  badgeText: { 
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 16,
    letterSpacing: 1,
  },
  score: { 
    fontSize: 56, 
    fontWeight: '900', 
    textAlign: 'center', 
    color: '#0f4c81', 
    marginVertical: 8,
  },
  meta: { 
    textAlign: 'center', 
    color: '#486581', 
    marginBottom: 20,
    fontSize: 15,
    fontWeight: '500',
  },
  appreciationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  appreciationEmoji: {
    fontSize: 36,
  },
  appreciationTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  appreciationMessage: {
    fontSize: 14,
    color: '#486581',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#22c55e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#486581',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#102a43',
    marginBottom: 16,
    marginTop: 8,
  },
  row: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  rowCorrect: { borderLeftColor: '#22c55e' },
  rowWrong: { borderLeftColor: '#ef4444' },
  questionNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  qNum: { 
    fontWeight: '800', 
    fontSize: 17,
  },
  textCorrect: { 
    color: '#22c55e', 
    fontWeight: '700',
  },
  textWrong: { 
    color: '#ef4444', 
    fontWeight: '700',
  },
  answerSection: { 
    flex: 1,
  },
  labelUser: { 
    fontWeight: '700', 
    color: '#486581', 
    fontSize: 13, 
    marginBottom: 6,
  },
  labelCorrect: { 
    fontWeight: '700', 
    color: '#486581', 
    fontSize: 13, 
    marginBottom: 6, 
    marginTop: 10,
  },
  answerBadge: { 
    borderRadius: 8, 
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderWidth: 1,
  },
  answerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  correctAnswerBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#0f4c81',
  },
  correctAnswerText: {
    color: '#0f4c81',
    fontWeight: '700',
    fontSize: 15,
  },
  actions: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 24,
    marginBottom: 8,
  },
  button: { 
    flex: 1, 
    backgroundColor: '#0f4c81', 
    borderRadius: 12, 
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondary: { 
    backgroundColor: '#334e68',
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '800',
    fontSize: 15,
  },
  errorText: { 
    color: '#486581', 
    fontSize: 16, 
    textAlign: 'center',
    lineHeight: 24,
  },
});
