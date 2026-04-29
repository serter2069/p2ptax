import { useState, useEffect, useCallback, useMemo } from "react";
import Constants from "expo-constants";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTypedRouter } from "@/lib/navigation";
import { ChevronLeft } from "lucide-react-native";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { colors } from "@/lib/theme";
import { ContactMethodItem } from "@/components/settings/ContactMethodsList";
import ProfileTab from "@/components/settings/ProfileTab";
import SpecialistTab, {
  SpecialistProfileData,
} from "@/components/settings/SpecialistTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import AccountTab from "@/components/settings/AccountTab";

/**
 * Unified Settings page — tabbed layout (Wave 2/F, refactored Wave 4/J).
 * Tabs: Профиль / Специалист / Уведомления / Аккаунт. Bodies live in
 * `components/settings/{Profile,Specialist,Notifications,Account}Tab.tsx`.
 * ADMIN users are redirected to /admin/settings.
 */

type SettingsTab = "profile" | "specialist" | "notifications" | "account";

const VALID_TABS: SettingsTab[] = ["profile", "specialist", "notifications", "account"];

function isValidTab(value: string | undefined): value is SettingsTab {
  return !!value && (VALID_TABS as string[]).includes(value);
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

  const handleToggleSpecialist = useCallback(
    (value: boolean) => {
      if (value) {
        const hasData = specData && specData.fnsServices.length > 0;
        if (!hasData) {
          nav.any("/onboarding/work-area?from=settings");
          return;
        }
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
          <Text className="text-2xl font-extrabold text-text-base mb-4">Настройки</Text>
        </View>
        <LoadingState variant="skeleton" lines={5} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface2">
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
        <Text className="text-2xl font-extrabold text-text-base mb-3">Настройки</Text>
      </View>

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
          {activeTab === "profile" && (
            <ProfileTab
              firstName={firstName}
              lastName={lastName}
              email={user?.email ?? ""}
              avatarUrl={avatarUrl}
              avatarUploading={avatarUploading}
              initials={initials}
              isSpecialistUser={isSpecialistUser}
              isAvailable={isAvailable}
              availabilityLoading={availabilityLoading}
              role={user?.role ?? null}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onAvatarChange={setAvatarUrl}
              onUploadStart={() => setAvatarUploading(true)}
              onUploadEnd={() => setAvatarUploading(false)}
              onToggleSpecialist={handleToggleSpecialist}
              onToggleAvailable={handleToggleAvailable}
            />
          )}

          {activeTab === "specialist" && (
            <SpecialistTab
              isSpecialistUser={isSpecialistUser}
              specLoading={specLoading}
              specData={specData}
              description={description}
              officeAddress={officeAddress}
              workingHours={workingHours}
              contacts={contacts}
              addingContact={addingContact}
              newContactType={newContactType}
              newContactValue={newContactValue}
              contactSaving={contactSaving}
              showTypePicker={showTypePicker}
              onDescriptionChange={setDescription}
              onOfficeAddressChange={setOfficeAddress}
              onWorkingHoursChange={setWorkingHours}
              onContactsChange={setContacts}
              onAddingContactChange={setAddingContact}
              onNewContactTypeChange={setNewContactType}
              onNewContactValueChange={setNewContactValue}
              onContactSavingChange={setContactSaving}
              onShowTypePickerChange={setShowTypePicker}
              onGoToProfileTab={() => handleTabChange("profile")}
              onGoToWorkArea={() => nav.any("/onboarding/work-area?from=settings")}
            />
          )}

          {activeTab === "notifications" && (
            <NotificationsTab
              emailEnabled={emailEnabled}
              pushEnabled={pushEnabled}
              onEmailChange={setEmailEnabled}
              onPushChange={setPushEnabled}
            />
          )}

          {activeTab === "account" && (
            <AccountTab
              appVersion={Constants.expoConfig?.version ?? "1.0.0"}
              onLogout={handleLogout}
              onDeleteAccount={handleDeleteAccount}
              onLegal={() => nav.routes.legalIndex()}
            />
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
