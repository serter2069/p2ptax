import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Constants from "expo-constants";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import {
  LogOut,
  Trash2,
  Pencil,
  ChevronRight,
  FileText,
} from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { colors } from "@/lib/theme";
import AvatarUploader from "@/components/settings/AvatarUploader";
import ContactMethodsList, {
  ContactMethodItem,
} from "@/components/settings/ContactMethodsList";
import NotificationPreferences from "@/components/settings/NotificationPreferences";
import RoleBadge from "@/components/layout/RoleBadge";

/**
 * Unified Settings page — tabbed layout (Wave 2/F).
 *
 * Four tabs:
 *   1. Профиль       — Личные данные + Режим специалиста (toggle).
 *   2. Специалист    — описание / ИФНС / контакты / офис (gated by isSpecialistUser).
 *   3. Уведомления   — NotificationPreferences.
 *   4. Аккаунт       — правовая информация + sign out / delete + версия.
 *
 * Sticky save-bar тянется к активной вкладке (только если есть несохранённые
 * изменения в её полях). Deeplink через `?tab=specialist` поддерживается.
 *
 * ADMIN users are redirected to /admin/settings via the orchestrator; this
 * page is USER-focused.
 */

interface FnsServiceItem {
  fns: { id: string; name: string; code: string };
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

interface SpecialistProfileData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAvailable: boolean;
  profile: {
    description: string | null;
    phone: string | null;
    telegram: string | null;
    whatsapp: string | null;
    officeAddress: string | null;
    workingHours: string | null;
  } | null;
  fnsServices: FnsServiceItem[];
}

type SettingsTab = "profile" | "specialist" | "notifications" | "account";

const VALID_TABS: SettingsTab[] = [
  "profile",
  "specialist",
  "notifications",
  "account",
];

function isValidTab(value: string | undefined): value is SettingsTab {
  return !!value && (VALID_TABS as string[]).includes(value);
}

function IosToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 150, useNativeDriver: false }).start();
  }, [value]);
  const trackColor = anim.interpolate({ inputRange: [0, 1], outputRange: ["#E5E5EA", colors.primary] });
  const thumbPos = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={{ width: 51, height: 31 }}>
      <Animated.View style={{ width: 51, height: 31, borderRadius: 15.5, backgroundColor: trackColor, justifyContent: "center" }}>
        <Animated.View style={{ width: 27, height: 27, borderRadius: 13.5, backgroundColor: "white", position: "absolute", left: thumbPos, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 }} />
      </Animated.View>
    </Pressable>
  );
}

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
  canEditSpecialist: boolean;
}

