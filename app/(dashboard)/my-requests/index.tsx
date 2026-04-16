import { Redirect } from 'expo-router';

// /my-requests → /requests
// Historical deep-links and notifications may point to /my-requests; the real
// list lives in the tab bar at /requests. Redirect to keep URLs alive.
export default function MyRequestsIndex() {
  return <Redirect href="/requests" />;
}
