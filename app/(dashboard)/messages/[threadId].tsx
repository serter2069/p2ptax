// Dashboard message thread — delegates to the main chat/[id] screen logic.
// This route exists for legacy (dashboard)/messages/[threadId] URLs.
// Redirects to /chat/[threadId] which has the full prototype-aligned implementation.

import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function DashboardThreadRedirect() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (threadId) {
      router.replace(`/chat/${threadId}`);
    }
  }, [threadId, router]);

  return null;
}
