import { Redirect } from 'expo-router';

// Deep-link / backlink / ad-landing entry point. Real auth flow lives at
// /(auth)/role → /(auth)/email → /(auth)/otp. Forward to the role picker.
export default function LoginRedirect() {
  return <Redirect href="/(auth)/role" />;
}
