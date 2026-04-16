import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { Colors } from '../constants/Colors';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider } from '../lib/auth/AuthContext';

export default function RootLayout() {
  return (
    <>
      <Head>
        <title>Налоговик — найти налогового специалиста</title>
        <meta name="description" content="Сервис поиска налоговых специалистов. Заявки, чат, отзывы." />
      </Head>
      <ErrorBoundary>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.bgPrimary },
            }}
          />
        </AuthProvider>
      </ErrorBoundary>
    </>
  );
}
