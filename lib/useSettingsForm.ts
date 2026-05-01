import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useTypedRouter } from "@/lib/navigation";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { ContactMethodItem } from "@/components/settings/ContactMethodsList";
import type { SpecialistProfileData } from "@/components/settings/SpecialistTab";

export type SettingsTab = "profile" | "specialist" | "notifications" | "account";

/** Auto-save indicator state for the merged Profile page (issue: profile-merged). */
export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

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
  // avatarKey: the storage key (e.g. "avatars/uuid.jpg") set after a successful upload.
  // Sent to the profile PATCH so the DB stores the key, not a presigned URL.
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
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

  // Auto-save indicator (issue: profile-merged).
  // `lastSavedAt` is a Date (or null) so the UI can render "Сохранено • N сек назад".
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  // Track the last save attempt so we can offer a Retry button on error.
  const lastSaveRef = useRef<(() => Promise<void>) | null>(null);

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
      if (__DEV__) console.error("Settings: specialist profile load error", err);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isAdminUser, loadSpecialistData]);

  // Per-tab change tracking.
  const hasProfileChanges = useMemo(
    () =>
      firstName !== (user?.firstName ?? "") ||
      lastName !== (user?.lastName ?? "") ||
      // avatarKey is set only after a new upload — use it as the dirty flag for avatar.
      avatarKey !== null ||
      (!avatarKey && avatarUrl !== (user?.avatarUrl ?? null)),
    [firstName, lastName, avatarUrl, avatarKey, user?.firstName, user?.lastName, user?.avatarUrl],
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
      // Send storage key (not presigned URL) to the profile PATCH — key never expires in DB.
      // avatarKey is set by AvatarUploader after a successful upload.
      if (avatarKey !== null) {
        body.avatarUrl = avatarKey;
      } else if (avatarUrl !== (user?.avatarUrl ?? null)) {
        body.avatarUrl = avatarUrl;
      }
      const res = await apiPatch<{
        user: { firstName: string; lastName: string; avatarUrl?: string | null };
      }>("/api/user/profile", body);
      // Clear the pending key after save — the context now holds the fresh presigned URL.
      setAvatarKey(null);
      updateUser({
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        avatarUrl: res.user.avatarUrl,
      });
      if (Platform.OS !== "web") {
        Alert.alert("Готово", "Изменения сохранены");
      }
      // Web: rely on the form transitioning out of dirty state to confirm save
      // (no blocking alert popup).
    } catch (err) {
      if (__DEV__) console.error("Save profile error:", err);
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          window.alert("Ошибка сохранения\n\nНе удалось сохранить изменения. Попробуйте ещё раз.");
        }
      } else {
        Alert.alert(
          "Ошибка сохранения",
          "Не удалось сохранить изменения. Попробуйте ещё раз.",
        );
      }
    } finally {
      setSaving(false);
    }
  }, [saving, firstName, lastName, avatarUrl, user?.avatarUrl, updateUser]);

  const handleSaveSpecialist = useCallback(async () => {
    if (!firstName.trim() || firstName.trim().length < 2) {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          window.alert("Ошибка: имя должно быть от 2 до 50 символов");
        }
      } else {
        Alert.alert("Ошибка", "Имя должно быть от 2 до 50 символов");
      }
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
      if (Platform.OS !== "web") {
        Alert.alert("Сохранено", "Профиль обновлён");
      }
      // Web: form transitions out of dirty state — no blocking alert.
    } catch {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && typeof window.alert === "function") {
          window.alert("Не удалось сохранить");
        }
      } else {
        Alert.alert("Ошибка", "Не удалось сохранить");
      }
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
        if (Platform.OS === "web") {
          if (typeof window !== "undefined" && typeof window.alert === "function") {
            window.alert("Ошибка: не удалось обновить статус доступности");
          }
        } else {
          Alert.alert("Ошибка", "Не удалось обновить статус доступности");
        }
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
        if (Platform.OS === "web") {
          const ok =
            typeof window !== "undefined" && typeof window.confirm === "function"
              ? window.confirm(
                  "Скрыть профиль из каталога?\n\nНовые клиенты не смогут вас найти. Существующие переписки сохранятся, и вы сможете отвечать как обычно. Включить обратно — в любой момент."
                )
              : true;
          if (ok) {
            void applyAvailabilityChange(value);
          }
        } else {
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
        }
        return;
      }
      void applyAvailabilityChange(value);
    },
    [availabilityLoading, isAvailable, applyAvailabilityChange],
  );

  const handleLogout = useCallback(async () => {
    const confirmed = Platform.OS === "web"
      ? window.confirm("Выйти из аккаунта?")
      : await new Promise<boolean>((resolve) =>
          Alert.alert("Выйти из аккаунта", "Вы уверены?", [
            { text: "Отмена", onPress: () => resolve(false), style: "cancel" },
            { text: "Выйти", onPress: () => resolve(true), style: "destructive" },
          ])
        );
    if (!confirmed) return;
    await signOut();
    nav.replaceRoutes.home();
  }, [signOut, nav]);

  const handleDeleteAccount = useCallback(async () => {
    const confirmed = Platform.OS === "web"
      ? window.confirm("Удалить аккаунт? Аккаунт будет анонимизирован. Восстановление невозможно.")
      : await new Promise<boolean>((resolve) =>
          Alert.alert(
            "Удалить аккаунт навсегда?",
            "Аккаунт будет анонимизирован и скрыт. Восстановление невозможно.",
            [
              { text: "Отмена", onPress: () => resolve(false), style: "cancel" },
              { text: "Удалить", onPress: () => resolve(true), style: "destructive" },
            ],
          )
        );
    if (!confirmed) return;
    const email = user?.email;
    if (!email) return;
    try {
      await apiPost("/api/account/delete", { confirm: email });
      await signOut();
      nav.replaceRoutes.home();
    } catch (err) {
      if (__DEV__) console.error("delete account error:", err);
      if (Platform.OS === "web") {
        window.alert("Не удалось удалить аккаунт. Попробуйте ещё раз.");
      } else {
        Alert.alert("Ошибка", "Не удалось удалить аккаунт. Попробуйте ещё раз.");
      }
    }
  }, [user?.email, signOut, nav]);

  const handleToggleSpecialist = useCallback(
    async (value: boolean) => {
      if (value) {
        // Wave 4/profile-merged: never navigate away. We always flip the flag
        // server-side; if the user has no FNS data the inline specialist
        // sections of the merged Profile page guide them to fill it. The
        // sidebar item "Запросы" is added by `buildUserItems(true)` and
        // the inline "Где работаете" picker writes via the existing
        // saveWorkArea() helper.
        try {
          await apiPost("/api/user/leave-specialist-toggle", { enable: true });
          updateUser({ isSpecialist: true });
          await loadSpecialistData();
        } catch {
          if (Platform.OS === "web") {
            window.alert("Не удалось включить режим специалиста");
          } else {
            Alert.alert("Ошибка", "Не удалось включить режим специалиста");
          }
        }
      } else {
        const confirmed = Platform.OS === "web"
          ? window.confirm("Выключить режим специалиста? Вы исчезнете из каталога, новые запросы не будут поступать. История переписок сохранится.")
          : await new Promise<boolean>((resolve) =>
              Alert.alert(
                "Выключить режим специалиста?",
                "Вы исчезнете из каталога, новые запросы не будут поступать. История переписок сохранится.",
                [
                  { text: "Отмена", onPress: () => resolve(false), style: "cancel" },
                  { text: "Выключить", onPress: () => resolve(true), style: "destructive" },
                ],
              )
            );
        if (!confirmed) return;
        try {
          await apiPost("/api/user/leave-specialist", {});
          updateUser({ isSpecialist: false, isAvailable: false });
          if (activeTab === "specialist") {
            onTabChange("profile");
          }
        } catch {
          if (Platform.OS === "web") {
            window.alert("Не удалось выключить режим специалиста");
          } else {
            Alert.alert("Ошибка", "Не удалось выключить режим специалиста");
          }
        }
      }
    },
    [specData, updateUser, loadSpecialistData, activeTab, onTabChange, nav],
  );

  // ---------------------------------------------------------------------
  // Auto-save (issue: profile-merged) — fires from `onBlur` of individual
  // section inputs. Each helper runs the appropriate PATCH and updates the
  // shared `autosaveStatus` indicator. We deliberately do NOT save on every
  // keystroke — only on blur.
  // ---------------------------------------------------------------------

  const runAutosave = useCallback(
    async (fn: () => Promise<void>) => {
      lastSaveRef.current = fn;
      setAutosaveStatus("saving");
      try {
        await fn();
        setAutosaveStatus("saved");
        setLastSavedAt(new Date());
      } catch (err) {
        if (__DEV__) console.error("autosave error:", err);
        setAutosaveStatus("error");
      }
    },
    [],
  );

  /** Save personal data (firstName, lastName, optionally avatar) — used on blur. */
  const autosavePersonal = useCallback(() => {
    return runAutosave(async () => {
      if (!firstName.trim() || firstName.trim().length < 2) {
        // Skip silently when invalid — banner stays "saving" briefly then resets.
        // Throw so runAutosave marks error so the user sees a retry hint.
        throw new Error("Имя должно быть от 2 до 50 символов");
      }
      const body: Record<string, string | null> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      if (avatarKey !== null) {
        body.avatarUrl = avatarKey;
      } else if (avatarUrl !== (user?.avatarUrl ?? null)) {
        body.avatarUrl = avatarUrl;
      }
      const res = await apiPatch<{
        user: { firstName: string; lastName: string; avatarUrl?: string | null };
      }>("/api/user/profile", body);
      setAvatarKey(null);
      updateUser({
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        avatarUrl: res.user.avatarUrl,
      });
    });
  }, [firstName, lastName, avatarUrl, avatarKey, user?.avatarUrl, updateUser, runAutosave]);

  /** Save the specialist "About / Office" fields. */
  const autosaveSpecialistProfile = useCallback(() => {
    return runAutosave(async () => {
      await apiPatch("/api/specialist/profile", {
        description: description.trim() || null,
        officeAddress: officeAddress.trim() || null,
        workingHours: workingHours.trim() || null,
      });
      // Reload to keep `specData` in sync (so dirty-flag math doesn't lie).
      await loadSpecialistData();
    });
  }, [description, officeAddress, workingHours, loadSpecialistData, runAutosave]);

  /** Manual retry for the toast — re-runs the last save attempt. */
  const retryAutosave = useCallback(() => {
    if (lastSaveRef.current) {
      void runAutosave(lastSaveRef.current);
    }
  }, [runAutosave]);

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
    avatarKey,
    setAvatarKey,
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
    handleGoToWorkArea: () => nav.any("/profile?firstTime=true&focus=specialist"),
    // Auto-save (issue: profile-merged)
    autosaveStatus,
    lastSavedAt,
    autosavePersonal,
    autosaveSpecialistProfile,
    retryAutosave,
  };
}
