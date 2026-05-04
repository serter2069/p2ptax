import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ExternalLink,
  Share2,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react-native";
import { router } from "expo-router";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useTypedRouter } from "@/lib/navigation";
import { useSettingsForm } from "@/lib/useSettingsForm";
import { colors } from "@/lib/theme";
import PageTitle from "@/components/layout/PageTitle";
import LoadingState from "@/components/ui/LoadingState";
import StyledSwitch from "@/components/ui/StyledSwitch";
import SpecialistTab from "@/components/settings/SpecialistTab";
import InlineWorkArea from "@/components/settings/InlineWorkArea";
import { dialog } from "@/lib/dialog";

/**
 * /specialist — dedicated specialist editor (and onboarding hub).
 *
 * Wave 5 split: /profile is now account-only (name, email, avatar,
 * 'Я специалист' toggle, danger zone). All specialist-mode editing
 * — work-area, experience, about, office, contacts, public-profile
 * toggle, preview/share — moved here. The 'Завершить →' CTA on the
 * stranded banner points at /specialist directly.
 *
 * When the user toggles 'Я специалист' OFF (handled in
 * useSettingsForm.handleToggleSpecialist), this page redirects back
 * to /profile so they don't sit on a meaningless editor.
 */
export default function SpecialistEditorPage() {
  const { ready } = useRequireAuth();
  const { user, isSpecialistUser } = useAuth();
  const nav = useTypedRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Reuse the unified settings form so state, autosave + handlers are
  // shared with /profile. activeTab='specialist' makes hasSpecialist
  // Changes light up.
  const [activeTab, setActiveTab] = useState<
    "profile" | "specialist" | "notifications" | "account"
  >("specialist");
  const form = useSettingsForm({
    ready,
    activeTab,
    onTabChange: setActiveTab,
  });

  const [editingWorkArea, setEditingWorkArea] = useState(false);
  const [copied, setCopied] = useState(false);

  // If the user lands here without specialist mode on, send them home.
  // `ready` gates against the brief auth-loading flash where isSpecialist
  // is undefined.
  useEffect(() => {
    if (ready && !isSpecialistUser) {
      nav.replaceRoutes.profile();
    }
  }, [ready, isSpecialistUser, nav]);

  // Auto-open the work-area wizard if this is a fresh specialist with
  // zero entries — same trigger as the StrandedSpecialistBanner CTA.
  useEffect(() => {
    if (
      ready &&
      isSpecialistUser &&
      !form.specLoading &&
      form.specData &&
      form.specData.fnsServices.length === 0
    ) {
      setEditingWorkArea(true);
    }
  }, [ready, isSpecialistUser, form.specLoading, form.specData]);

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
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {
        dialog.alert({
          title: "Не удалось скопировать",
          message: url,
        });
      }
      return;
    }
    // Native: open the share sheet.
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

  if (!ready || form.specLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  const fnsCount = form.specData?.fnsServices.length ?? 0;
  const isPublished =
    form.isAvailable &&
    fnsCount > 0 &&
    !!user?.specialistProfileCompletedAt;

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="w-full self-center"
          style={{
            maxWidth: 720,
            paddingHorizontal: isDesktop ? 0 : 16,
            paddingTop: 8,
          }}
        >
          {/* Back link — explicit on this page so the user knows they're
              one step removed from /profile. */}
          {!isDesktop && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Назад"
              onPress={() => router.back()}
              className="flex-row items-center mb-1 mt-1"
              style={{ minHeight: 44 }}
            >
              <ChevronLeft size={20} color={colors.text} />
              <Text className="text-text-base ml-1">Назад</Text>
            </Pressable>
          )}

          <PageTitle
            title="Профиль специалиста"
            subtitle="Что увидят клиенты, открыв вашу карточку в каталоге"
          />

          {/* === Card 1: Public toggle + preview row ============== */}
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
              {form.availabilityLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <StyledSwitch
                  value={form.isAvailable}
                  onValueChange={form.handleToggleAvailable}
                />
              )}
            </View>
          </View>

          {/* === Card 2-6: Work area + about + experience + office + contacts ==
              SpecialistTab is reused 1:1 — same look the user already
              liked, just lives on its own page now. */}
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
              onGoToProfileTab={() => nav.routes.profile()}
              onGoToWorkArea={() => setEditingWorkArea(true)}
              onSpecialistBlur={form.autosaveSpecialistProfile}
            />
          )}

          {/* === Completion CTAs ====================================
              Always-visible block at the bottom: 'Посмотреть мой
              профиль', 'Скопировать ссылку', 'Перейти к запросам'.
              The user explicitly asked for the 'after onboarding'
              moment to be obvious — they finish editing, then they
              can grab their link or go hunt for requests. */}
          {!editingWorkArea && (
            <View className="bg-white border border-border rounded-2xl px-4 py-5 mb-4">
              <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-3">
                Готово — что дальше
              </Text>
              {!isPublished && (
                <Text className="text-xs text-text-mute leading-5 mb-3">
                  Чтобы попасть в каталог: добавьте хотя бы одну инспекцию
                  и включите «Публичный профиль» сверху.
                </Text>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Посмотреть мой профиль"
                onPress={() =>
                  user?.id && nav.dynamic.specialist(user.id)
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
                  {copied ? (
                    <Check size={16} color={colors.success} />
                  ) : Platform.OS === "web" ? (
                    <Copy size={16} color={colors.accent} />
                  ) : (
                    <Share2 size={16} color={colors.accent} />
                  )}
                  <Text
                    className="text-sm font-semibold ml-2"
                    style={{
                      color: copied ? colors.success : colors.text,
                    }}
                  >
                    {copied
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
                onPress={() => nav.routes.tabsRequests()}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