function SettingsTabs({ activeTab, onChange, canEditSpecialist }: SettingsTabsProps) {
  const tabs: { id: SettingsTab; label: string; disabled?: boolean }[] = [
    { id: "profile", label: "Профиль" },
    { id: "specialist", label: "Специалист", disabled: !canEditSpecialist },
    { id: "notifications", label: "Уведомления" },
    { id: "account", label: "Аккаунт" },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <View style={{ flexDirection: "row" }}>
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active, disabled: t.disabled }}
              onPress={() => {
                if (t.disabled) {
                  Alert.alert(
                    "Недоступно",
                    "Включите режим специалиста на вкладке Профиль, чтобы редактировать профиль специалиста.",
                  );
                  return;
                }
                onChange(t.id);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 2,
                borderBottomColor: active ? colors.accent : "transparent",
                opacity: t.disabled ? 0.45 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: active ? "600" : "500",
                  color: active ? colors.accent : colors.textMuted,
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function UnifiedSettings() {
  const router = useRouter();
  const nav = useTypedRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { ready } = useRequireAuth();
  const { user, isSpecialistUser, isAdminUser, signOut, updateUser } = useAuth();

  // Active tab — initial from ?tab= query, default 'profile'.
  const initialTab: SettingsTab = isValidTab(params.tab) ? params.tab : "profile";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Sync tab from URL when query changes (e.g. browser back/forward).
  useEffect(() => {
    if (isValidTab(params.tab) && params.tab !== activeTab) {
      setActiveTab(params.tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tab]);

  const handleTabChange = useCallback(
    (tab: SettingsTab) => {
      setActiveTab(tab);
      router.setParams({ tab });
    },
    [router],
  );

  // Shared state for name/avatar (always editable).
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatarUrl ?? null
  );
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Specialist-only state (lazy-loaded when section expands).
  const [specData, setSpecData] = useState<SpecialistProfileData | null>(null);
  const [specLoading, setSpecLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [contacts, setContacts] = useState<ContactMethodItem[]>([]);
  const [addingContact, setAddingContact] = useState(false);
  const [newContactType, setNewContactType] = useState("phone");
  const [newContactValue, setNewContactValue] = useState("");
  const [contactSaving, setContactSaving] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Notification preferences — MVP is local-state only (SA email-only).
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setAvatarUrl(user.avatarUrl ?? null);
      setIsAvailable(user.isAvailable ?? false);
    }
  }, [user]);

  const loadSpecialistData = useCallback(async () => {
    setSpecLoading(true);
    try {
      const [profile, contactsData] = await Promise.all([
        apiGet<SpecialistProfileData>("/api/specialist/profile"),
        apiGet<{ items: ContactMethodItem[] }>("/api/profile/contacts"),
      ]);
      setSpecData(profile);
      setIsAvailable(profile.isAvailable);
      if (profile.profile) {
        setDescription(profile.profile.description ?? "");
        setOfficeAddress(profile.profile.officeAddress ?? "");
        setWorkingHours(profile.profile.workingHours ?? "");
      }
      setContacts(contactsData.items);
    } catch (err) {
      console.error("Settings: specialist profile load error", err);
    } finally {
      setSpecLoading(false);
    }
  }, []);

  useEffect(() => {
    // Admin users don't belong here.
    if (ready && isAdminUser) {
      nav.replaceRoutes.adminSettings();
      return;
    }
    // Load specialist profile for any non-admin user. Returning specialists
    // who toggled off keep their FNS data — we need it to skip onboarding
    // when they re-enable from client mode.
    if (ready && !isAdminUser) {
      loadSpecialistData();
    }
  }, [ready, isAdminUser, loadSpecialistData, router]);

  // If user lands on specialist tab but mode is off, fall back to profile.
  useEffect(() => {
    if (activeTab === "specialist" && !isSpecialistUser && ready) {
      // We still allow viewing the empty-state hint, so don't auto-redirect.
      // The tab itself is disabled in the switcher, but a deeplink may bring
      // them here — rendering the EmptyState keeps the link non-broken.
    }
  }, [activeTab, isSpecialistUser, ready]);

  const initials = [firstName, lastName]
    .map((n) => n?.charAt(0)?.toUpperCase())
    .filter(Boolean)
    .join("");

  // Per-tab change tracking.
  const hasProfileChanges = useMemo(
    () =>
      firstName !== (user?.firstName ?? "") ||
      lastName !== (user?.lastName ?? "") ||
      avatarUrl !== (user?.avatarUrl ?? null),
    [firstName, lastName, avatarUrl, user?.firstName, user?.lastName, user?.avatarUrl],
  );

  const hasSpecialistChanges = useMemo(
    () =>
      !!specData &&
      (description !== (specData.profile?.description ?? "") ||
        officeAddress !== (specData.profile?.officeAddress ?? "") ||
        workingHours !== (specData.profile?.workingHours ?? "")),
    [specData, description, officeAddress, workingHours],
  );

  const showSaveBar =
    (activeTab === "profile" && hasProfileChanges) ||
    (activeTab === "specialist" && hasSpecialistChanges);

  const handleSaveClient = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const body: Record<string, string | null> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      if (avatarUrl !== (user?.avatarUrl ?? null)) {
        body.avatarUrl = avatarUrl;
      }
      const res = await apiPatch<{
        user: { firstName: string; lastName: string; avatarUrl?: string | null };
      }>("/api/user/profile", body);
      updateUser({
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        avatarUrl: res.user.avatarUrl,
      });
      Alert.alert("Готово", "Изменения сохранены");
    } catch (err) {
      console.error("Save profile error:", err);
      Alert.alert(
        "Ошибка сохранения",
        "Не удалось сохранить изменения. Попробуйте ещё раз."
      );
    } finally {
      setSaving(false);
    }
  }, [saving, firstName, lastName, avatarUrl, user?.avatarUrl, updateUser]);

  const handleSaveSpecialist = useCallback(async () => {
    if (!firstName.trim() || firstName.trim().length < 2) {
      Alert.alert("Ошибка", "Имя должно быть от 2 до 50 символов");
      return;
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      Alert.alert("Ошибка", "Фамилия должна быть от 2 до 50 символов");
      return;
    }
    setSaving(true);
    try {
      await apiPatch("/api/specialist/profile", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarUrl: avatarUrl || null,
        description: description.trim() || null,
        officeAddress: officeAddress.trim() || null,
        workingHours: workingHours.trim() || null,
      });
      updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarUrl: avatarUrl || null,
      });
      await loadSpecialistData();
      Alert.alert("Сохранено", "Профиль обновлён");
    } catch {
      Alert.alert("Ошибка", "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }, [
    firstName,
    lastName,
    avatarUrl,
    description,
    officeAddress,
    workingHours,
    updateUser,
    loadSpecialistData,
  ]);

  // Save handler chosen by active tab. For profile tab — specialists still
  // route through specialist save (it patches name/avatar consistently).
  const handleSave = useCallback(() => {
    if (activeTab === "specialist") return handleSaveSpecialist();
    if (activeTab === "profile") {
      return isSpecialistUser ? handleSaveSpecialist() : handleSaveClient();
    }
    return undefined;
  }, [activeTab, isSpecialistUser, handleSaveClient, handleSaveSpecialist]);

  const applyAvailabilityChange = async (value: boolean) => {
    setIsAvailable(value);
    setAvailabilityLoading(true);
    try {
      await apiPatch("/api/specialist/profile", { isAvailable: value });
      updateUser({ isAvailable: value });
    } catch {
      setIsAvailable(!value);
      Alert.alert("Ошибка", "Не удалось обновить статус доступности");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleToggleAvailable = (value: boolean) => {
    if (availabilityLoading) return;
    if (isAvailable && !value) {
      Alert.alert(
        "Скрыть профиль из каталога?",
        "Новые клиенты не смогут вас найти. Существующие переписки сохранятся, и вы сможете отвечать как обычно. Включить обратно — в любой момент.",
        [
          { text: "Отмена", style: "cancel" },
          {
            text: "Скрыть",
            style: "destructive",
            onPress: () => {
              void applyAvailabilityChange(value);
            },
          },
        ],
      );
      return;
    }
    void applyAvailabilityChange(value);
  };

  const handleLogout = useCallback(() => {
    Alert.alert("Выйти из аккаунта", "Вы уверены, что хотите выйти?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          await signOut();
          nav.replaceRoutes.home();
        },
      },
    ]);
  }, [signOut, router]);

  // Soft-delete the account: anonymize PII server-side, sign out everywhere,
  // navigate to home. The DB row is preserved so threads/messages keep
  // referencing a valid user — other participants will see "Аккаунт удалён".
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Удалить аккаунт навсегда?",
      "Аккаунт будет анонимизирован и скрыт. Восстановление невозможно. История переписок останется у других участников.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            const email = user?.email;
            if (!email) {
              Alert.alert("Ошибка", "Не удалось определить email аккаунта");
              return;
            }
            try {
              await apiPost("/api/account/delete", { confirm: email });
              await signOut();
              nav.replaceRoutes.home();
            } catch (err) {
              console.error("delete account error:", err);
              Alert.alert(
                "Ошибка",
                "Не удалось удалить аккаунт. Попробуйте ещё раз."
              );
            }
          },
        },
      ]
    );
  }, [user?.email, signOut, nav]);

  // Toggle specialist mode on/off.
  // ON → if no FNS data configured yet, redirect to work-area; otherwise enable directly.
  // OFF → confirmation then API call.
  const handleToggleSpecialist = useCallback(
    (value: boolean) => {
      if (value) {
        // Enable: if specialist has no FNS/services yet, go configure them first.
        const hasData = specData && specData.fnsServices.length > 0;
        if (!hasData) {
          nav.any("/onboarding/work-area?from=settings");
          return;
        }
        // Already has data — just re-enable, then refresh profile so the
        // settings panel reflects current FNS/services/contacts immediately.
        apiPost("/api/user/leave-specialist-toggle", { enable: true })
          .then(async () => {
            updateUser({ isSpecialist: true });
            await loadSpecialistData();
          })
          .catch(() => Alert.alert("Ошибка", "Не удалось включить режим специалиста"));
      } else {
        Alert.alert(
          "Выключить режим специалиста?",
          "Вы исчезнете из каталога, новые заявки не будут поступать. История переписок сохранится.",
          [
            { text: "Отмена", style: "cancel" },
            {
              text: "Выключить",
              style: "destructive",
              onPress: async () => {
                try {
                  await apiPost("/api/user/leave-specialist", {});
                  updateUser({ isSpecialist: false, isAvailable: false });
                  if (activeTab === "specialist") {
                    handleTabChange("profile");
                  }
                } catch {
                  Alert.alert("Ошибка", "Не удалось выключить режим специалиста");
                }
              },
            },
          ]
        );
      }
    },
    [specData, updateUser, loadSpecialistData, router, activeTab, handleTabChange, nav]
  );

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <HeaderBack title="Настройки" />
        <LoadingState variant="skeleton" lines={5} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <HeaderBack title="Настройки" />

      <SettingsTabs
        activeTab={activeTab}
        onChange={handleTabChange}
        canEditSpecialist={isSpecialistUser}
      />

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: showSaveBar ? 96 : 32 }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
        >
          {/* TAB: ПРОФИЛЬ */}
          {activeTab === "profile" && (
            <>
              {/* 1. Личные данные */}
              <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
                <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-4">
                  Личные данные
                </Text>

                <View className="items-center mb-4">
                  <AvatarUploader
                    avatarUrl={avatarUrl}
                    avatarUploading={avatarUploading}
                    initials={initials}
                    onAvatarChange={setAvatarUrl}
                    onUploadStart={() => setAvatarUploading(true)}
                    onUploadEnd={() => setAvatarUploading(false)}
                  />
                  <View className="mt-2">
                    <RoleBadge
                      role={user?.role ?? null}
                      isSpecialist={isSpecialistUser}
                      size="md"
                    />
                  </View>
                </View>

                <View className="mb-3">
                  <Input
                    label="Имя"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Введите имя"
                    maxLength={50}
                  />
                </View>

                <View className="mb-3">
                  <Input
                    label="Фамилия"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Введите фамилию"
                    maxLength={50}
                  />
                </View>

                <Text className="text-sm font-medium text-text-base mb-1.5">
                  Email{" "}
                  <Text className="text-text-mute font-normal">
                    (нельзя изменить)
                  </Text>
                </Text>
                <View className="h-12 border border-border rounded-xl bg-surface2 px-4 justify-center">
                  <Text className="text-base text-text-mute">
                    {user?.email ?? ""}
                  </Text>
                </View>
              </View>

              {/* 2. Режим специалиста — единый тумблер */}
              <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
                <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                  Режим специалиста
                </Text>
                <View className="flex-row items-center justify-between py-2">
                  <View className="flex-1 mr-4">
                    <Text className="text-base font-semibold text-text-base">
                      Я специалист
                    </Text>
                    <Text className="text-xs text-text-mute mt-0.5">
                      {isSpecialistUser
                        ? "Клиенты могут найти вас через каталог"
                        : "Включите, чтобы принимать заявки от клиентов"}
                    </Text>
                  </View>
                  <IosToggle value={isSpecialistUser} onChange={handleToggleSpecialist} />
                </View>

                {isSpecialistUser && (
                  <View className="flex-row items-center justify-between py-2 border-t border-border mt-2">
                    <View className="flex-1 mr-4">
                      <Text className="text-base font-semibold text-text-base">
                        Принимаю заявки
                      </Text>
                      <Text className="text-xs text-text-mute mt-0.5">
                        {isAvailable
                          ? "Вы видны клиентам и получаете заявки"
                          : "Вы скрыты от клиентов — новые заявки не поступают"}
                      </Text>
                    </View>
                    {availabilityLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <IosToggle value={isAvailable} onChange={handleToggleAvailable} />
                    )}
                  </View>
                )}
              </View>
            </>
          )}

          {/* TAB: СПЕЦИАЛИСТ */}
          {activeTab === "specialist" && (
            <>
              {!isSpecialistUser ? (
                <View className="bg-white border border-border rounded-2xl px-5 py-8 mb-4 items-center">
                  <Text className="text-base font-semibold text-text-base mb-2 text-center">
                    Режим специалиста выключен
                  </Text>
                  <Text className="text-sm text-text-mute text-center mb-4">
                    Включите его на вкладке Профиль, чтобы редактировать профиль специалиста.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handleTabChange("profile")}
                    className="px-4 py-2 rounded-xl bg-accent-soft"
                  >
                    <Text className="text-sm font-medium text-accent">
                      Перейти на Профиль
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  {/* Описание */}
                  <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
                    <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                      О себе
                    </Text>
                    <Input
                      label="Описание"
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Расскажите о своём опыте и специализации..."
                      multiline
                      numberOfLines={4}
                      maxLength={500}
                    />
                    <Text className="text-xs text-text-dim text-right mt-1">
                      {description.length}/500
                    </Text>
                  </View>

                  {/* ИФНС и услуги */}
                  <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
                    <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                      ИФНС и услуги
                    </Text>
                    {specLoading ? (
                      <LoadingState variant="skeleton" lines={3} />
                    ) : specData && specData.fnsServices.length === 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Добавить рабочую зону"
                        onPress={() =>
                          nav.any("/onboarding/work-area?from=settings")
                        }
                        className="flex-row items-center justify-center py-3 border border-dashed border-border rounded-xl"
                      >
                        <Text className="text-sm text-accent font-medium">
                          + Добавить ИФНС и услуги
                        </Text>
                      </Pressable>
                    ) : (
                      <>
                        {specData?.fnsServices.map((item) => (
                          <View
                            key={item.fns.id}
                            className="bg-surface2 rounded-xl p-3 mb-2 border border-border"
                          >
                            <Text className="text-sm font-semibold text-text-base">
                              {item.city.name} — {item.fns.name}
                            </Text>
                            <Text className="text-xs text-text-mute mb-1">
                              {item.fns.code}
                            </Text>
                            <View className="flex-row flex-wrap gap-1 mt-1">
                              {item.services.map((s) => (
                                <View
                                  key={s.id}
                                  className="bg-accent-soft px-2.5 py-0.5 rounded-full"
                                >
                                  <Text className="text-xs font-medium text-accent">
                                    {s.name}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Изменить рабочую зону"
                          onPress={() =>
                            nav.any("/onboarding/work-area?from=settings")
                          }
                          className="flex-row items-center justify-center py-2 mt-1"
                        >
                          <Pencil size={13} color={colors.accent} />
                          <Text className="text-sm text-accent ml-1.5 font-medium">
                            Изменить рабочую зону
                          </Text>
                        </Pressable>
                      </>
                    )}
                  </View>

                  {/* Контакты */}
                  <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
                    <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                      Контакты
                    </Text>
                    <ContactMethodsList
                      contacts={contacts}
                      addingContact={addingContact}
                      newContactType={newContactType}
                      newContactValue={newContactValue}
                      contactSaving={contactSaving}
                      showTypePicker={showTypePicker}
                      onContactsChange={setContacts}
                      onAddingContactChange={setAddingContact}
                      onNewContactTypeChange={setNewContactType}
                      onNewContactValueChange={setNewContactValue}
                      onContactSavingChange={setContactSaving}
                      onShowTypePickerChange={setShowTypePicker}
                    />
                  </View>

                  {/* Офис */}
                  <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
                    <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                      Офис
                    </Text>
                    <View className="mb-3">
                      <Input
                        label="Адрес офиса"
                        value={officeAddress}
                        onChangeText={setOfficeAddress}
                        placeholder="Город, улица, дом"
                      />
                    </View>
                    <Input
                      label="Часы работы"
                      value={workingHours}
                      onChangeText={setWorkingHours}
                      placeholder="Пн-Пт 9:00-18:00"
                    />
                  </View>
                </>
              )}
            </>
          )}

          {/* TAB: УВЕДОМЛЕНИЯ */}
          {activeTab === "notifications" && (
            <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
              <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                Уведомления
              </Text>
              <NotificationPreferences
                pushEnabled={pushEnabled}
                emailEnabled={emailEnabled}
                onPushChange={setPushEnabled}
                onEmailChange={setEmailEnabled}
              />
            </View>
          )}

          {/* TAB: АККАУНТ */}
          {activeTab === "account" && (
            <>
              {/* Правовая информация */}
              <View className="bg-white border border-border rounded-2xl px-4 py-4 mb-4 overflow-hidden">
                <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-2">
                  Правовая информация
                </Text>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Правовые документы"
                  onPress={() => nav.routes.legalIndex()}
                  className="flex-row items-center min-h-[44px]"
                >
                  <FileText size={16} color={colors.placeholder} />
                  <Text className="text-base text-text-base ml-3 flex-1">Правовые документы</Text>
                  <ChevronRight size={14} color={colors.borderLight} />
                </Pressable>
              </View>

              {/* Аккаунт */}
              <View className="bg-white border border-border rounded-2xl px-4 py-4 mb-4 overflow-hidden">
                <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-2">
                  Аккаунт
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Выйти из аккаунта"
                  onPress={handleLogout}
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
                  onPress={handleDeleteAccount}
                  className="flex-row items-center min-h-[44px]"
                >
                  <Trash2 size={16} color={colors.error} />
                  <Text className="text-base text-danger ml-3 flex-1">
                    Удалить аккаунт
                  </Text>
                </Pressable>
                <Text className="text-xs text-text-mute mt-1">
                  Аккаунт будет анонимизирован и скрыт. Восстановление невозможно. История переписок останется у других участников.
                </Text>
              </View>

              <Text className="text-xs text-text-dim text-center mb-4">
                Версия {Constants.expoConfig?.version ?? "1.0.0"}
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      {showSaveBar ? (
        <View
          className="border-t border-border bg-white px-6 py-3 flex-row justify-end items-center"
          style={{
            position: Platform.OS === "web" ? ("sticky" as never) : undefined,
            bottom: 0,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 720,
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <View style={{ minWidth: 180 }}>
              <Button
                label="Сохранить"
                onPress={handleSave}
                disabled={saving}
                loading={saving}
              />
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
