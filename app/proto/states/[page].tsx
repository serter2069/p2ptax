import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ProtoLayout } from '../../../components/proto/ProtoLayout';
import { PageIdProvider } from '../../../components/proto/StateSection';
import { getPageById } from '../../../constants/pageRegistry';
import { Colors, Typography, Spacing } from '../../../constants/Colors';

// State components
import { BrandStates } from '../../../components/proto/states/BrandStates';

const STATE_MAP: Record<string, React.ComponentType> = {
  'brand': BrandStates,
};

export default function ProtoStatesPage() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const pageData = getPageById(page || '');
  const StatesComponent = page ? STATE_MAP[page] : undefined;

  if (!pageData || !StatesComponent) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>Страница не найдена</Text>
        <Text style={styles.notFoundText}>Proto page "{page}" не существует в реестре</Text>
      </View>
    );
  }

  return (
    <PageIdProvider value={page || ''}>
      <ProtoLayout title={pageData.title} route={pageData.route} nav={pageData.nav} activeTab={pageData.activeTab}>
        <StatesComponent />
      </ProtoLayout>
    </PageIdProvider>
  );
}

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  notFoundTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  notFoundText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
});
