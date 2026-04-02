import { Stack } from 'expo-router';
import { Colors } from '../../../constants/Colors';

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bgPrimary },
        animation: 'slide_from_right',
      }}
    />
  );
}
