import { Redirect } from 'expo-router';
import { useAuth } from '@/context/auth-context';

export default function IndexPage() {
  const { user } = useAuth();
  return <Redirect href={user ? '/exams' : '/login'} />;
}
