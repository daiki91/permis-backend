import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/context/auth-context';
import { submissionsApi } from '@/services/api';

type SubmissionItem = {
  id: number;
  exam_code: string;
  correct_count: number;
  total_count: number;
  percentage: number;
  is_passed: boolean;
  submitted_at: string;
};

export default function SubmissionsScreen() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await submissionsApi.getUserSubmissions(user.id, token);
        const rows = res?.data?.results;
        setSubmissions(Array.isArray(rows) ? rows : []);
      } catch (error: any) {
        console.error('Erreur chargement soumissions:', error);
        Alert.alert('Erreur', error?.response?.data?.message || 'Impossible de charger vos soumissions');
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, [user?.id, token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f4c81" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes examens soumis</Text>
        <Text style={styles.subtitle}>{submissions.length} soumission{submissions.length > 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={submissions}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucun examen soumis</Text>
            <Text style={styles.emptyText}>Passez un examen pour voir le détail ici.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const passed = item.percentage >= 80;
          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/submission/[submissionId]',
                  params: { submissionId: String(item.id) },
                })
              }>
              <View style={styles.cardTop}>
                <Text style={styles.examCode}>{item.exam_code}</Text>
                <Text style={[styles.badge, passed ? styles.badgePass : styles.badgeFail]}>
                  {passed ? 'Réussi' : 'Échoué'}
                </Text>
              </View>

              <Text style={styles.score}>{item.percentage}%</Text>
              <Text style={styles.meta}>
                {item.correct_count}/{item.total_count} bonnes réponses
              </Text>
              <Text style={styles.date}>{new Date(item.submitted_at).toLocaleString('fr-FR')}</Text>

              <View style={styles.detailButton}>
                <Text style={styles.detailButtonText}>Voir les détails</Text>
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Retour</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fb',
  },
  header: {
    backgroundColor: '#0f4c81',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    marginTop: 4,
    color: '#dbeafe',
    fontSize: 14,
  },
  listContent: {
    padding: 14,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#0f4c81',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102a43',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  badgePass: {
    backgroundColor: '#16a34a',
  },
  badgeFail: {
    backgroundColor: '#dc2626',
  },
  score: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f4c81',
    marginTop: 8,
  },
  meta: {
    color: '#486581',
    fontSize: 14,
    marginTop: 2,
  },
  date: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  },
  detailButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#e0ecff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailButtonText: {
    color: '#0f4c81',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  emptyText: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 14,
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
    backgroundColor: '#334e68',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
