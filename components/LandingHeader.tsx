import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { useAuth } from '../stores/authStore';
import { Colors, Typography } from '../constants/Colors';

interface NavLinkConfig {
  label: string;
  route?: string;
  segment?: string;
  onPress?: () => void;
}

const NAV_LINKS: NavLinkConfig[] = [
  { label: 'Специалисты', route: '/specialists', segment: 'specialists' },
  { label: 'Запросы', route: '/requests', segment: 'requests' },
];

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

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* Left: Logo */}
        <TouchableOpacity
          onPress={() => router.push('/')}
          activeOpacity={0.8}
          style={styles.logoRow}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoInitial}>Н</Text>
          </View>
          <Text style={styles.logoText}>Налоговик</Text>
        </TouchableOpacity>

        {/* Center: Nav links (desktop only) */}
        {isDesktop && (
          <View style={styles.navLinks}>
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link);
              return (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => {
                    if (link.onPress) link.onPress();
                    else if (link.route) router.push(link.route as any);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navLink, active && styles.navLinkActive]}>
                    {link.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Right: Auth buttons (desktop only) or burger (tablet + mobile) */}
        {!isDesktop ? (
          <TouchableOpacity
            onPress={() => setMenuOpen((v) => !v)}
            activeOpacity={0.7}
            style={styles.burgerBtn}
          >
            <View style={styles.burgerLine} />
            <View style={styles.burgerLine} />
            <View style={styles.burgerLine} />
          </TouchableOpacity>
        ) : user ? (
          <View style={styles.rightButtons}>
            <TouchableOpacity
              onPress={() => router.push('/(dashboard)')}
              activeOpacity={0.8}
              style={styles.btnRegister}
            >
              <Text style={styles.btnRegisterLabel}>Кабинет</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.rightButtons}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/email')}
              activeOpacity={0.8}
              style={styles.btnLogin}
            >
              <Text style={styles.btnLoginLabel}>Войти</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/email?role=SPECIALIST')}
              activeOpacity={0.7}
            >
              <Text style={styles.specialistLink}>Для специалистов</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Mobile menu overlay — closes menu on outside tap */}
      {!isDesktop && menuOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
          style={styles.menuOverlay}
        />
      )}

      {/* Mobile dropdown menu */}
      {!isDesktop && menuOpen && (
        <Animated.View style={[styles.mobileMenu, { opacity: menuAnim, transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link);
            return (
              <TouchableOpacity
                key={link.label}
                onPress={() => {
                  setMenuOpen(false);
                  if (link.onPress) link.onPress();
                  else if (link.route) router.push(link.route as any);
                }}
                activeOpacity={0.7}
                style={styles.mobileMenuItem}
              >
                <Text style={[styles.mobileMenuText, active && styles.mobileMenuTextActive]}>
                  {link.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {user ? (
            <TouchableOpacity
              onPress={() => { setMenuOpen(false); router.push('/(dashboard)'); }}
              activeOpacity={0.8}
              style={[styles.btnRegister, { alignSelf: 'stretch', marginTop: 8 }]}
            >
              <Text style={styles.btnRegisterLabel}>Кабинет</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => { setMenuOpen(false); router.push('/(auth)/email'); }}
                activeOpacity={0.8}
                style={[styles.btnLogin, { alignSelf: 'stretch', marginTop: 8 }]}
              >
                <Text style={styles.btnLoginLabel}>Войти</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setMenuOpen(false); router.push('/(auth)/email?role=SPECIALIST'); }}
                activeOpacity={0.8}
                style={[styles.btnRegister, { alignSelf: 'stretch', marginTop: 4 }]}
              >
                <Text style={styles.btnRegisterLabel}>Для специалистов</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 64,
    backgroundColor: Colors.bgCard,
    zIndex: 100,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  navLink: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  navLinkActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnLogin: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnLoginLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brandPrimary,
  },
  btnRegister: {
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnRegisterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  burgerBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  burgerLine: {
    width: 22,
    height: 2,
    backgroundColor: Colors.textPrimary,
    borderRadius: 1,
  },
  menuOverlay: {
    position: 'absolute' as any,
    top: 64,
    left: 0,
    right: 0,
    bottom: -9999,
    zIndex: 9,
  },
  mobileMenu: {
    ...Platform.select({
      web: { position: 'absolute' as any },
      default: { position: 'absolute' as any },
    }),
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: Colors.bgCard,
    padding: 16,
    zIndex: 200,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
      },
    }),
  },
  mobileMenuItem: {
    paddingVertical: 12,
  },
  mobileMenuText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  mobileMenuTextActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  specialistLink: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
