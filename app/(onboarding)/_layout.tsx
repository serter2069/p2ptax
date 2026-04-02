import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bgPrimary },
        animation: 'fade',
        // Prevent going back to auth screens during onboarding
        gestureEnabled: false,
      }}
    />
  );
}
