import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { EmptyState } from '../../components/EmptyState';

export default function PromotionScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Продвижение" showBack />
      <EmptyState
        icon="rocket-outline"
        title="Скоро"
        subtitle="Инструменты продвижения будут доступны в следующих версиях"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
});
