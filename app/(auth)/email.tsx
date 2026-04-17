import { Redirect } from "expo-router";

// Redirect (auth) group to /auth/email (actual implementation)
export default function EmailRedirect() {
  return <Redirect href="/auth/email" />;
}
