import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../constants/Colors';
import type { NavVariant } from '../../constants/pageRegistry';
import { ProtoNavHeader, ProtoNavFooter } from './ProtoNav';

interface ProtoLayoutProps {
  title: string;
  route: string;
  nav?: NavVariant;
  children: React.ReactNode;
}

export function ProtoLayout({ title, route, nav, children }: ProtoLayoutProps) {
  const showNav = nav && nav !== 'none';

  return (
    <View style={styles.container}>
      {showNav && <ProtoNavHeader variant={nav!} />}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </ScrollView>
      {showNav && <ProtoNavFooter variant={nav!} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing['3xl'],
    paddingBottom: 64,
  },
});
