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
import SpecialistTab from "@/components/settings/SpecialistTab";
import InlineWorkArea from "@/components/settings/InlineWorkArea";

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
  // When the specialist clicks "Изменить рабочую зону" we open the inline
  // 3-step wizard right here on /profile instead of navigating away (the
  // old behaviour redirected to /profile?firstTime=true&focus=specialist
  // which is the same page → just scrolled, never opening anything).
  const [editingWorkArea, setEditingWorkArea] = useState(false);

  // useSettingsForm still expects `activeTab` for backward compat; we always
  // pass "profile" since this page no longer has tabs.
  const form = useSettingsForm({
    ready,
    activeTab: "profile",
    onTabChange: () => undefined,
  });
  const { router, user, isSpecialistUser } = form;

  // Refs for section auto-scroll (focus param). On web the View becomes a
  // host node — we capture it via callback refs so we can call scrollIntoView
  // directly without fighting the cross-platform RN typings.
  const scrollRef = useRef<ScrollView | null>(null);
  const personalRef = useRef<{ scrollIntoView?: (o?: ScrollIntoViewOptions) => void } | null>(null);
  const specialistRef = useRef<{ scrollIntoView?: (o?: ScrollIntoViewOptions) => void } | null>(null);
  const visibilityRef = useRef<{ scrollIntoView?: (o?: ScrollIntoViewOptions) => void } | null>(null);
  const didScrollRef = useRef(false);

  // Callback ref factories — RN-Web passes the host node, RN-Native passes
  // a View component. Either way, we just store it and only call
  // scrollIntoView when present (web only).
  const setPersonalRef = useCallback((node: unknown) => {
    personalRef.current = node as typeof personalRef.current;
  }, []);
  const setSpecialistRef = useCallback((node: unknown) => {
    specialistRef.current = node as typeof specialistRef.current;
  }, []);
  const setVisibilityRef = useCallback((node: unknown) => {
    visibilityRef.current = node as typeof visibilityRef.current;
  }, []);

  // Stranded specialist auto-open: if the visitor lands on /profile with
  // ?focus=specialist (e.g. clicked the StrandedSpecialistBanner's
  // "Завершить →"), they're already a specialist but have no work-area
  // entries yet — open the inline wizard automatically so they don't
  // have to hunt for the "+ Добавить ИФНС и услуги" button.
  useEffect(() => {
    if (!ready) return;
    if (focus !== "specialist") return;
    if (!isSpecialistUser) return;
    if (form.specLoading) return;
    if (!form.specData) return;
    if (form.specData.fnsServices && form.specData.fnsServices.length === 0) {
      setEditingWorkArea(true);
    }
  }, [ready, focus, isSpecialistUser, form.specLoading, form.specData]);

  // When the user lands with `?focus=specialist` and isn't a specialist yet,
  // auto-enable so the sections are visible. Mirrors old role=specialist flow.
  useEffect(() => {
    if (!ready || didScrollRef.current) return;
    if (firstTime && focus === "specialist" && !isSpecialistUser) {
      // Fire-and-forget; the toggle handler is idempotent.
      void form.handleToggleSpecialist(true);
    }
  }, [ready, firstTime, focus, isSpecialistUser, form]);

  // Auto-scroll to the requested section once.
  useEffect(() => {
    if (!ready || didScrollRef.current || Platform.OS !== "web") return;
    if (!focus) {
      didScrollRef.current = true;
      return;
    }
    const target =
      focus === "specialist"
        ? specialistRef.current
        : focus === "visibility"
          ? visibilityRef.current
          : focus === "name"
            ? personalRef.current
            : null;
    if (target && typeof window !== "undefined") {
      // RN-Web renders <View/> as an HTMLDivElement at runtime — call
      // scrollIntoView when the host method is available.
      const node = target as { scrollIntoView?: (opts?: ScrollIntoViewOptions) => void };
      if (typeof node.scrollIntoView === "function") {
        try {
          node.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch {
          // swallow
        }
      }
      didScrollRef.current = true;
    }
  }, [ready, focus]);

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
        ref={scrollRef}
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

          {/* 1. Личные данные + 2. Тумблер "Я специалист" + (when ON) "Публичный профиль" */}
          <View ref={setPersonalRef as never}>
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

          {/* Anchor refs for focus auto-scroll. Specialist anchor wraps the
              specialist sections so it scrolls into view at the right spot. */}
          <View ref={setVisibilityRef as never} />
          <View ref={setSpecialistRef as never}>
            {/* 3-6. Specialist sections — visible only when isSpecialist ON */}
            {isSpecialistUser ? (
              <>
                {editingWorkArea ? (
                  <InlineWorkArea
                    initialEntries={(form.specData?.fnsServices ?? []).map((g) => ({
                      fnsId: g.fns.id,
                      fnsName: g.fns.name,
                      fnsCode: g.fns.code,
                      cityId: g.city.id,
                      cityName: g.city.name,
                      serviceIds: g.services.map((s) => s.id),
                      serviceNames: g.services.map((s) => s.name),
                      isAnyService: g.services.length === 0,
                    }))}
                    onDone={() => {
                      setEditingWorkArea(false);
                      // Refresh the specialist profile so the new
                      // FNS/services list shows up in FnsServicesSection.
                      form.refreshSpecialistData?.();
                    }}
                    onCancel={() => setEditingWorkArea(false)}
                  />
                ) : (
                  <>
                    {form.specData && form.specData.fnsServices.length === 0 && (
                      <View className="bg-accent-soft border border-border rounded-2xl px-4 py-3 mb-4">
                        <Text className="text-sm text-text-base leading-5">
                          Заполните город, услугу и услугу, чтобы попасть в каталог.
                        </Text>
                      </View>
                    )}
                    <SpecialistTab
                      isSpecialistUser={isSpecialistUser}
                      specLoading={form.specLoading}
                      specData={form.specData}
                      description={form.description}
                      officeAddress={form.officeAddress}
                      workingHours={form.workingHours}
                      experienceText={form.experienceText}
                      specializationText={form.specializationText}
                      contacts={form.contacts}
                      addingContact={form.addingContact}
                      newContactType={form.newContactType}
                      newContactValue={form.newContactValue}
                      contactSaving={form.contactSaving}
                      showTypePicker={form.showTypePicker}
                      onDescriptionChange={form.setDescription}
                      onOfficeAddressChange={form.setOfficeAddress}
                      onWorkingHoursChange={form.setWorkingHours}
                      onExperienceTextChange={form.setExperienceText}
                      onSpecializationTextChange={form.setSpecializationText}
                      onContactsChange={form.setContacts}
                      onAddingContactChange={form.setAddingContact}
                      onNewContactTypeChange={form.setNewContactType}
                      onNewContactValueChange={form.setNewContactValue}
                      onContactSavingChange={form.setContactSaving}
                      onShowTypePickerChange={form.setShowTypePicker}
                      onGoToProfileTab={() => undefined}
                      onGoToWorkArea={() => setEditingWorkArea(true)}
                      onSpecialistBlur={form.autosaveSpecialistProfile}
                    />
                  </>
                )}
              </>
            ) : null}
          </View>

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

