import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Constants from "expo-constants";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import PageTitle from "@/components/layout/PageTitle";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { ChevronLeft, LogOut, Trash2, RefreshCw, X } from "lucide-react-native";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { colors } from "@/lib/theme";
import { Z } from "@/lib/zIndex";
import { useSettingsForm, type AutosaveStatus } from "@/lib/useSettingsForm";
import ProfileTab from "@/components/settings/ProfileTab";

/**
 * Unified Profile page (Wave 4 / profile-merged).
 *
 * Replaces the old /settings page AND all /onboarding/* screens with a single
 * scrollable Profile that reveals specialist sections via the "Я специалист"
 * toggle. Auto-saves on blur — no explicit Save button.
 *
 * Routing:
 *   - /profile             — main entry
 *   - /profile?firstTime=true&focus=name|specialist|visibility — first-time
 *     post-OTP banner + auto-scroll to a section.
 *   - /settings (alias)    — Redirect to /profile.
 *   - /onboarding/*        — Redirect stubs to /profile?firstTime=true&focus=...
 *
 * Sections (top → bottom):
 *   1. Sticky header (title + autosave indicator)
 *   2. firstTime banner (when ?firstTime=true)
 *   3. Личные данные  (always visible)
 *   4. Я специалист   (toggle)
 *   5. Specialist sections (revealed by toggle): About, FNS, Contacts, Office
 *   6. Аккаунт         (logout / delete)
 */

function formatRelativeTime(date: Date | null, now: number): string {
  if (!date) return "";
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (seconds < 5) return "только что";
  if (seconds < 60) return `${seconds} сек назад`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.round(minutes / 60);
  return `${hours} ч назад`;
}

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  onRetry: () => void;
}

function AutosaveIndicator({
  status,
  lastSavedAt,
  onRetry,
}: AutosaveIndicatorProps) {
  // Tick every 30s to refresh the relative time text.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!lastSavedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  // Read `tick` so eslint-react-hooks doesn't warn — it intentionally drives
  // re-renders even though we don't use the value directly.
  void tick;

  if (status === "saving") {
    return (
      <Text className="text-xs text-text-mute">Сохраняем…</Text>
    );
  }
  if (status === "error") {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Повторить сохранение"
        onPress={onRetry}
        className="flex-row items-center"
        style={{ minHeight: 32 }}
      >
        <RefreshCw size={12} color={colors.error} />
        <Text className="text-xs text-danger ml-1.5">
          Не удалось сохранить — повторить
        </Text>
      </Pressable>
    );
  }
  if (status === "saved" && lastSavedAt) {
    return (
      <Text className="text-xs text-text-mute">
        Сохранено • {formatRelativeTime(lastSavedAt, Date.now())}
      </Text>
    );
  }
  return null;
}

interface FirstTimeBannerProps {
  onDismiss: () => void;
}

