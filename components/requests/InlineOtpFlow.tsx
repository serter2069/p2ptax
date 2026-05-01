import { useCallback, useState } from "react";
import { View, Text, TextInput, Platform } from "react-native";
import { Mail } from "lucide-react-native";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { api } from "@/lib/api";
import { useAuth, UserData } from "@/contexts/AuthContext";
import { useTypedRouter } from "@/lib/navigation";
import { colors } from "@/lib/theme";

const CODE_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  /**
   * Called once the user is fully authenticated AND has a role.
   * Receives the fresh accessToken so the parent can use it directly
   * without waiting for AuthContext to propagate (avoids stale-closure race).
   */
  onAuthenticated: (accessToken: string) => void | Promise<void>;
  /** Called when user dismisses or cancels the flow (currently unused). */
  onCancel?: () => void;
  /** External submitting flag — disables the verify button while parent posts. */
  parentSubmitting?: boolean;
  /** Optional returnTo path used when redirecting to /otp for role choice. */
  returnTo?: string;
}

export default function InlineOtpFlow({
  onAuthenticated,
  parentSubmitting = false,
  returnTo = "/requests/new",
}: Props) {
  const { signIn } = useAuth();
  const nav = useTypedRouter();

  const [stage, setStage] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleRequestOtp = useCallback(async () => {
    setEmailError("");
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError("Некорректный email");
      return;
    }
    setRequesting(true);
    try {
      await api("/api/auth/request-otp", {
        method: "POST",
        body: { email: trimmed },
        noAuth: true,
      });
      setEmail(trimmed);
      setStage("code");
      setCode("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Не удалось отправить код";
      setEmailError(msg);
    } finally {
      setRequesting(false);
    }
  }, [email]);

  const handleVerifyOtp = useCallback(async () => {
    setCodeError("");
    if (code.length !== CODE_LENGTH) {
      setCodeError("Введите 6-значный код");
      return;
    }
    setVerifying(true);
    try {
      const data = await api<{
        accessToken: string;
        refreshToken: string;
        user: UserData;
      }>("/api/auth/verify-otp", {
        method: "POST",
        body: { email, code },
        noAuth: true,
      });
      // New users with null role: route to /otp for role choice; we keep JWT.
      if (!data.user.role) {
        await signIn(data.accessToken, data.refreshToken, data.user);
        nav.any({
          pathname: "/otp",
          params: { email, returnTo },
        });
        return;
      }
      // Store tokens first, then call parent directly with fresh token —
      // avoids stale-closure race waiting for AuthContext re-render.
      await signIn(data.accessToken, data.refreshToken, data.user);
      onAuthenticated(data.accessToken);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Неверный код";
      setCodeError(msg);
      setCode("");
    } finally {
      setVerifying(false);
    }
  }, [code, email, signIn, nav, returnTo, onAuthenticated]);

  return (
    <View
      className="bg-white border border-border rounded-2xl px-4 pt-4 pb-4 mb-4"
      testID="inline-otp-block"
    >
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
        Подтверждение
      </Text>

      {stage === "email" && (
        <View>
          <View style={{ marginBottom: 12 }}>
            <Input
              label="Email"
              accessibilityLabel="Email адрес"
              placeholder="your@email.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailError) setEmailError("");
              }}
              icon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!requesting}
              onSubmitEditing={handleRequestOtp}
              error={emailError || undefined}
            />
          </View>
          <Button
            label="Получить код"
            onPress={handleRequestOtp}
            loading={requesting}
            disabled={requesting || !email.trim()}
            testID="inline-otp-request"
          />
        </View>
      )}

      {stage === "code" && (
        <View>
          <Text
            className="text-sm text-text-mute mb-3"
            style={{ lineHeight: 20 }}
          >
            Код отправлен на{" "}
            <Text className="text-text-base font-semibold">{email}</Text>.
            Введите 6 цифр.
          </Text>
          <Text className="text-sm font-medium text-text-base mb-1.5">
            Код <Text className="text-danger">*</Text>
          </Text>
          {/* Code — line-style wrapper + naked TextInput inside */}
          <View
            style={{
              borderTopWidth: 0,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              borderBottomWidth: 1,
              borderBottomColor: codeError ? colors.error : colors.borderStrong,
              paddingBottom: 2,
              marginBottom: codeError ? 6 : 12,
            }}
          >
            <TextInput
              accessibilityLabel="6-значный код"
              placeholder="000000"
              placeholderTextColor={colors.placeholder}
              value={code}
              onChangeText={(t) => {
                const cleaned = t.replace(/\D/g, "").slice(0, CODE_LENGTH);
                setCode(cleaned);
                if (codeError) setCodeError("");
              }}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={CODE_LENGTH}
              editable={!verifying}
              onSubmitEditing={handleVerifyOtp}
              style={{
                height: 48,
                paddingHorizontal: 0,
                fontSize: 18,
                letterSpacing: 4,
                textAlign: "center",
                color: colors.text,
                borderWidth: 0,
                backgroundColor: "transparent",
                ...(Platform.OS === "web"
                  ? {
                      outlineStyle: "none" as never,
                      outlineWidth: 0,
                      appearance: "none" as never,
                    }
                  : {}),
              }}
              testID="inline-otp-code"
            />
          </View>
          {codeError ? (
            <Text className="text-sm text-danger mb-3" style={{ fontSize: 13 }}>
              {codeError}
            </Text>
          ) : null}
          <Button
            label="Подтвердить и опубликовать"
            onPress={handleVerifyOtp}
            loading={verifying || parentSubmitting}
            disabled={
              verifying || parentSubmitting || code.length !== CODE_LENGTH
            }
            testID="inline-otp-verify"
          />
          <View style={{ marginTop: 10 }}>
            <Button
              variant="secondary"
              label="Изменить email"
              onPress={() => {
                setStage("email");
                setCode("");
                setCodeError("");
              }}
              disabled={verifying}
            />
          </View>
        </View>
      )}
    </View>
  );
}
