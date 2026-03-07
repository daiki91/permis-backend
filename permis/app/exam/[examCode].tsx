import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/context/auth-context';
import { submissionsApi, API_BASE_URL } from '@/services/api';
import ZoomableImage from '@/components/zoomable-image';

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
  const [showSummary, setShowSummary] = useState(false);

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

  const handleValidateClick = () => {
    // Show summary modal
    setShowSummary(true);
  };

  const onConfirmSubmit = async () => {
    if (!user?.id || !examCode) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      return;
    }

    setSubmitting(true);
    setShowSummary(false);
    
    try {
      // Convert answers to format expected by backend
      // Backend expects ALL 25 questions: { "1": ["A"], "2": ["B", "C"], ... }
      const payload: Record<string, string[]> = {};
      
      // Include all 25 questions, even if not answered (empty array)
      for (let i = 1; i <= 25; i++) {
        payload[i.toString()] = answers[i] || [];
      }

      console.log('Submitting exam:', { userId: user.id, examCode, answersCount: Object.keys(payload).length });
      
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
      const errorMsg = error?.response?.data?.message || error?.message || 'Réessayez dans quelques secondes.';
      console.error('Submission error:', {
        message: errorMsg,
        status: error?.response?.status,
        data: error?.response?.data,
        fullError: error
      });
      Alert.alert(
        'Soumission échouée', 
        errorMsg,
        [{ text: 'OK', onPress: () => setShowSummary(true) }]
      );
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
  const answeredCount = Object.keys(answers).filter(key => answers[Number(key)]?.length > 0).length;
  const totalQuestions = exam.questions.length;

  const renderSummaryModal = () => {
    if (!showSummary) return null;

    const unansweredQuestions = exam.questions
      .filter(q => !answers[q.number] || answers[q.number].length === 0)
      .map(q => q.number);

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>📋 Récapitulatif de l'examen</Text>
          
          <View style={styles.summaryStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{answeredCount}</Text>
              <Text style={styles.statLabel}>Répondues</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>
                {totalQuestions - answeredCount}
              </Text>
              <Text style={styles.statLabel}>Non répondues</Text>
            </View>
          </View>

          {unansweredQuestions.length > 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>⚠️ Questions non répondues:</Text>
              <Text style={styles.warningText}>
                {unansweredQuestions.join(', ')}
              </Text>
              <Text style={styles.warningSubtext}>
                Les questions non répondues seront comptées comme incorrectes.
              </Text>
            </View>
          )}

          <View style={styles.questionGrid}>
            {exam.questions.map((q) => {
              const answered = answers[q.number] && answers[q.number].length > 0;
              return (
                <Pressable
                  key={q.number}
                  style={[
                    styles.gridItem,
                    answered ? styles.gridItemAnswered : styles.gridItemUnanswered,
                  ]}
                  onPress={() => {
                    setIndex(q.number - 1);
                    setShowSummary(false);
                  }}>
                  <Text style={[styles.gridText, answered && styles.gridTextAnswered]}>
                    {q.number}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.modalActions}>
            <Pressable
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setShowSummary(false)}>
              <Text style={styles.modalButtonTextSecondary}>Continuer l'examen</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={onConfirmSubmit}
              disabled={submitting}>
              <Text style={styles.modalButtonText}>
                {submitting ? 'Envoi...' : 'Valider définitivement'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.examTitle}>{exam.code} - {exam.title}</Text>
      <View style={styles.progressContainer}>
        <Text style={styles.progress}>Question {index + 1} / {exam.questions.length}</Text>
        <Text style={[styles.answeredBadge, answeredCount === totalQuestions && styles.answeredComplete]}>
          {answeredCount}/{totalQuestions} répondues
        </Text>
      </View>

      <ZoomableImage
        uri={currentQuestion.imagePath}
        style={styles.image}
        onError={() => {
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
            onPress={handleValidateClick}>
            <Text style={styles.navText}>Valider l'examen</Text>
          </Pressable>
        )}
      </View>

      {renderSummaryModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f4f7fb' 
  },
  container: { 
    paddingHorizontal: 16, 
    paddingVertical: 20, 
    backgroundColor: '#f4f7fb' 
  },
  examTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#102a43', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  progressContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16,
  },
  progress: { 
    color: '#486581', 
    fontSize: 14 
  },
  answeredBadge: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  answeredComplete: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    backgroundColor: '#bcccdc',
  },
  optionsWrap: { 
    flexDirection: 'row', 
    gap: 10, 
    justifyContent: 'space-between', 
    marginTop: 8 
  },
  option: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#9fb3c8',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  optionActive: { 
    backgroundColor: '#0f4c81', 
    borderColor: '#0f4c81' 
  },
  optionText: { 
    fontWeight: '700', 
    color: '#243b53' 
  },
  optionTextActive: { 
    color: '#fff' 
  },
  nav: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 10, 
    marginTop: 16 
  },
  navButton: {
    flex: 1,
    backgroundColor: '#334e68',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonDisabled: { 
    opacity: 0.35 
  },
  submitButton: { 
    backgroundColor: '#0f4c81' 
  },
  navText: { 
    color: '#fff', 
    fontWeight: '700' 
  },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '95%',
    maxWidth: 600,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102a43',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0f4c81',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#486581',
    marginTop: 6,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
    marginBottom: 6,
  },
  warningSubtext: {
    fontSize: 12,
    color: '#78350f',
    fontStyle: 'italic',
  },
  questionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
    maxHeight: 250,
  },
  gridItem: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  gridItemAnswered: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  gridItemUnanswered: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  gridText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
  gridTextAnswered: {
    color: '#16a34a',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#0f4c81',
  },
  modalButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0f4c81',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  modalButtonTextSecondary: {
    color: '#0f4c81',
    fontWeight: '700',
    fontSize: 15,
  },
});
