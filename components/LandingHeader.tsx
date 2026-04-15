import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { useAuth } from '../stores/authStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/Colors';

interface NavLinkConfig {
  label: string;
  route?: string;
  segment?: string;
  onPress?: () => void;
}

const NAV_LINKS: NavLinkConfig[] = [
  { label: 'Главная', route: '/', segment: '(index)' },
  { label: 'Специалисты', route: '/specialists', segment: 'specialists' },
  { label: 'Заявки', route: '/requests', segment: 'requests' },
  { label: 'Тарифы', route: '/pricing', segment: 'pricing' },
];

function LogoBlock({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
      <View style={{
        width: 28,
        height: 28,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.brandPrimary,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Feather name="shield" size={16} color={Colors.white} />
      </View>
      <Text style={{
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
      }}>Налоговик</Text>
    </Pressable>
  );
}

export function LandingHeader() {
  const router = useRouter();
  const segments = useSegments();
  const { isDesktop } = useBreakpoints();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  // Auto-close burger menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [segments]);

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: menuOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [menuOpen, menuAnim]);

  function isLinkActive(link: NavLinkConfig): boolean {
    if (!link.segment) return false;
    return segments.includes(link.segment as any);
  }

  const goHome = () => router.push('/');

  return (
    <View style={{
      width: '100%',
      zIndex: 100,
      backgroundColor: Colors.bgCard,
      ...Platform.select({
        web: {
          position: 'sticky' as any,
          top: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        },
        default: {
          ...Shadows.sm,
        },
      }),
    }}>
      {/* Header bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: Spacing.lg,
        maxWidth: 1100,
        width: '100%',
        alignSelf: 'center',
      }}>
        <LogoBlock onPress={goHome} />

        {/* Desktop nav links */}
        {isDesktop && (
          <View style={{
            flexDirection: 'row',
            gap: Spacing.xl,
            marginLeft: Spacing['3xl'],
            flex: 1,
          }}>
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link);
              return (
                <Pressable
                  key={link.label}
                  onPress={() => {
                    if (link.onPress) link.onPress();
                    else if (link.route) router.push(link.route as any);
                  }}
                >
                  <Text style={{
                    fontSize: Typography.fontSize.sm,
                    fontWeight: active ? Typography.fontWeight.semibold : Typography.fontWeight.medium,
                    color: active ? Colors.brandPrimary : Colors.textSecondary,
                  }}>
                    {link.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Spacer for mobile */}
        {!isDesktop && <View style={{ flex: 1 }} />}

        {/* Right side */}
        {!isDesktop ? (
          <Pressable onPress={() => setMenuOpen((v) => !v)}>
            <Feather name={menuOpen ? 'x' : 'menu'} size={22} color={Colors.textPrimary} />
          </Pressable>
        ) : user ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <Pressable
              onPress={() => router.push('/(dashboard)')}
              style={{
                backgroundColor: Colors.brandPrimary,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.btn,
              }}
            >
              <Text style={{
                color: Colors.white,
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.semibold,
              }}>Кабинет</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <Pressable
              onPress={() => router.push('/(auth)/email')}
              style={{
                borderWidth: 1,
                borderColor: Colors.brandPrimary,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.btn,
              }}
            >
              <Text style={{
                color: Colors.brandPrimary,
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.semibold,
              }}>Войти</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
              style={{
                backgroundColor: Colors.brandPrimary,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.btn,
              }}
            >
              <Text style={{
                color: Colors.white,
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.semibold,
              }}>Разместить заявку</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Mobile: overlay to close menu */}
      {!isDesktop && menuOpen && (
        <Pressable
          onPress={() => setMenuOpen(false)}
          style={{
            ...Platform.select({
              web: { position: 'fixed' as any },
              default: { position: 'absolute' as any },
            }),
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.2)',
            zIndex: 9,
          }}
        />
      )}

      {/* Mobile drawer panel (slides from right) */}
      {!isDesktop && menuOpen && (
        <Animated.View style={{
          ...Platform.select({
            web: { position: 'fixed' as any },
            default: { position: 'absolute' as any },
          }),
          top: 0,
          right: 0,
          bottom: 0,
          width: 280,
          backgroundColor: Colors.bgCard,
          padding: Spacing.xl,
          zIndex: 200,
          opacity: menuAnim,
          ...Platform.select({
            web: {
              boxShadow: '-4px 0 16px rgba(0,0,0,0.1)',
            },
            default: {
              ...Shadows.lg,
            },
          }),
        }}>
          {/* Drawer top: logo + close */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: Spacing.lg,
          }}>
            <LogoBlock onPress={() => { setMenuOpen(false); goHome(); }} />
            <Pressable onPress={() => setMenuOpen(false)}>
              <Feather name="x" size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>

          {/* Drawer links */}
          <View style={{ gap: Spacing.lg }}>
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link);
              return (
                <Pressable
                  key={link.label}
                  onPress={() => {
                    setMenuOpen(false);
                    if (link.onPress) link.onPress();
                    else if (link.route) router.push(link.route as any);
                  }}
                >
                  <Text style={{
                    fontSize: Typography.fontSize.md,
                    fontWeight: active ? Typography.fontWeight.semibold : Typography.fontWeight.medium,
                    color: active ? Colors.brandPrimary : Colors.textSecondary,
                  }}>
                    {link.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Divider */}
          <View style={{
            height: 1,
            backgroundColor: Colors.borderLight,
            marginVertical: Spacing.lg,
          }} />

          {/* Drawer buttons */}
          {user ? (
            <Pressable
              onPress={() => { setMenuOpen(false); router.push('/(dashboard)'); }}
              style={{
                backgroundColor: Colors.brandPrimary,
                paddingVertical: Spacing.md,
                borderRadius: BorderRadius.btn,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: Colors.white,
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.semibold,
              }}>Кабинет</Text>
            </Pressable>
          ) : (
            <View style={{ gap: Spacing.sm }}>
              <Pressable
                onPress={() => { setMenuOpen(false); router.push('/(auth)/email'); }}
                style={{
                  borderWidth: 1,
                  borderColor: Colors.brandPrimary,
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.btn,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: Colors.brandPrimary,
                  fontSize: Typography.fontSize.sm,
                  fontWeight: Typography.fontWeight.semibold,
                }}>Войти</Text>
              </Pressable>
              <Pressable
                onPress={() => { setMenuOpen(false); router.push('/(auth)/email?role=SPECIALIST'); }}
                style={{
                  backgroundColor: Colors.brandPrimary,
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.btn,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: Colors.white,
                  fontSize: Typography.fontSize.sm,
                  fontWeight: Typography.fontWeight.semibold,
                }}>Разместить заявку</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}
