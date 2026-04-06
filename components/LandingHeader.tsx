import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBreakpoints } from '../hooks/useBreakpoints';
import { useAuth } from '../stores/authStore';

export function LandingHeader() {
  const router = useRouter();
  const { isMobile } = useBreakpoints();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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

        {/* Center: Nav links (desktop/tablet only) */}
        {!isMobile && (
          <View style={styles.navLinks}>
            <TouchableOpacity
              onPress={() => router.push('/specialists')}
              activeOpacity={0.7}
            >
              <Text style={styles.navLink}>Специалисты</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/requests')}
              activeOpacity={0.7}
            >
              <Text style={styles.navLink}>Лента запросов</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'web') {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.navLink}>Как работает</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Right: Auth buttons (desktop/tablet) or burger (mobile) */}
        {isMobile ? (
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
              activeOpacity={0.8}
              style={styles.btnRegister}
            >
              <Text style={styles.btnRegisterLabel}>Для специалистов</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Mobile menu overlay — closes menu on outside tap */}
      {isMobile && menuOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
          style={styles.menuOverlay}
        />
      )}

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <View style={styles.mobileMenu}>
          <TouchableOpacity
            onPress={() => { setMenuOpen(false); router.push('/specialists'); }}
            activeOpacity={0.7}
            style={styles.mobileMenuItem}
          >
            <Text style={styles.mobileMenuText}>Специалисты</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setMenuOpen(false); router.push('/requests'); }}
            activeOpacity={0.7}
            style={styles.mobileMenuItem}
          >
            <Text style={styles.mobileMenuText}>Лента запросов</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              if (Platform.OS === 'web') {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            activeOpacity={0.7}
            style={styles.mobileMenuItem}
          >
            <Text style={styles.mobileMenuText}>Как работает</Text>
          </TouchableOpacity>
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 64,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#1A5BA8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F2447',
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
    color: '#4A6B88',
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
    borderColor: '#1A5BA8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnLoginLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A5BA8',
  },
  btnRegister: {
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1A5BA8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnRegisterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: '#0F2447',
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
    backgroundColor: '#FFFFFF',
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
    color: '#4A6B88',
  },
});
