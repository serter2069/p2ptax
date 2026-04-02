import '../global.css';
import { Stack } from 'expo-router';
import { AuthProvider } from '../stores/authStore';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f0f1a' },
        }}
      />
    </AuthProvider>
  );
}