function FirstTimeBanner({ onDismiss }: FirstTimeBannerProps) {
  return (
    <View
      className="bg-accent-soft border border-border rounded-2xl px-4 py-3 mb-4 flex-row items-center"
      accessibilityRole="alert"
    >
      <Text className="flex-1 text-sm text-text-base">
        Заполните профиль, чтобы клиенты могли вас найти.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Скрыть подсказку"
        onPress={onDismiss}
        style={{ minHeight: 32, minWidth: 32, alignItems: "center", justifyContent: "center" }}
      >
        <X size={16} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

export default function UnifiedProfile() {
  const params = useLocalSearchParams<{
    firstTime?: string;
    focus?: string;
  }>();
  const { ready } = useRequireAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const firstTime = params.firstTime === "true";
  const focus = useMemo(() => {
    const f = params.focus;
    if (typeof f === "string") return f;
    if (Array.isArray(f)) return f[0];
    return undefined;
  }, [params.focus]);

  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Wave 5 / specialist-split: /profile is now account-only. Specialist-
  // mode editing (work area, experience, contacts, etc.) lives on
  // /specialist. The 'Я специалист' toggle below redirects there
  // immediately when flipped ON, so users never have to scroll.
  const form = useSettingsForm({
    ready,
    activeTab: "profile",
    onTabChange: () => undefined,
  });
  const { router, user, isSpecialistUser } = form;

  // Wave 5: legacy ?focus=specialist links forward to /specialist.
  useEffect(() => {
    if (!ready) return;
    if (focus === "specialist") {
      form.nav.replaceRoutes.specialistEdit();
    }
  }, [ready, focus, form]);

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        {!isDesktop && (
          <View className="px-4 pt-4">
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
        <PageTitle title="Профиль" />
        <LoadingState variant="skeleton" lines={5} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      {!isDesktop && (
        <View className="px-4 pt-4">
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

      {/* Sticky top header: title left, autosave indicator right */}
      <View
        className="bg-surface2"
        style={
          Platform.OS === "web"
            ? ({ position: "sticky", top: 0, zIndex: Z.STICKY } as never)
            : undefined
        }
      >
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 8,
            flexDirection: "row",
            alignItems: "center",
            minHeight: 56,
          }}
        >
          <Text className="text-xl font-bold text-text-base" style={{ flex: 1 }}>
            Профиль
          </Text>
          <AutosaveIndicator
            status={form.autosaveStatus}
            lastSavedAt={form.lastSavedAt}
            onRetry={form.retryAutosave}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            paddingHorizontal: 24,
            paddingTop: 16,
          }}
        >
          {firstTime && !bannerDismissed && (
            <FirstTimeBanner onDismiss={() => setBannerDismissed(true)} />
          )}

          {/* 1. Личные данные + 2. Тумблер "Я специалист" */}
          <View>
            <ProfileTab
              firstName={form.firstName}
              lastName={form.lastName}
              email={user?.email ?? ""}
              avatarUrl={form.avatarUrl}
              avatarUploading={form.avatarUploading}
              isSpecialistUser={isSpecialistUser}
              isAvailable={form.isAvailable}
              availabilityLoading={form.availabilityLoading}
              role={user?.role ?? null}
              userId={user?.id}
              onFirstNameChange={form.setFirstName}
              onLastNameChange={form.setLastName}
              onAvatarChange={(url, key) => {
                form.setAvatarUrl(url);
                form.setAvatarKey(key);
                // Avatar is the one exception that fires immediately —
                // the upload itself is the user gesture, not a blur.
                void form.autosavePersonal();
              }}
              onUploadStart={() => form.setAvatarUploading(true)}
              onUploadEnd={() => form.setAvatarUploading(false)}
              onToggleSpecialist={form.handleToggleSpecialist}
              onToggleAvailable={form.handleToggleAvailable}
              onPersonalBlur={form.autosavePersonal}
            />
          </View>

          {/* Quick link to /specialist when in specialist mode. The
              actual editor (work area, experience, contacts, etc.)
              now lives there — /profile is account-only. */}
          {isSpecialistUser && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Открыть настройки специалиста"
              onPress={() => form.nav.replaceRoutes.specialistEdit()}
              className="bg-white border border-border rounded-2xl px-4 py-4 mb-4 flex-row items-center justify-between"
              style={{ minHeight: 64 }}
            >
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold text-text-base">
                  Настройки специалиста
                </Text>
                <Text className="text-xs text-text-mute mt-0.5">
                  Рабочая зона, опыт, контакты, видимость в каталоге
                </Text>
              </View>
              <Text style={{ color: colors.accent, fontSize: 18 }}>›</Text>
            </Pressable>
          )}

          {/* Logout / Delete — always visible at bottom */}
          <Card className="mt-2 mb-4" style={{ overflow: "hidden" }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Выйти из аккаунта"
              onPress={form.handleLogout}
              className="flex-row items-center min-h-[44px] border-b border-border"
            >
              <LogOut size={16} color={colors.error} />
              <Text className="text-base text-danger ml-3 flex-1">
                Выйти из аккаунта
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Удалить аккаунт"
              onPress={form.handleDeleteAccount}
              className="flex-row items-center min-h-[44px]"
            >
              <Trash2 size={16} color={colors.error} />
              <Text className="text-base text-danger ml-3 flex-1">
                Удалить аккаунт
              </Text>
            </Pressable>
          </Card>

          <Text className="text-xs text-text-dim text-center mb-4">
            Версия {Constants.expoConfig?.version ?? "1.0.0"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

