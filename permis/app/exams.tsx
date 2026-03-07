import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { API_BASE_URL } from '@/services/api';

export default function ExamsScreen() {
  const { user, signOut } = useAuth();
  const [exams, setExams] = useState<Array<{ code: string; title: string; questionCount: number; cover: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      // Fallback: create 12 exams (B01-B12) since API endpoint might not exist
      const examsList = Array.from({ length: 12 }, (_, i) => {
        const code = `B${String(i + 1).padStart(2, '0')}`;
        return {
          code,
          title: `Examen Catégorie ${code}`,
          questionCount: 25,
          cover: `${API_BASE_URL}/assets/${code}/${code} COUV.JPG`,
        };
      });
      setExams(examsList);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les examens');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamPress = (examCode: string) => {
    router.push({ pathname: '/exam/[examCode]', params: { examCode } });
  };

  const handleLogout = () => {
    signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0f4c81" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bienvenue, {user?.nom?.split(' ')[0] || 'Utilisateur'}</Text>
          <Text style={styles.subtitle}>Sélectionnez un examen</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/submissions')} style={styles.historyBtn}>
            <Text style={styles.historyText}>Mes soumissions</Text>
          </Pressable>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Déconnecter</Text>
          </Pressable>
        </View>
      </View>

      {/* Exams Grid */}
      <FlatList
        data={exams}
        keyExtractor={(item) => item.code}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable
            style={styles.examCard}
            onPress={() => handleExamPress(item.code)}
          >
            <Image
              source={{ uri: item.cover }}
              style={styles.examImage}
              onError={(error) => {
                console.log('Image load error for', item.code);
              }}
            />
            <Text style={styles.examTitle}>{item.code}</Text>
            <Text style={styles.examMeta}>{item.questionCount} questions</Text>
          </Pressable>
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  header: {
    backgroundColor: '#0f4c81',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 32,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#b8c9db',
    marginTop: 4,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  historyBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  historyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  examCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  examImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#e0e6ed',
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#143d59',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  examMeta: {
    fontSize: 12,
    color: '#7a8a9a',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
