import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth, User } from './AuthContext';
import { Colors } from '../../constants/Colors';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If set, only users with this role can access the route */
  allowedRoles?: User['role'][];
  /** Where to redirect if role doesn't match (defaults to /(dashboard)) */
  roleFallback?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  roleFallback = '/(dashboard)',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/email" />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Redirect href={roleFallback as never} />;
  }

  return <>{children}</>;
}
