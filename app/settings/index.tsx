import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  LogOut,
  Trash2,
  Bell,
  Pencil,
  Briefcase,
  ChevronRight,
  Palette,
  FileText,
} from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiGet, apiPatch } from "@/lib/api";
import { colors, roleAccent } from "@/lib/theme";
import AvatarUploader from "@/components/settings/AvatarUploader";
import ContactMethodsList, {
  ContactMethodItem,
} from "@/components/settings/ContactMethodsList";
import NotificationPreferences from "@/components/settings/NotificationPreferences";

/**
 * Unified Settings page — iter11 UI layer (PR 2/3).
 *
 * Replaces the old split settings/client.tsx + settings/specialist.tsx. A
 * single progressive page with these sections:
 *   1. Личные данные   — name, email (readonly), avatar — always.
 *   2. Специалист       — progressive:
 *        - isSpecialist=false → Enable CTA → routes to specialist onboarding.
 *        - isSpecialist=true  → full specialist profile editor (description,
 *                               ИФНС/услуги, contacts, office, availability
 *                               toggle).
 *   3. Уведомления      — always.
 *   4. Аккаунт          — sign out, delete, legal.
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

export default function UnifiedSettings() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { user, isSpecialistUser, isAdminUser, signOut, updateUser } = useAuth();

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
      router.replace("/admin/settings" as never);
      return;
    }
    if (ready && isSpecialistUser) {
      loadSpecialistData();
    }
  }, [ready, isSpecialistUser, isAdminUser, loadSpecialistData, router]);

  const initials = [firstName, lastName]
    .map((n) => n?.charAt(0)?.toUpperCase())
    .filter(Boolean)
    .join("");

  const hasChanges = isSpecialistUser
    ? !!specData &&
      (firstName !== (specData.firstName ?? "") ||
        lastName !== (specData.lastName ?? "") ||
        avatarUrl !== (specData.avatarUrl ?? null) ||
        description !== (specData.profile?.description ?? "") ||
        officeAddress !== (specData.profile?.officeAddress ?? "") ||
        workingHours !== (specData.profile?.workingHours ?? ""))
    : firstName !== (user?.firstName ?? "") ||
      lastName !== (user?.lastName ?? "") ||
      avatarUrl !== (user?.avatarUrl ?? null);

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

  const handleSave = isSpecialistUser ? handleSaveSpecialist : handleSaveClient;

  const handleToggleAvailable = async (value: boolean) => {
    if (availabilityLoading) return;
    setIsAvailable(value);
    setAvailabilityLoading(true);
    try {
      await apiPatch("/api/specialist/profile", { isAvailable: value });
      updateUser({ isAvailable: value });
    } catch {
      setIsAvailable(!value);
      Alert.alert("Ошибка", "Не удалось изменить статус");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    Alert.alert("Выйти из аккаунта", "Вы уверены, что хотите выйти?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Выйти",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/" as never);
        },
      },
    ]);
  }, [signOut, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Удалить аккаунт",
      "Это действие необратимо. Все ваши данные будут удалены.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Запрос отправлен",
              "Ваш запрос на удаление аккаунта принят. Мы свяжемся с вами по email."
            );
          },
        },
      ]
    );
  }, []);

  const handleBecomeSpecialist = useCallback(() => {
    // Iter11 PR2 — reuse the existing onboarding flow. PR3 will introduce a
    // first-class /api/user/become-specialist endpoint so existing clients
    // with completed names can opt-in without redoing onboarding/name.
    router.push("/onboarding/name" as never);
  }, [router]);

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 bg-surface2">
        <HeaderBack title="Настройки" />
        <LoadingState variant="skeleton" lines={5} />
      </SafeAreaView>
    );
  }

  const accentKey = isSpecialistUser ? "specialist" : "client";
  const accent = roleAccent[accentKey];

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <HeaderBack title="Настройки" />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: hasChanges ? 96 : 32 }}
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
              <View
                className="mt-2 px-3 py-1 rounded-full"
                style={{ backgroundColor: accent.soft }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: accent.strong }}
                >
                  {isSpecialistUser ? "Специалист" : "Клиент"}
                </Text>
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

          {/* 2. Специалист на платформе — progressive */}
          {!isSpecialistUser ? (
            <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
              <View className="flex-row items-start gap-3">
                <View
                  className="rounded-xl items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: roleAccent.specialist.soft,
                  }}
                >
                  <Briefcase size={18} color={roleAccent.specialist.strong} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-semibold text-text-base mb-1">
                    Специалист на платформе
                  </Text>
                  <Text className="text-sm text-text-mute mb-3">
                    Принимайте заявки от клиентов по налоговым проверкам
                    напрямую. Не нужно становиться специалистом — вы можете
                    остаться обычным пользователем.
                  </Text>
                  <Button
                    label="Включить режим специалиста"
                    onPress={handleBecomeSpecialist}
                  />
                </View>
              </View>
            </View>
          ) : (
            <>
              {/* Активность */}
              <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
                <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                  Режим специалиста
                </Text>
                <View className="flex-row items-center justify-between py-2">
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
                    <Switch
                      accessibilityLabel="Принимаю заявки"
                      value={isAvailable}
                      onValueChange={handleToggleAvailable}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.surface}
                    />
                  )}
                </View>
              </View>

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
                ) : specData && specData.fnsServices.length > 0 ? (
                  <>
                    {specData.fnsServices.map((item) => (
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
                        router.push("/onboarding/work-area" as never)
                      }
                      className="flex-row items-center justify-center py-2 mt-1"
                    >
                      <Pencil size={13} color={colors.accent} />
                      <Text className="text-sm text-accent ml-1.5 font-medium">
                        Изменить рабочую зону
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Добавить рабочую зону"
                    onPress={() =>
                      router.push("/onboarding/work-area" as never)
                    }
                    className="flex-row items-center justify-center py-3 border border-dashed border-border rounded-xl"
                  >
                    <Text className="text-sm text-accent font-medium">
                      + Добавить ИФНС и услуги
                    </Text>
                  </Pressable>
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

          {/* 3. Уведомления (SA: email-only in MVP) */}
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
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Все уведомления"
              onPress={() => router.push("/notifications" as never)}
              className="flex-row items-center py-3 mt-2 border-t border-border"
            >
              <Bell size={16} color={colors.textSecondary} />
              <Text className="flex-1 ml-3 text-sm text-text-base">
                Все уведомления
              </Text>
              <ChevronRight size={14} color={colors.borderLight} />
            </Pressable>
          </View>

          {/* 4. Правовая информация */}
          <View className="bg-white border border-border rounded-2xl px-4 py-4 mb-4 overflow-hidden">
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-2">
              Правовая информация
            </Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Условия использования"
              onPress={() => router.push("/legal/terms" as never)}
              className="flex-row items-center min-h-[44px]"
            >
              <FileText size={16} color={colors.placeholder} />
              <Text className="text-base text-text-base ml-3 flex-1">
                Условия использования
              </Text>
              <ChevronRight size={14} color={colors.borderLight} />
            </Pressable>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Политика конфиденциальности"
              onPress={() => router.push("/legal/privacy" as never)}
              className="flex-row items-center min-h-[44px] border-t border-border"
            >
              <FileText size={16} color={colors.placeholder} />
              <Text className="text-base text-text-base ml-3 flex-1">
                Политика конфиденциальности
              </Text>
              <ChevronRight size={14} color={colors.borderLight} />
            </Pressable>
          </View>

          {/* 5. Аккаунт */}
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
          </View>

          {__DEV__ ? (
            <View className="bg-white border border-border rounded-2xl px-4 py-4 mb-4 overflow-hidden">
              <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-2">
                Разработка
              </Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Design System"
                onPress={() => router.push("/brand" as never)}
                className="flex-row items-center min-h-[44px]"
              >
                <Palette size={16} color={colors.textSecondary} />
                <Text className="text-base text-text-base ml-3 flex-1">
                  Design System
                </Text>
              </Pressable>
            </View>
          ) : null}

          <Text className="text-xs text-text-dim text-center mb-4">
            Версия 1.0.0
          </Text>
        </View>
      </ScrollView>

      {hasChanges ? (
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
