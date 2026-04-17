import { Redirect } from "expo-router";

// Redirect (auth) group to /auth/otp (actual implementation)
export default function OtpRedirect() {
  return <Redirect href="/auth/otp" />;
}
