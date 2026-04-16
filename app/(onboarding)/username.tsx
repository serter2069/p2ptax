import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { users } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth';
import { Button, Container, Heading, Input, Screen, Text } from '../../components/ui';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/Colors';

// Russian + English letters, space, hyphen, apostrophe; 2–50 chars.
const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ\s'-]{2,50}$/;

export default function NameScreen() {
  const router = useRouter();
  const { role, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstErr, setFirstErr] = useState('');
  const [lastErr, setLastErr] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

  const validateField = (val: string): string => {
    if (val.trim().length < 2) return 'Минимум 2 символа';
    if (val.trim().length > 50) return 'Максимум 50 символов';
    if (!NAME_REGEX.test(val.trim())) return 'Только буквы, пробел, дефис и апостроф';
    return '';
  };

  const canContinue =
    !!firstName.trim() &&
    !!lastName.trim() &&
    !firstErr &&
    !lastErr &&
    agreed &&
    !loading;

  async function handleNext() {
    const fErr = validateField(firstName);
    const lErr = validateField(lastName);
    setFirstErr(fErr);
    setLastErr(lErr);
    if (fErr || lErr || !agreed) return;

    setLoading(true);
    setSubmitErr('');
    try {
      await users.setName({ firstName: firstName.trim(), lastName: lastName.trim() });
      await refreshUser();
      // New SA-requested flow: name → work-area (specialist) → profile
      // For clients: name → profile
      if (role === 'SPECIALIST') {
        router.push('/(onboarding)/work-area' as any);
      } else {
        router.push('/(onboarding)/profile' as any);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Ошибка сохранения';
      setSubmitErr(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  }

  // Copy: specialists see "клиентам" (their future clients); clients see
  // "специалистам" (the specialists they'll be contacting).
  const audienceCopy = role === 'SPECIALIST'
    ? 'Имя и фамилия будут видны клиентам в вашем профиле'
    : 'Имя и фамилия будут видны специалистам, к которым вы обращаетесь';

  const stepCopy = role === 'SPECIALIST' ? 'Шаг 1 из 3' : 'Шаг 1 из 2';
  const progressPct = role === 'SPECIALIST' ? '33%' : '50%';

  return (
    <Screen>
      <Header variant="back" backTitle="Имя" onBack={() => router.back()} />
      <Container>
        <View style={{ paddingVertical: Spacing.xl, gap: Spacing.lg }}>
          <View>
            <View style={{ height: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.bgSecondary }}>
              <View style={{ height: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.brandPrimary, width: progressPct as any }} />
            </View>
            <Text
              variant="caption"
              style={{ marginTop: Spacing.xs, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              {stepCopy}
            </Text>
          </View>

          <View style={{ gap: Spacing.xs }}>
            <Heading level={3}>Как вас зовут?</Heading>
            <Text variant="muted">{audienceCopy}</Text>
          </View>

          <View style={{ gap: Spacing.md }}>
            <Input
              label="Имя"
              value={firstName}
              onChangeText={(t) => { setFirstName(t); if (firstErr) setFirstErr(''); }}
              onBlur={() => setFirstErr(validateField(firstName))}
              placeholder="Иван"
              autoCapitalize="words"
              error={firstErr || undefined}
              icon={<Feather name="user" size={18} color={firstErr ? Colors.statusError : Colors.textMuted} />}
            />

            <Input
              label="Фамилия"
              value={lastName}
              onChangeText={(t) => { setLastName(t); if (lastErr) setLastErr(''); }}
              onBlur={() => setLastErr(validateField(lastName))}
              placeholder="Иванов"
              autoCapitalize="words"
              error={lastErr || undefined}
              icon={<Feather name="user" size={18} color={lastErr ? Colors.statusError : Colors.textMuted} />}
            />
          </View>

          <Pressable
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}
            onPress={() => setAgreed(!agreed)}
          >
            <View
              style={{
                marginTop: 2,
                height: 20,
                width: 20,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: BorderRadius.sm,
                borderWidth: 1,
                borderColor: agreed ? Colors.brandPrimary : Colors.border,
                backgroundColor: agreed ? Colors.brandPrimary : Colors.white,
              }}
            >
              {agreed && <Feather name="check" size={13} color={Colors.white} />}
            </View>
            <Text variant="caption" style={{ flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textSecondary }}>
              Принимаю <Text variant="caption" style={{ color: Colors.brandPrimary }}>условия использования</Text>
            </Text>
          </Pressable>

          {submitErr ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
                borderRadius: BorderRadius.lg,
                backgroundColor: Colors.bgSecondary,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
              }}
            >
              <Feather name="alert-circle" size={14} color={Colors.statusError} />
              <Text variant="caption" style={{ color: Colors.statusError }}>{submitErr}</Text>
            </View>
          ) : null}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canContinue}
            loading={loading}
            onPress={handleNext}
          >
            Далее
          </Button>
        </View>
      </Container>
    </Screen>
  );
}
