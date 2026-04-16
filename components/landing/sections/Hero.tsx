import React, { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '../../../constants/Colors';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import {
  Button,
  Container,
  Heading,
  Input,
  Text,
} from '../../../components/ui';
import { auth, ifns, requests as requestsApi } from '../../../lib/api/endpoints';
import { useAuth } from '../../../lib/auth/AuthContext';
import { LocationPicker } from '../LocationPicker';

type HeroStep = 'idle' | 'email' | 'otp' | 'done';

export function Hero() {
  const router = useRouter();
  const { isAuthenticated, login: authLogin } = useAuth();
  const { atLeast } = useBreakpoint();
  const isDesktop = atLeast('md');

  const [city, setCity] = useState('');
  const [fns, setFns] = useState('');
  const [service, setService] = useState('');
  const [description, setDescription] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [fnsByCity, setFnsByCity] = useState<Record<string, string[]>>({});

  const [step, setStep] = useState<HeroStep>('idle');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    ifns
      .getCities()
      .then((res) => {
        const data = (res as any).data ?? res;
        setCities(Array.isArray(data) ? data.map((c: any) => c.name ?? c) : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!city || fnsByCity[city]) return;
    ifns
      .getIfns({ city })
      .then((res) => {
        const data = (res as any).data ?? res;
        const list: string[] = Array.isArray(data) ? data.map((f: any) => f.name ?? f) : [];
        setFnsByCity((prev) => ({ ...prev, [city]: list }));
      })
      .catch(() => {});
  }, [city, fnsByCity]);

  const trimmedDescription = description.trim();
  const descriptionValid = trimmedDescription.length >= 10;
  const serviceTypeValue = service || 'Не знаю';
  const canContinue = descriptionValid && !submitting;

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (axios.isAxiosError(err)) {
      const raw = (err.response?.data as any)?.message;
      if (Array.isArray(raw)) return raw.join(', ');
      if (typeof raw === 'string' && raw) return raw;
    }
    return fallback;
  };

  const submitQuickRequest = async () => {
    const payload: { description: string; serviceType: string; city?: string; ifnsName?: string } = {
      description: trimmedDescription.slice(0, 500),
      serviceType: serviceTypeValue.slice(0, 100),
    };
    if (city) payload.city = city.slice(0, 100);
    if (fns) payload.ifnsName = fns.slice(0, 200);
    await requestsApi.createQuick(payload);
  };

  const handleMainPress = async () => {
    if (!descriptionValid) {
      setErrorText('Опишите вашу ситуацию (минимум 10 символов)');
      return;
    }
    setErrorText(null);
    if (isAuthenticated) {
      setSubmitting(true);
      try {
        await submitQuickRequest();
        setStep('done');
      } catch (err) {
        setErrorText(extractErrorMessage(err, 'Не удалось отправить заявку. Попробуйте ещё раз.'));
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep('email');
  };

  const handleEmailContinue = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@') || clean.length < 5) {
      setErrorText('Введите корректный email адрес');
      return;
    }
    setSubmitting(true);
    setErrorText(null);
    try {
      await auth.requestOtp(clean);
      setEmail(clean);
      setOtpDigits(['', '', '', '', '', '']);
      setStep('otp');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setErrorText(extractErrorMessage(err, 'Не удалось отправить код. Попробуйте ещё раз.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    let v = value;
    if (v.length > 1) v = v.slice(-1);
    if (v && !/^\d$/.test(v)) return;
    const next = [...otpDigits];
    next[index] = v;
    setOtpDigits(next);
    if (errorText) setErrorText(null);
    if (v && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpSubmit = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) {
      setErrorText('Введите все 6 цифр');
      return;
    }
    setSubmitting(true);
    setErrorText(null);
    try {
      const verifyRes = await auth.verifyOtp(email, code, 'client');
      const verifyData = (verifyRes as any).data ?? verifyRes;
      try {
        const u = verifyData?.user ?? {};
        await authLogin(
          verifyData.accessToken,
          verifyData.refreshToken,
          {
            id: u.userId ?? u.id ?? '',
            email: u.email ?? email,
            role: (u.role ?? 'CLIENT') as 'CLIENT' | 'SPECIALIST' | 'ADMIN',
            username: u.username ?? undefined,
            isNewUser: verifyData.isNewUser,
          },
        );
      } catch {
        // Non-critical — tokens already persisted by verifyOtp
      }
      await submitQuickRequest();
      setStep('done');
    } catch (err) {
      setErrorText(extractErrorMessage(err, 'Неверный код. Попробуйте ещё раз.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToIdle = () => {
    setStep('idle');
    setErrorText(null);
    setEmail('');
    setOtpDigits(['', '', '', '', '', '']);
  };

  const goToDashboard = () => {
    router.replace('/(tabs)/dashboard' as any);
  };

  // --- render cards per step ---

  const renderIdleStep = () => (
    <>
      <Heading level={3} style={{ marginBottom: Spacing.xs }}>
        Разместить запрос
      </Heading>
      <Text variant="muted" style={{ marginBottom: Spacing.lg, fontSize: Typography.fontSize.sm }}>
        Опишите вашу ситуацию — специалисты по вашей ФНС свяжутся с вами в чате
      </Text>

      <View style={{ marginBottom: Spacing.md }}>
        <LocationPicker
          city={city}
          fns={fns}
          service={service}
          onCityChange={setCity}
          onFnsChange={setFns}
          onServiceChange={setService}
          cities={cities}
          fnsByCity={fnsByCity}
        />
      </View>

      <View style={{ marginBottom: Spacing.lg }}>
        <Input
          value={description}
          onChangeText={(t) => {
            setDescription(t);
            if (errorText) setErrorText(null);
          }}
          placeholder="Кратко опишите вашу ситуацию..."
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>

      {errorText ? <ErrorBanner text={errorText} /> : null}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={submitting}
        disabled={!canContinue}
        onPress={handleMainPress}
        icon={!submitting ? <Feather name="send" size={16} color={Colors.white} /> : undefined}
        accessibilityLabel="Отправить заявку"
      >
        {isAuthenticated ? 'Отправить заявку' : 'Продолжить'}
      </Button>

      <Text
        variant="caption"
        align="center"
        style={{ marginTop: Spacing.sm, color: Colors.textMuted }}
      >
        Бесплатно. Специалисты напишут вам сами.
      </Text>
    </>
  );

  const renderEmailStep = () => (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <Pressable onPress={handleBackToIdle} hitSlop={8}>
          <Feather name="arrow-left" size={18} color={Colors.textMuted} />
        </Pressable>
        <Heading level={3}>Ваш email</Heading>
      </View>
      <Text variant="muted" style={{ marginBottom: Spacing.lg, fontSize: Typography.fontSize.sm }}>
        Отправим код для подтверждения. Никаких паролей.
      </Text>

      <View style={{ marginBottom: Spacing.md }}>
        <Input
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errorText) setErrorText(null);
          }}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!submitting}
          error={errorText ?? undefined}
          icon={<Feather name="mail" size={16} color={errorText ? Colors.statusError : Colors.textMuted} />}
        />
      </View>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={submitting}
        onPress={handleEmailContinue}
        icon={!submitting ? <Feather name="arrow-right" size={16} color={Colors.white} /> : undefined}
      >
        Получить код
      </Button>
    </>
  );

  const renderOtpStep = () => (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <Pressable
          onPress={() => {
            setStep('email');
            setErrorText(null);
          }}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={18} color={Colors.textMuted} />
        </Pressable>
        <Heading level={3}>Введите код</Heading>
      </View>
      <Text variant="muted" style={{ marginBottom: Spacing.lg, fontSize: Typography.fontSize.sm }}>
        Код отправлен на{' '}
        <Text weight="medium" style={{ color: Colors.textPrimary, fontSize: Typography.fontSize.sm }}>
          {email}
        </Text>
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md }}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const hasError = !!errorText;
          const filled = !!otpDigits[i];
          const borderColor = hasError
            ? Colors.statusError
            : filled
            ? Colors.brandPrimary
            : Colors.borderLight;
          const bgColor = hasError
            ? Colors.statusBg.error
            : filled
            ? Colors.bgSecondary
            : Colors.white;
          return (
            <View
              key={i}
              style={{
                height: 48,
                width: '14%',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: BorderRadius.lg,
                borderWidth: 2,
                borderColor,
                backgroundColor: bgColor,
              }}
            >
              <TextInput
                ref={(ref) => {
                  otpInputRefs.current[i] = ref;
                }}
                value={otpDigits[i]}
                onChangeText={(v) => handleOtpDigitChange(i, v)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!submitting}
                style={
                  {
                    height: '100%',
                    width: '100%',
                    textAlign: 'center',
                    fontSize: Typography.fontSize.xl,
                    fontWeight: Typography.fontWeight.bold,
                    fontFamily: Typography.fontFamily.bold,
                    color: Colors.textPrimary,
                    outlineStyle: 'none',
                  } as any
                }
              />
            </View>
          );
        })}
      </View>

      {errorText ? <ErrorBanner text={errorText} /> : null}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={submitting}
        onPress={handleOtpSubmit}
        icon={!submitting ? <Feather name="check" size={16} color={Colors.white} /> : undefined}
      >
        Подтвердить и отправить
      </Button>
    </>
  );

  const renderDoneStep = () => (
    <View style={{ alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xs }}>
      <View
        style={{
          height: 56,
          width: 56,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: BorderRadius.full,
          backgroundColor: Colors.statusBg.success,
        }}
      >
        <Feather name="check-circle" size={28} color={Colors.statusSuccess} />
      </View>
      <Heading level={3}>Заявка отправлена</Heading>
      <Text variant="muted" align="center" style={{ fontSize: Typography.fontSize.sm }}>
        Специалисты по вашей ФНС получат уведомление и напишут вам в чате.
      </Text>
      {isAuthenticated ? (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={goToDashboard}
          icon={<Feather name="arrow-right" size={16} color={Colors.white} />}
          style={{ marginTop: Spacing.sm }}
        >
          Перейти в личный кабинет
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => {
            setDescription('');
            setCity('');
            setFns('');
            setService('');
            setEmail('');
            setOtpDigits(['', '', '', '', '', '']);
            setStep('idle');
          }}
          style={{ marginTop: Spacing.sm }}
        >
          Отправить ещё одну
        </Button>
      )}
    </View>
  );

  const bullets: { text: string }[] = [
    { text: 'Знают вашу инспекцию лично' },
    { text: 'Ответ в течение часа' },
    { text: 'Бесплатная первая консультация' },
  ];

  return (
    <View
      style={{
        backgroundColor: Colors.bgPrimary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing['4xl'],
      }}
    >
      <Container padded={false}>
        <View style={isDesktop ? { flexDirection: 'row', gap: Spacing['3xl'] + Spacing.sm } : { gap: Spacing['3xl'] }}>
          {/* Left: headline + bullets */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Heading
              level={1}
              style={{
                fontSize: isDesktop ? Typography.fontSize.display : Typography.fontSize['3xl'] - 2,
                lineHeight: isDesktop ? 44 : 36,
                marginBottom: Spacing.md,
              }}
            >
              Специалисты, которые знают{'\n'}вашу ФНС изнутри
            </Heading>
            <Text
              variant="muted"
              style={{
                fontSize: Typography.fontSize.md,
                lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
                marginBottom: Spacing.xl,
                maxWidth: 400,
              }}
            >
              Не общие юристы, а конкретные консультанты с опытом работы в конкретных налоговых
              инспекциях. Каждый специалист знает процессы, сотрудников и практику своей ФНС.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg }}>
              {bullets.map((b) => (
                <View
                  key={b.text}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}
                >
                  <Feather name="check-circle" size={16} color={Colors.statusSuccess} />
                  <Text variant="caption">{b.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Right: inline request form */}
          <View
            style={{
              width: isDesktop ? 340 : undefined,
              alignSelf: isDesktop ? 'auto' : 'stretch',
              borderRadius: BorderRadius.xl,
              borderWidth: 1,
              borderColor: Colors.borderLight,
              backgroundColor: Colors.bgSecondary,
              padding: Spacing.xl,
              ...Shadows.md,
            }}
          >
            {step === 'idle' && renderIdleStep()}
            {step === 'email' && renderEmailStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'done' && renderDoneStep()}
          </View>
        </View>
      </Container>
    </View>
  );
}

function ErrorBanner({ text }: { text: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.statusBg.error,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.md,
      }}
    >
      <Feather name="alert-circle" size={14} color={Colors.statusError} />
      <Text variant="caption" style={{ color: Colors.statusError }}>
        {text}
      </Text>
    </View>
  );
}
