import { useState, useCallback, useEffect, useMemo } from "react";
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
import { useLocalSearchParams, router as routerSingleton } from "expo-router";
import {
  ChevronLeft,
  LogOut,
  Trash2,
  RefreshCw,
  X,
  ExternalLink,
  Copy,
  Check,
  Share2,
  ArrowRight,
} from "lucide-react-native";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";
import StyledSwitch from "@/components/ui/StyledSwitch";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { colors } from "@/lib/theme";
import { Z } from "@/lib/zIndex";
import { useSettingsForm, type AutosaveStatus } from "@/lib/useSettingsForm";
import ProfileTab from "@/components/settings/ProfileTab";
import SpecialistTab from "@/components/settings/SpecialistTab";
import InlineWorkArea from "@/components/settings/InlineWorkArea";
import { dialog } from "@/lib/dialog";

/**
 * Unified Profile page (Wave 6 / profile-tabs).
 *
 * Single page with two tabs at the top:
 *   - 'Аккаунт' (default): Личные данные, тумблер 'Я специалист',
 *     Опасная зона (Выйти / Удалить).
 *   - 'Специалист' (visible when isSpecialist=true): Публичный профиль,
 *     рабочая зона, О себе, Опыт+Специализация, Контакты, Офис, плюс
 *     блок 'Готово — что дальше' с Посмотреть/Скопировать/Перейти к
 *     запросам.
 *
 * Tab is mirrored in ?tab=specialist so:
 *   - the sidebar 'Я специалист' link can deep-link there
 *   - browser back/forward switches tabs naturally
 *   - toggling 'Я специалист' ON sets ?tab=specialist via setParams
 *     (no page navigation, no history hop, no broken back button).
 */

type Tab = "account" | "specialist";

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

