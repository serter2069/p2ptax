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
        <title>P2PTax Proto</title>
        <meta name="description" content="P2PTax Proto Viewer" />
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
