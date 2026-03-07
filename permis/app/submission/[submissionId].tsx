import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

type SubmissionDetail = {
  id: number;
  exam_code: string;
  correct_count: number;
  total_count: number;
  percentage: number;
  submitted_at: string;
  details: DetailItem[];
};

export default function SubmissionDetailScreen() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      if (!submissionId) {
        setError('Soumission introuvable');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await submissionsApi.getSubmissionById(Number(submissionId), token);
        setSubmission(data);
      } catch (e: any) {
        console.error('Erreur chargement détail soumission:', e);
        setError(e?.response?.data?.message || 'Impossible de charger les détails');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [submissionId, token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f4c81" />
      </View>
    );
  }

  if (error || !submission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Détail indisponible'}</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const isPassed = submission.percentage >= 80;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Détail {submission.exam_code}</Text>
      <Text style={[styles.status, isPassed ? styles.statusPass : styles.statusFail]}>
        {isPassed ? 'Réussi' : 'Échoué'} - {submission.percentage}%
      </Text>
      <Text style={styles.meta}>
        {submission.correct_count}/{submission.total_count} bonnes réponses
      </Text>
      <Text style={styles.metaDate}>{new Date(submission.submitted_at).toLocaleString('fr-FR')}</Text>

      <Text style={styles.sectionTitle}>Question par question</Text>
      {(submission.details || []).map((item) => (
        <View key={item.questionNum} style={[styles.row, item.isCorrect ? styles.rowCorrect : styles.rowWrong]}>
          <Text style={styles.qNum}>Q{item.questionNum}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Votre réponse</Text>
            <Text style={styles.value}>
              {item.userAnswers?.length ? item.userAnswers.join(', ') : '- (Non répondue)'}
            </Text>
            {!item.isCorrect && (
              <>
                <Text style={[styles.label, { marginTop: 8 }]}>Bonne réponse</Text>
                <Text style={[styles.value, styles.correct]}>{item.correctAnswers?.join(', ')}</Text>
              </>
            )}
          </View>
        </View>
      ))}

      <Pressable style={[styles.button, { marginTop: 16 }]} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Retour aux soumissions</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f4f7fb',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#102a43',
    textAlign: 'center',
  },
  status: {
    marginTop: 10,
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#fff',
    fontWeight: '700',
  },
  statusPass: {
    backgroundColor: '#16a34a',
  },
  statusFail: {
    backgroundColor: '#dc2626',
  },
  meta: {
    textAlign: 'center',
    color: '#486581',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  metaDate: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 6,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102a43',
    marginBottom: 10,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    flexDirection: 'row',
    gap: 10,
  },
  rowCorrect: {
    borderLeftColor: '#16a34a',
  },
  rowWrong: {
    borderLeftColor: '#dc2626',
  },
  qNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#e2e8f0',
    color: '#102a43',
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  value: {
    marginTop: 4,
    color: '#1e293b',
    fontWeight: '600',
  },
  correct: {
    color: '#166534',
  },
  button: {
    backgroundColor: '#0f4c81',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 14,
    textAlign: 'center',
  },
});
