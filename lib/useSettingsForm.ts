import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useTypedRouter } from "@/lib/navigation";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { ContactMethodItem } from "@/components/settings/ContactMethodsList";
import type { SpecialistProfileData } from "@/components/settings/SpecialistTab";

export type SettingsTab = "profile" | "specialist" | "notifications" | "account";

interface UseSettingsFormArgs {
  ready: boolean;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

/**
 * Holds all settings-form state, dirty tracking and per-tab save handlers.
 * The shell (`app/settings/index.tsx`) uses this to keep its own surface
 * focused on layout, deeplink parsing and tab rendering.
 */
export function useSettingsForm({ ready, activeTab, onTabChange }: UseSettingsFormArgs) {
  const router = useRouter();
  const nav = useTypedRouter();
  const { user, isSpecialistUser, isAdminUser, signOut, updateUser } = useAuth();

  // Shared profile fields (always editable).
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Specialist-only state.
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

  // Sync local fields when user object updates (login/refresh).
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
  }, [ready, isAdminUser, loadSpecialistData, nav]);

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
        "Не удалось сохранить изменения. Попробуйте ещё раз.",
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

  const applyAvailabilityChange = useCallback(
    async (value: boolean) => {
      setAvailabilityLoading(true);
      try {
        await apiPatch("/api/specialist/profile", { isAvailable: value });
        setIsAvailable(value);
        updateUser({ isAvailable: value });
      } catch {
        Alert.alert("Ошибка", "Не удалось обновить статус доступности");
      } finally {
        setAvailabilityLoading(false);
      }
    },
    [updateUser],
  );

  const handleToggleAvailable = useCallback(
    (value: boolean) => {
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
    },
    [availabilityLoading, isAvailable, applyAvailabilityChange],
  );

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
  }, [signOut, nav]);

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
                "Не удалось удалить аккаунт. Попробуйте ещё раз.",
              );
            }
          },
        },
      ],
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
          .catch(() =>
            Alert.alert("Ошибка", "Не удалось включить режим специалиста"),
          );
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
                    onTabChange("profile");
                  }
                } catch {
                  Alert.alert("Ошибка", "Не удалось выключить режим специалиста");
                }
              },
            },
          ],
        );
      }
    },
    [specData, updateUser, loadSpecialistData, activeTab, onTabChange, nav],
  );

  return {
    // Auth-derived
    user,
    isSpecialistUser,
    isAdminUser,
    router,
    nav,
    // Profile fields
    firstName,
    setFirstName,
    lastName,
    setLastName,
    avatarUrl,
    setAvatarUrl,
    avatarUploading,
    setAvatarUploading,
    // Save state
    saving,
    showSaveBar,
    handleSave,
    // Specialist state
    specData,
    specLoading,
    description,
    setDescription,
    officeAddress,
    setOfficeAddress,
    workingHours,
    setWorkingHours,
    isAvailable,
    availabilityLoading,
    contacts,
    setContacts,
    addingContact,
    setAddingContact,
    newContactType,
    setNewContactType,
    newContactValue,
    setNewContactValue,
    contactSaving,
    setContactSaving,
    showTypePicker,
    setShowTypePicker,
    // Notifications
    emailEnabled,
    setEmailEnabled,
    pushEnabled,
    setPushEnabled,
    // Action handlers
    handleToggleAvailable,
    handleToggleSpecialist,
    handleLogout,
    handleDeleteAccount,
  };
}
