import { Redirect } from 'expo-router';

// Redirect /dashboard → /(dashboard) so direct navigation to /dashboard works for authenticated users
export default function DashboardRedirect() {
  return <Redirect href="/(dashboard)" />;
}
