import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function StatesLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== 'GET_STATES') return;
      const elements = document.querySelectorAll('[data-state-name]');
      const states = Array.from(elements).map(el => ({
        name: el.getAttribute('data-state-name'),
        y: (el as HTMLElement).getBoundingClientRect().top + window.scrollY
      }));
      (e.source as Window)?.postMessage({ type: 'STATES_LIST', states }, '*');
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
