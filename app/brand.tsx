import { useState } from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Search, FileText } from "lucide-react-native";
import {
  Button,
  Card,
  Input,
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui";
import HeaderBack from "../components/HeaderBack";
import HeaderHome from "../components/HeaderHome";
import ResponsiveContainer from "../components/ResponsiveContainer";
import { colors, tw, typography, spacing, radius, BREAKPOINT } from "../lib/theme";

// Spacing rhythm is unified on `gap-4` (16px) for all section content. Old
// design had a mix of mb-4 (16), mb-2 (8) and gap-5 (20) on the same level —
// the 16/8/20 trio that auditors flag as inconsistent rhythm. We use 16px
// throughout and rely on `gap` on parents instead of per-child margins, so
// removing/reordering items doesn't break the rhythm.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-10">
      <Text className="text-sm font-semibold text-text-mute uppercase tracking-wider mb-4">
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function BrandScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINT;
  const [inputDefault, setInputDefault] = useState("");
  const [inputFocused, setInputFocused] = useState("ivan@mail.ru");
  const [inputError, setInputError] = useState("not-email");
  const [inputIcon, setInputIcon] = useState("");

  // Issue GH-1293 (regression): /brand must never render in production.
  // The `{__DEV__ && <Stack.Screen />}` gate in `app/_layout.tsx` only hides
  // the route registration — Expo Router file-based routing still discovers
  // `app/brand.tsx` and serves the page. The only bulletproof guard is to
  // short-circuit the component itself when `__DEV__` is false (production
  // builds, staging export, etc). Hooks above this guard so React hook
  // ordering stays stable across renders.
  if (!__DEV__) return null;

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <HeaderBack title="Design System" />
      <ScrollView className="flex-1">
      <ResponsiveContainer>
      <View className="py-6 pb-20">
        <Text className={`${typography.h2} ${tw.text} mb-1`}>P2PTax</Text>
        <Text className={`${typography.small} mb-8`}>Design System</Text>

        {/* ====== COLORS ====== */}
        <Section title="Colors">
          <Text className="text-xs font-semibold text-text-mute mb-4 uppercase tracking-wide">
            Base
          </Text>
          <View className="flex-row flex-wrap gap-4 mb-4">
            {([
              { name: "primary", cls: tw.primary, label: "blue-900" },
              { name: "accent", cls: tw.accent, label: "amber-700" },
              { name: "background", cls: `${tw.background} border border-border`, label: "slate-50" },
              { name: "surface", cls: `${tw.surface} border border-border`, label: "white" },
              { name: "text", cls: "bg-text-base", label: "slate-900" },
              { name: "textSecondary", cls: "bg-text-mute", label: "slate-500" },
            ] as const).map((c) => (
              <View key={c.name} className="w-[30%]">
                <View className={`h-20 ${radius.sm} ${c.cls}`} />
                <Text className="text-xs font-bold text-text-base mt-1">{c.name}</Text>
                <Text className={typography.small}>{c.label}</Text>
              </View>
            ))}
          </View>

          <Text className="text-xs font-semibold text-text-mute mb-4 uppercase tracking-wide">
            Semantic
          </Text>
          <View className="flex-row gap-4">
            {([
              { name: "error", cls: tw.errorBg, label: "red-600" },
              { name: "success", cls: tw.successBg, label: "emerald-600" },
              { name: "warning", cls: tw.warningBg, label: "amber-600" },
            ] as const).map((c) => (
              <View key={c.name} className="flex-1">
                <View className={`h-16 ${radius.sm} ${c.cls}`} />
                <Text className="text-xs font-bold text-text-base mt-1">{c.name}</Text>
                <Text className={typography.small}>{c.label}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* ====== TYPOGRAPHY ====== */}
        <Section title="Typography">
          <View className="gap-4">
            {([
              { key: "h1", label: "h1 · 30px extrabold", example: "Найдите специалиста" },
              { key: "h2", label: "h2 · 24px bold", example: "Мои заявки" },
              { key: "h3", label: "h3 · 18px semibold", example: "Камеральная проверка" },
              { key: "body", label: "body · 16px", example: "Помощь с проверкой за 3 квартал." },
              { key: "caption", label: "caption · 14px", example: "3 специалиста · 2 часа назад" },
              { key: "small", label: "small · 12px", example: "ИФНС №15 · Москва" },
            ] as const).map((t) => (
              <View key={t.key} className="pb-3 border-b border-border">
                <Text className={`text-xs ${tw.accentText} font-bold mb-1`}>{t.label}</Text>
                <Text className={`${typography[t.key]} ${tw.text}`}>{t.example}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* ====== SPACING ====== */}
        <Section title="Spacing">
          <View className="gap-4">
            {(Object.entries(spacing) as [string, number][]).map(([name, size]) => (
              <View key={name} className="flex-row items-center gap-3">
                <Text className="text-xs text-text-mute w-6">{name}</Text>
                <View
                  className={`h-4 ${radius.sm} ${tw.accent}`}
                  style={{ width: size }}
                />
                <Text className={typography.small}>{size}px</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* ====== BUTTONS ====== */}
        <Section title="Buttons">
          <View className="gap-4">
            <Button label="Создать заявку" />
            <Button label="Создать заявку" disabled />
            <Button label="Загрузка..." loading />
            <Button variant="secondary" label="Отмена" />
            <Button variant="destructive" label="Удалить" />
            <Button label="Написать" icon={Mail} />
          </View>
        </Section>

        {/* ====== INPUTS ====== */}
        <Section title="Inputs">
          <View className="gap-4">
            <Input
              label="Email"
              placeholder="your@email.com"
              value={inputDefault}
              onChangeText={setInputDefault}
            />
            <Input
              label="Заполненное поле"
              value={inputFocused}
              onChangeText={setInputFocused}
            />
            <Input
              label="С ошибкой"
              value={inputError}
              onChangeText={setInputError}
              error="Введите корректный email"
            />
            <Input
              label="С иконкой"
              placeholder="Поиск специалиста..."
              value={inputIcon}
              onChangeText={setInputIcon}
              icon={Search}
            />
          </View>
        </Section>

        {/* ====== CARDS ====== */}
        <Section title="Cards">
          <View className="gap-4">
            <Card>
              <Text className={`${typography.h3} ${tw.text} mb-1`}>
                Камеральная проверка по НДС
              </Text>
              <Text className={`${typography.caption} mb-2`}>
                Требуется помощь с проверкой за 3 квартал.
              </Text>
              <Badge variant="success" label="Активна" size="sm" />
            </Card>

            <Card variant="outlined" padding="lg">
              <Text className={`${typography.h3} ${tw.text} mb-1`}>
                Иван Иванов
              </Text>
              <Text className={typography.caption}>Москва · 5 ФНС</Text>
            </Card>
          </View>
        </Section>

        {/* ====== AVATARS ====== */}
        <Section title="Avatars">
          <View className="flex-row items-end gap-4">
            <View className="items-center">
              <Avatar name="Ivan" size="sm" />
              <Text className={`${typography.small} mt-1`}>sm 36</Text>
            </View>
            <View className="items-center">
              <Avatar name="Ivan Ivanov" size="md" />
              <Text className={`${typography.small} mt-1`}>md 44</Text>
            </View>
            <View className="items-center">
              <Avatar name="Ivan Ivanov" size="lg" />
              <Text className={`${typography.small} mt-1`}>lg 64</Text>
            </View>
          </View>
        </Section>

        {/* ====== BADGES ====== */}
        <Section title="Badges">
          <View className="flex-row flex-wrap items-center gap-4">
            <Badge variant="error" label="Ошибка" />
            <Badge variant="success" label="Успех" />
            <Badge variant="warning" label="Внимание" />
            <Badge variant="info" label="Информация" />
            <Badge variant="error" label="sm" size="sm" />
            <Badge variant="info" label="sm" size="sm" />
          </View>
        </Section>

        {/* ====== STATES ====== */}
        {/*
          Audit fix: previous layout used `mb-4` on each child wrapper which
          mixed with the implicit 0px gap of the last child — auditors flagged
          this as inconsistent rhythm at Y~3102. Now we drive spacing from the
          parent `gap-4`, no per-child margins, so adding/removing items keeps
          the 16px rhythm intact.
        */}
        <Section title="States">
          <View className="gap-4">
            <EmptyState
              icon={FileText}
              title="Нет заявок"
              subtitle="Создайте первую заявку"
              actionLabel="Создать"
              onAction={() => {}}
            />
            <ErrorState
              message="Ошибка загрузки"
              onRetry={() => {}}
            />
            <LoadingState variant="spinner" />
            <Card>
              <LoadingState variant="skeleton" lines={3} />
            </Card>
          </View>
        </Section>

        {/* ====== HEADERS ====== */}
        {/*
          Audit fix (Y~3422): same treatment as States — gap-4 on the parent
          replaces per-child mb-4. Single source of spacing truth.
        */}
        <Section title="Headers">
          <View className="gap-4">
            <HeaderBack title="Header-Back" />
            <HeaderHome notificationCount={2} />
          </View>
        </Section>
      </View>
      </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