function AutosaveIndicator({ status, lastSavedAt, onRetry }: AutosaveIndicatorProps) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!lastSavedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, [lastSavedAt]);
  void tick;

  if (status === "saving") {
    return <Text className="text-xs text-text-mute">Сохраняем…</Text>;
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

interface TabStripProps {
  active: Tab;
  showSpecialist: boolean;
  onChange: (t: Tab) => void;
}

function TabStrip({ active, showSpecialist, onChange }: TabStripProps) {
  if (!showSpecialist) return null;
  const items: { key: Tab; label: string }[] = [
    { key: "account", label: "Аккаунт" },
    { key: "specialist", label: "Специалист" },
  ];
  return (
    <View
      className="flex-row mb-4 bg-white border border-border rounded-2xl"
      style={{ overflow: "hidden" }}
    >
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <Pressable
            key={it.key}
            accessibilityRole="tab"
            accessibilityLabel={it.label}
            onPress={() => onChange(it.key)}
            className="flex-1 items-center justify-center py-3"
            style={{
              backgroundColor: isActive ? colors.accent : "transparent",
            }}
          >
            <Text
              className="text-sm"
              style={{
                color: isActive ? colors.white : colors.textSecondary,
                fontWeight: isActive ? "700" : "500",
              }}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function UnifiedProfile() {
  const params = useLocalSearchParams<{
    firstTime?: string;
    focus?: string;
    tab?: string;
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

  const tabFromQuery: Tab = useMemo(() => {
    const t = params.tab;
    const v = typeof t === "string" ? t : Array.isArray(t) ? t[0] : undefined;
    return v === "specialist" ? "specialist" : "account";
  }, [params.tab]);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [editingWorkArea, setEditingWorkArea] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const form = useSettingsForm({
    ready,
    activeTab: tabFromQuery === "specialist" ? "specialist" : "profile",
    onTabChange: () => undefined,
  });
  const { router, user, isSpecialistUser } = form;

  // Effective tab — fall back to 'account' if user isn't a specialist
  // even if the URL says specialist (e.g. they toggled off but the
  // sidebar link still tries to deep-link).
  const activeTab: Tab =
    tabFromQuery === "specialist" && isSpecialistUser ? "specialist" : "account";

  const setTab = useCallback(
    (next: Tab) => {
      // setParams keeps URL in sync without pushing a new history entry —
      // back button still returns to wherever the user was before /profile.
      routerSingleton.setParams({ tab: next === "specialist" ? "specialist" : "" });
    },
    []
  );

  // Legacy ?focus=specialist links land here. Switch the tab instead of
  // navigating away.
  useEffect(() => {
    if (!ready) return;
    if (focus === "specialist" && isSpecialistUser) {
      setTab("specialist");
    }
  }, [ready, focus, isSpecialistUser, setTab]);

  // Auto-open the work-area wizard when the specialist tab opens with
  // an empty FNS list — was the old StrandedSpecialistBanner CTA target.
  useEffect(() => {
    if (
      ready &&
      activeTab === "specialist" &&
      isSpecialistUser &&
      !form.specLoading &&
      form.specData &&
      form.specData.fnsServices.length === 0
    ) {
      setEditingWorkArea(true);
    }
  }, [ready, activeTab, isSpecialistUser, form.specLoading, form.specData]);

  const profileUrl = useCallback((): string => {
    if (!user?.id) return "";
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return `${window.location.origin}/profile/${user.id}`;
    }
    return `https://p2ptax.ru/profile/${user.id}`;
  }, [user?.id]);

  const handleCopy = useCallback(async () => {
    const url = profileUrl();
    if (!url) return;
    if (Platform.OS === "web" && typeof navigator !== "undefined") {
      try {
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 1800);
      } catch {
        dialog.alert({ title: "Не удалось скопировать", message: url });
      }
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Share } = require("react-native") as {
        Share: { share: (opts: { message: string; url: string }) => Promise<unknown> };
      };
      await Share.share({ message: url, url });
    } catch {
      // user cancelled
    }
  }, [profileUrl]);

  // Wrap the toggle so flipping ON also switches the active tab in-place.
  const handleToggleSpecialistTabAware = useCallback(
    async (value: boolean) => {
      await form.handleToggleSpecialist(value);
      if (value) setTab("specialist");
      else setTab("account");
    },
    [form, setTab]
  );

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

      {/* Sticky top header */}
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

          <TabStrip
            active={activeTab}
            showSpecialist={isSpecialistUser}
            onChange={setTab}
          />

          {/* === ACCOUNT TAB ====================================== */}
          {activeTab === "account" && (
            <>
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
                  void form.autosavePersonal();
                }}
                onUploadStart={() => form.setAvatarUploading(true)}
                onUploadEnd={() => form.setAvatarUploading(false)}
                onToggleSpecialist={handleToggleSpecialistTabAware}
                onToggleAvailable={form.handleToggleAvailable}
                onPersonalBlur={form.autosavePersonal}
              />

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
            </>
          )}

          {/* === SPECIALIST TAB =================================== */}
          {activeTab === "specialist" && (
            <>
              {/* Public profile toggle */}
              <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
                <View className="flex-row items-center justify-between py-1">
                  <View className="flex-1 mr-4">
                    <Text className="text-base font-semibold text-text-base">
                      Публичный профиль
                    </Text>
                    <Text className="text-xs text-text-mute mt-0.5 leading-5">
                      {form.isAvailable
                        ? "Видны в каталоге, новые клиенты могут вам написать"
                        : "Скрыты из каталога. Существующие диалоги остаются."}
                    </Text>
                  </View>
                  <StyledSwitch
                    value={form.isAvailable}
                    onValueChange={form.handleToggleAvailable}
                  />
                </View>
              </View>

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
                    form.refreshSpecialistData?.();
                  }}
                  onCancel={() => setEditingWorkArea(false)}
                />
              ) : (
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
                  onGoToProfileTab={() => setTab("account")}
                  onGoToWorkArea={() => setEditingWorkArea(true)}
                  onSpecialistBlur={form.autosaveSpecialistProfile}
                />
              )}

              {/* Готово — что дальше */}
              {!editingWorkArea && (
                <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
                  <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                    Готово — что дальше
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Посмотреть мой профиль"
                    onPress={() =>
                      user?.id && form.nav.dynamic.specialist(user.id)
                    }
                    className="flex-row items-center justify-between py-3 px-4 rounded-xl mb-2"
                    style={{ backgroundColor: colors.surface2 }}
                  >
                    <View className="flex-row items-center">
                      <ExternalLink size={16} color={colors.accent} />
                      <Text
                        className="text-sm font-semibold ml-2"
                        style={{ color: colors.text }}
                      >
                        Посмотреть мой профиль
                      </Text>
                    </View>
                    <ArrowRight size={14} color={colors.textSecondary} />
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Скопировать ссылку на профиль"
                    onPress={handleCopy}
                    className="flex-row items-center justify-between py-3 px-4 rounded-xl mb-2"
                    style={{ backgroundColor: colors.surface2 }}
                  >
                    <View className="flex-row items-center">
                      {linkCopied ? (
                        <Check size={16} color={colors.success} />
                      ) : Platform.OS === "web" ? (
                        <Copy size={16} color={colors.accent} />
                      ) : (
                        <Share2 size={16} color={colors.accent} />
                      )}
                      <Text
                        className="text-sm font-semibold ml-2"
                        style={{ color: linkCopied ? colors.success : colors.text }}
                      >
                        {linkCopied
                          ? "Ссылка скопирована"
                          : Platform.OS === "web"
                            ? "Скопировать ссылку"
                            : "Поделиться профилем"}
                      </Text>
                    </View>
                    <ArrowRight size={14} color={colors.textSecondary} />
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Перейти к запросам"
                    onPress={() => form.nav.routes.tabsRequests()}
                    className="flex-row items-center justify-between py-3 px-4 rounded-xl"
                    style={{ backgroundColor: colors.accent }}
                  >
                    <View className="flex-row items-center">
                      <Text
                        className="text-sm font-semibold ml-1"
                        style={{ color: colors.white }}
                      >
                        Перейти к запросам
                      </Text>
                    </View>
                    <ArrowRight size={14} color={colors.white} />
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
