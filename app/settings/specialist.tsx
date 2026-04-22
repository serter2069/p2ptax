import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Pencil, Plus, LogOut } from "lucide-react-native";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { apiGet, apiPatch } from "@/lib/api";
import LoadingState from "@/components/ui/LoadingState";
import { colors } from "@/lib/theme";
import AvatarUploader from "@/components/settings/AvatarUploader";
import ContactMethodsList, { ContactMethodItem } from "@/components/settings/ContactMethodsList";
import NotificationPreferences from "@/components/settings/NotificationPreferences";

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

export default function SpecialistSettings() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 640;
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { user, updateUser, signOut } = useAuth();
  const [data, setData] = useState<SpecialistProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [description, setDescription] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);

  // Notification toggles (local state)
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // ContactMethod state
  const [contacts, setContacts] = useState<ContactMethodItem[]>([]);
  const [addingContact, setAddingContact] = useState(false);
  const [newContactType, setNewContactType] = useState("phone");
  const [newContactValue, setNewContactValue] = useState("");
  const [contactSaving, setContactSaving] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const [profile, contactsData] = await Promise.all([
        apiGet<SpecialistProfileData>("/api/specialist/profile"),
        apiGet<{ items: ContactMethodItem[] }>("/api/profile/contacts"),
      ]);
      setData(profile);
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setAvatarUrl(profile.avatarUrl || null);
      setIsAvailable(profile.isAvailable);
      if (profile.profile) {
        setDescription(profile.profile.description || "");
        setOfficeAddress(profile.profile.officeAddress || "");
        setWorkingHours(profile.profile.workingHours || "");
      }
      setContacts(contactsData.items);
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const handleSave = async () => {
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
      Alert.alert("Сохранено", "Профиль обновлён");
    } catch {
      Alert.alert("Ошибка", "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
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
  };

  const initials = [firstName, lastName]
    .map((n) => n?.charAt(0)?.toUpperCase())
    .filter(Boolean)
    .join("");

  if (!ready || loading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <HeaderBack title="Настройки специалиста" />
        <LoadingState variant="skeleton" lines={5} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <HeaderBack title="Настройки специалиста" />
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <ResponsiveContainer>
          <View className="py-6">

            <AvatarUploader
              avatarUrl={avatarUrl}
              avatarUploading={avatarUploading}
              initials={initials}
              onAvatarChange={setAvatarUrl}
              onUploadStart={() => setAvatarUploading(true)}
              onUploadEnd={() => setAvatarUploading(false)}
            />

            {/* Availability toggle */}
            <View className="bg-surface2 border border-border rounded-xl px-4 py-3 mb-6 flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-base font-semibold text-text-base">
                  Принимаю заявки
                </Text>
                <Text className="text-xs text-text-mute mt-0.5">
                  {isAvailable
                    ? "Вы видны клиентам и получаете заявки"
                    : "Вы скрыты от клиентов"}
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

            {/* Name fields */}
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-3">
              Личные данные
            </Text>

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

            {/* Email read-only */}
            <Text className="text-sm font-medium text-text-base mb-1">
              Email{" "}
              <Text className="text-text-mute font-normal">(нельзя изменить)</Text>
            </Text>
            <View className="h-12 border border-border rounded-xl bg-surface2 px-4 justify-center mb-4">
              <Text className="text-base text-text-mute">
                {data?.email || user?.email || ""}
              </Text>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Input
                label="О себе"
                value={description}
                onChangeText={setDescription}
                placeholder="Расскажите о своём опыте и специализации..."
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text className="text-xs text-text-mute text-right mt-1">
                {description.length}/500
              </Text>
            </View>

            {/* FNS & Services */}
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-3">
              ИФНС и услуги
            </Text>

            {data && data.fnsServices.length > 0 ? (
              <>
                {data.fnsServices.map((item) => (
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
                          className="bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100"
                        >
                          <Text className="text-xs text-accent">{s.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Изменить рабочую зону"
                  onPress={() => router.push("/onboarding/work-area" as never)}
                  className="flex-row items-center justify-center py-2 mb-4"
                >
                  <Pencil size={12} color={colors.accent} />
                  <Text className="text-sm text-warning ml-1 font-medium">
                    Изменить рабочую зону
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Добавить рабочую зону"
                onPress={() => router.push("/onboarding/work-area" as never)}
                className="flex-row items-center justify-center py-3 border border-dashed border-slate-300 rounded-xl mb-4"
              >
                <Plus size={14} color={colors.accent} />
                <Text className="text-sm text-warning ml-2 font-medium">
                  Добавить ИФНС и услуги
                </Text>
              </Pressable>
            )}

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

            {/* Office info */}
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-3 mt-2">
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

            <View className="mb-3">
              <Input
                label="Часы работы"
                value={workingHours}
                onChangeText={setWorkingHours}
                placeholder="Пн-Пт 9:00-18:00"
              />
            </View>

            {/* Save button */}
            <View className="mt-2 mb-4">
              <Button
                label="Сохранить"
                onPress={handleSave}
                disabled={saving}
                loading={saving}
              />
            </View>

            <NotificationPreferences
              pushEnabled={pushEnabled}
              emailEnabled={emailEnabled}
              onPushChange={setPushEnabled}
              onEmailChange={setEmailEnabled}
            />

            {/* Account */}
            <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-3">
              Аккаунт
            </Text>

            <View className="bg-white border border-border rounded-xl mb-8 overflow-hidden">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Выйти из аккаунта"
                onPress={handleLogout}
                className="flex-row items-center px-4 py-3"
              >
                <LogOut size={16} color={colors.error} />
                <Text className="text-base text-danger ml-3 flex-1">
                  Выйти из аккаунта
                </Text>
              </Pressable>
            </View>

            <Text className="text-xs text-text-mute text-center mb-4">
              Версия 1.0.0
            </Text>

          </View>
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
