import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import LandingHeader from "@/components/landing/LandingHeader";
import PageTitle from "@/components/layout/PageTitle";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { ChevronLeft, X } from "lucide-react-native";
import Button from "@/components/ui/Button";
import { apiPost, api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import InlineOtpFlow from "@/components/requests/InlineOtpFlow";
import type { AttachedFile } from "@/components/requests/FileUploadSection";
import { draftStorage } from "@/lib/draftStorage";
import IntakeWizard from "@/components/intake/IntakeWizard";
import {
  EMPTY_INTAKE,
  INTAKE_DRAFT_KEY,
  deriveTitle,
  type IntakeData,
} from "@/components/intake/types";

interface SpecialistMini {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * /requests/new — structured 4-step intake wizard.
 *
 * Replaces the previous free-text form. The screen is a thin shell:
 *   - top chrome (landing header for anon, back-button on mobile, page title)
 *   - <IntakeWizard> (steps 1-4, sticky progress + nav, owns wizard data)
 *   - inline OTP flow shown after step 4 for anon users (preserves the
 *     existing "fill → email-OTP → submit" path)
 *   - inline error / specialist-targeting banner
 *
 * Submit pipeline (final step "Отправить запрос" press):
 *   1. wizard requests submit → if !isAuthenticated, show InlineOtpFlow
 *      (lock the wizard so user can't keep editing while OTP is up)
 *   2. when authed, POST /api/requests with all wizard fields + legacy
 *      title/description/cityId/fnsId for back-compat
 *   3. on success, drop the draft, navigate to /requests/<id>/detail
 */
export default function CreateRequest() {
  const router = useRouter();
  const nav = useTypedRouter();
  const { isAuthenticated, isLoading: authLoading, token } = useAuth();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ specialistId?: string }>();

  const [targetSpecialistId, setTargetSpecialistId] = useState<string | null>(
    typeof params.specialistId === "string" ? params.specialistId : null
  );
  const [targetSpecialist, setTargetSpecialist] =
    useState<SpecialistMini | null>(null);

  const [wizardData, setWizardData] = useState<IntakeData>(EMPTY_INTAKE);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showOtpFlow, setShowOtpFlow] = useState(false);

  // Fetch targeted specialist name when specialistId is present.
  useEffect(() => {
    if (!targetSpecialistId) {
      setTargetSpecialist(null);
      return;
    }
    api<{
      id: string;
      firstName: string | null;
      lastName: string | null;
    }>(`/api/specialists/${targetSpecialistId}`, { noAuth: true })
      .then((s) =>
        setTargetSpecialist({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
        })
      )
      .catch(() => setTargetSpecialist(null));
  }, [targetSpecialistId]);

  /**
   * Posts the request once the user is authenticated. Called both directly
   * (auth path) and from InlineOtpFlow's onAuthenticated callback (anon path).
   */
  const submitRequestAuthed = useCallback(
    async (_freshToken?: string) => {
      setSubmitting(true);
      setSubmitError("");
      try {
        const fileIds = attachedFiles
          .filter((f) => !!f.uploadedId && !f.uploading && !f.error)
          .map((f) => f.uploadedId as string);

        const description = wizardData.description.trim();
        const title = deriveTitle(wizardData);

        const body: Record<string, unknown> = {
          title,
          cityId: wizardData.cityId,
          fnsId: wizardData.fnsId,
          description,
          fileIds,
          isPublic: true,
          documentType: wizardData.documentType,
          incidentDate: wizardData.incidentDate || undefined,
          urgency: wizardData.urgency,
        };
        if (wizardData.disputedAmount) {
          body.disputedAmount = parseInt(wizardData.disputedAmount, 10);
        }
        if (targetSpecialistId) body.targetSpecialistId = targetSpecialistId;

        const result = await apiPost<{ id: string }>("/api/requests", body);

        await draftStorage.del(INTAKE_DRAFT_KEY).catch(() => {});

        const goToDetail = () =>
          nav.replaceAny(`/requests/${result.id}/detail`);
        if (Platform.OS === "web") {
          goToDetail();
        } else {
          Alert.alert(
            "Запрос опубликован",
            "Специалисты по вашей ФНС увидят его и напишут вам. Обычно первый отклик приходит в течение 24 часов.",
            [{ text: "OK", onPress: goToDetail }],
            { onDismiss: goToDetail }
          );
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : "Не удалось опубликовать запрос. Проверьте данные и попробуйте ещё раз.";
        setSubmitError(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [wizardData, attachedFiles, nav, targetSpecialistId]
  );

  const handleSubmitRequested = useCallback(() => {
    setSubmitError("");
    if (submitting) return;
    if (isAuthenticated) {
      void submitRequestAuthed();
      return;
    }
    setShowOtpFlow(true);
  }, [isAuthenticated, submitRequestAuthed, submitting]);

  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      {!isAuthenticated && (
        <LandingHeader
          isDesktop={width >= 768}
          onHome={() => nav.routes.home()}
          onCatalog={() => nav.routes.specialists()}
          onLogin={() => nav.routes.login()}
          onCreateRequest={() => {}}
          isAuthenticated={false}
        />
      )}
      <View
        className="bg-surface2"
        style={{
          ...(Platform.OS === "web"
            ? ({ position: "sticky", top: 0, zIndex: 10 } as object)
            : {}),
        }}
      >
        {width < 640 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Назад"
              onPress={() => router.back()}
              className="flex-row items-center mb-2"
              style={{ minHeight: 44 }}
            >
              <ChevronLeft size={20} color={colors.text} />
              <Text className="text-text-base ml-1">Назад</Text>
            </Pressable>
          </View>
        )}
        <PageTitle title="Новый запрос" />
      </View>

      {!showOtpFlow ? (
        <IntakeWizard
          isAuthenticated={isAuthenticated}
          authToken={token}
          attachedFiles={attachedFiles}
          onChangeAttachedFiles={setAttachedFiles}
          submitting={submitting}
          onDataChange={setWizardData}
          onSubmitRequested={handleSubmitRequested}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              width: "100%",
              maxWidth: 640,
              alignSelf: "center",
              paddingHorizontal: 16,
              paddingTop: 16,
            }}
          >
            {/* Specialist targeting banner — keep visible during OTP step. */}
            {targetSpecialistId && (
              <View
                className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-4 border"
                style={{
                  backgroundColor: colors.greenSoft,
                  borderColor: colors.success,
                }}
              >
                <View
                  className="flex-row items-center flex-1"
                  style={{ gap: 8 }}
                >
                  <View
                    className="rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: colors.success,
                      flexShrink: 0,
                    }}
                  />
                  <Text
                    className="text-sm font-medium flex-1"
                    style={{ color: colors.success }}
                  >
                    {targetSpecialist
                      ? `Запрос для: ${[
                          targetSpecialist.firstName,
                          targetSpecialist.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ")}`
                      : "Адресован специалисту"}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Убрать адресацию специалисту"
                  onPress={() => setTargetSpecialistId(null)}
                  className="ml-2 p-1"
                  hitSlop={8}
                >
                  <X size={14} color={colors.success} />
                </Pressable>
              </View>
            )}

            <View
              className="rounded-xl p-4 mb-4"
              style={{
                backgroundColor: colors.accentSoft,
                borderColor: colors.primary,
                borderWidth: 1,
              }}
            >
              <Text
                className="text-sm font-semibold mb-1"
                style={{ color: colors.primary }}
              >
                Подтвердите email — последний шаг
              </Text>
              <Text className="text-sm" style={{ color: colors.primary }}>
                Мы отправим 6-значный код. Без паролей. После подтверждения
                запрос опубликуется автоматически.
              </Text>
            </View>

            {submitError ? (
              <View className="bg-danger-soft border border-danger rounded-xl p-3 mb-4">
                <Text className="text-sm font-semibold text-danger mb-0.5">
                  Ошибка публикации
                </Text>
                <Text className="text-sm text-danger">{submitError}</Text>
              </View>
            ) : null}

            <InlineOtpFlow
              onAuthenticated={submitRequestAuthed}
              onCancel={() => setShowOtpFlow(false)}
              parentSubmitting={submitting}
              returnTo={
                targetSpecialistId
                  ? `/requests/new?specialistId=${targetSpecialistId}`
                  : "/requests/new"
              }
            />

            <View className="mt-3">
              <Button
                label="Вернуться к редактированию"
                variant="secondary"
                onPress={() => setShowOtpFlow(false)}
                disabled={submitting}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {/* Targeting banner for the wizard view (above scroll). */}
      {!showOtpFlow && targetSpecialistId && (
        <View
          className="flex-row items-center justify-between border-t border-border px-4 py-2"
          style={{ backgroundColor: colors.greenSoft }}
        >
          <View className="flex-row items-center flex-1" style={{ gap: 8 }}>
            <View
              className="rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: colors.success,
                flexShrink: 0,
              }}
            />
            <Text
              className="text-xs font-medium flex-1"
              style={{ color: colors.success }}
            >
              {targetSpecialist
                ? `Запрос для: ${[
                    targetSpecialist.firstName,
                    targetSpecialist.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ")}`
                : "Адресован специалисту"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Убрать адресацию специалисту"
            onPress={() => setTargetSpecialistId(null)}
            className="ml-2 p-1"
            hitSlop={8}
          >
            <X size={14} color={colors.success} />
          </Pressable>
        </View>
      )}

      {/* Error banner for the wizard view (under sticky nav, above bottom). */}
      {!showOtpFlow && submitError ? (
        <View className="px-4 py-2 border-t border-danger" style={{ backgroundColor: colors.dangerSoft }}>
          <Text className="text-xs font-semibold text-danger">
            {submitError}
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
