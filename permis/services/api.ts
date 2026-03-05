import axios from 'axios';
import Constants from 'expo-constants';

function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000`;
  }

  return 'http://localhost:5000';
}

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

function normalizeAssetUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
}

export const authApi = {
  async register(payload: {
    nom: string;
    email: string;
    telephone: string;
    password: string;
    confirm_password: string;
  }) {
    const { data } = await api.post('/users/register', payload);
    return data;
  },

  async login(email: string, password: string) {
    const { data } = await api.post('/users/login', { email, password });
    return data as { token: string; user: { id: number; nom: string; email: string; telephone?: string } };
  },
};

export const examsApi = {
  async getAllExams() {
    const { data } = await api.get('/exams');
    const exams = (data.exams || []).map((exam: any) => ({
      ...exam,
      image_couverture: exam.image_couverture ? normalizeAssetUrl(exam.image_couverture) : null,
    }));
    return { ...data, exams };
  },

  async getExamDetails(examCode: string) {
    const { data } = await api.get(`/exams/${examCode}`);
    const exam = data.exam;
    return {
      ...data,
      exam: {
        ...exam,
        image_couverture: exam.image_couverture ? normalizeAssetUrl(exam.image_couverture) : null,
        questions: (exam.questions || []).map((q: any) => ({
          ...q,
          image_path: normalizeAssetUrl(q.image_path),
        })),
      },
    };
  },
};

export const submissionsApi = {
  async submitExam(userId: number, examCode: string, answers: Record<string, string[]>) {
    const { data } = await api.post('/submissions/submit', { userId, examCode, answers });
    return data;
  },

  async getExamResult(userId: number, examCode: string) {
    const { data } = await api.get(`/submissions/result/${userId}/${examCode}`);
    return data;
  },
};
