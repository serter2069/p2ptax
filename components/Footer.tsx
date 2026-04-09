import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../constants/Colors';

interface FooterProps {
  isWide?: boolean;
}

export function Footer({ isWide = false }: FooterProps) {
  const router = useRouter();

  return (
    <View style={styles.footer}>
      <View style={[styles.footerInner, isWide && styles.footerInnerWide]}>
        <View style={styles.footerLogoRow}>
          <View style={styles.footerLogoCircle}>
            <Text style={styles.footerLogoInitial}>Н</Text>
          </View>
          <Text style={styles.footerLogo}>Налоговик</Text>
        </View>
        <View style={[styles.footerLinks, isWide && styles.footerLinksWide]}>
          <TouchableOpacity onPress={() => router.push('/specialists')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Специалисты</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity onPress={() => router.push('/requests')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Запросы</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'web') {
                router.push('/');
                setTimeout(() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.footerLink}>О платформе</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity onPress={() => router.push('/support' as any)} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Контакты</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.footerLink}>Политика конфиденциальности</Text>
          </TouchableOpacity>
          <Text style={styles.footerDot}>·</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.footerLink}>Пользовательское соглашение</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerCopy}>
          {`\u00A9 ${new Date().getFullYear()} Налоговик`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerInner: {
    width: '100%',
    maxWidth: 1100,
    flexDirection: 'column',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  footerInnerWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLogoInitial: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  footerLogo: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLinksWide: {
    gap: Spacing.lg,
  },
  footerLink: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: Typography.fontWeight.medium,
  },
  footerDot: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.35)',
  },
  footerCopy: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.35)',
  },
});
