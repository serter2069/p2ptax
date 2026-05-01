import { useState, useCallback } from "react";
import Constants from "expo-constants";
import { View, Text, ScrollView, Pressable, Alert, Platform, useWindowDimensions } from "react-native";
import PageTitle from "@/components/layout/PageTitle";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { ChevronLeft, LogOut, Trash2 } from "lucide-react-native";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { colors } from "@/lib/theme";
import { useSettingsForm, SettingsTab } from "@/lib/useSettingsForm";
import ProfileTab from "@/components/settings/ProfileTab";
import SpecialistTab from "@/components/settings/SpecialistTab";

/**
 * Unified Settings page — tabbed layout (Wave 2/F, refactored Wave 4/J).
 * Tabs: Профиль / Специалист. Notifications and Account tabs removed —
 * logout/delete actions are now inline at the bottom of the page.
 * Form state + per-tab save handlers live in `lib/useSettingsForm`.
 * ADMIN users are redirected to /admin/settings.
 *
 * Issue #1582 — specialist onboarding (work-area step) now renders inline
 * inside this layout instead of redirecting to /onboarding/work-area.
 * Issue #1599 — tabs are hidden while inline onboarding is active so the
 * onboarding content takes the full screen.
 */

const VALID_TABS: SettingsTab[] = ["profile", "specialist"];

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
                  if (Platform.OS === "web") {
                    if (typeof window !== "undefined" && typeof window.alert === "function") {
                      window.alert(
                        "Недоступно\n\nВключите режим специалиста на вкладке Профиль, чтобы редактировать профиль специалиста."
                      );
                    }
                  } else {
                    Alert.alert(
                      "Недоступно",
                      "Включите режим специалиста на вкладке Профиль, чтобы редактировать профиль специалиста.",
                    );
                  }
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
  const params = useLocalSearchParams<{ tab?: string }>();
  const { ready } = useRequireAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Active tab — initial from ?tab= query, default 'profile'.
  const initialTab: SettingsTab = isValidTab(params.tab) ? params.tab : "profile";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const form = useSettingsForm({
    ready,
    activeTab,
    onTabChange: setActiveTab,
    // No inline onboarding — navigate to /onboarding/work-area?from=settings instead.
  });
  const { router, user, isSpecialistUser } = form;

  // Tab state is local — no URL sync to avoid Expo Router setParams reload on web.

  const handleTabChange = useCallback(
    (tab: SettingsTab) => {
      setActiveTab(tab);
    },
    [],
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
        <PageTitle title="Настройки" />
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
      {/* Sticky top header: title left, Save button right */}
      <View
        className="bg-surface2"
        style={
          Platform.OS === "web"
            ? ({ position: "sticky", top: 0, zIndex: 10 } as never)
            : undefined
        }
      >
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 4,
            flexDirection: "row",
            alignItems: "center",
            minHeight: 56,
          }}
        >
          <Text className="text-xl font-bold text-text-base" style={{ flex: 1 }}>
            Настройки
          </Text>
          {form.showSaveBar && (
            <View style={{ minWidth: 140 }}>
              <Button
                label="Сохранить"
                onPress={form.handleSave}
                disabled={form.saving}
                loading={form.saving}
              />
            </View>
          )}
        </View>

        <SettingsTabs
          activeTab={activeTab}
          onChange={handleTabChange}
          canEditSpecialist={isSpecialistUser}
        />
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
                paddingHorizontal: 16,
                paddingTop: 16,
              }}
            >
              {activeTab === "profile" && (
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
                  onAvatarChange={form.setAvatarUrl}
                  onUploadStart={() => form.setAvatarUploading(true)}
                  onUploadEnd={() => form.setAvatarUploading(false)}
                  onToggleSpecialist={form.handleToggleSpecialist}
                  onToggleAvailable={form.handleToggleAvailable}
                />
              )}

              {activeTab === "specialist" && (
                <SpecialistTab
                  isSpecialistUser={isSpecialistUser}
                  specLoading={form.specLoading}
                  specData={form.specData}
                  description={form.description}
                  officeAddress={form.officeAddress}
                  workingHours={form.workingHours}
                  contacts={form.contacts}
                  addingContact={form.addingContact}
                  newContactType={form.newContactType}
                  newContactValue={form.newContactValue}
                  contactSaving={form.contactSaving}
                  showTypePicker={form.showTypePicker}
                  onDescriptionChange={form.setDescription}
                  onOfficeAddressChange={form.setOfficeAddress}
                  onWorkingHoursChange={form.setWorkingHours}
                  onContactsChange={form.setContacts}
                  onAddingContactChange={form.setAddingContact}
                  onNewContactTypeChange={form.setNewContactType}
                  onNewContactValueChange={form.setNewContactValue}
                  onContactSavingChange={form.setContactSaving}
                  onShowTypePickerChange={form.setShowTypePicker}
                  onGoToProfileTab={() => handleTabChange("profile")}
                  onGoToWorkArea={form.handleGoToWorkArea}
                />
              )}

              {/* Logout / Delete — always visible at bottom, replacing the Account tab */}
              <View className="bg-white border border-border rounded-2xl px-4 py-4 mt-2 mb-4 overflow-hidden">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Выйти из аккаунта"
                  onPress={form.handleLogout}
                  className="flex-row items-center min-h-[44px] border-b border-border"
                >
                  <LogOut size={16} color={colors.error} />
                  <Text className="text-base text-danger ml-3 flex-1">Выйти из аккаунта</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Удалить аккаунт"
                  onPress={form.handleDeleteAccount}
                  className="flex-row items-center min-h-[44px]"
                >
                  <Trash2 size={16} color={colors.error} />
                  <Text className="text-base text-danger ml-3 flex-1">Удалить аккаунт</Text>
                </Pressable>
              </View>

              <Text className="text-xs text-text-dim text-center mb-4">
                Версия {Constants.expoConfig?.version ?? "1.0.0"}
              </Text>
          </View>
      </ScrollView>

    </SafeAreaView>
  );
}
