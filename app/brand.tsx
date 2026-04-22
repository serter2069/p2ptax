import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
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
import { colors, tw, typography, spacing, radius } from "../lib/theme";

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
  const [inputDefault, setInputDefault] = useState("");
  const [inputFocused, setInputFocused] = useState("ivan@mail.ru");
  const [inputError, setInputError] = useState("not-email");
  const [inputIcon, setInputIcon] = useState("");

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
          <Text className="text-xs font-semibold text-text-mute mb-2 uppercase tracking-wide">
            Base
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-4">
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

          <Text className="text-xs font-semibold text-text-mute mb-2 uppercase tracking-wide">
            Semantic
          </Text>
          <View className="flex-row gap-3">
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
          <View className="gap-3">
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
          <View className="gap-2">
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
          <View className="gap-3">
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
          <View className="gap-3">
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
          <View className="gap-3">
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
          <View className="flex-row items-end gap-5">
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
          <View className="flex-row flex-wrap items-center gap-3">
            <Badge variant="error" label="Ошибка" />
            <Badge variant="success" label="Успех" />
            <Badge variant="warning" label="Внимание" />
            <Badge variant="info" label="Информация" />
            <Badge variant="error" label="sm" size="sm" />
            <Badge variant="info" label="sm" size="sm" />
          </View>
        </Section>

        {/* ====== STATES ====== */}
        <Section title="States">
          <View className="mb-3">
            <EmptyState
              icon={FileText}
              title="Нет заявок"
              subtitle="Создайте первую заявку"
              actionLabel="Создать"
              onAction={() => {}}
            />
          </View>

          <View className="mb-3">
            <ErrorState
              message="Ошибка загрузки"
              onRetry={() => {}}
            />
          </View>

          <View className="mb-3">
            <LoadingState variant="spinner" />
          </View>

          <Card>
            <LoadingState variant="skeleton" lines={3} />
          </Card>
        </Section>

        {/* ====== HEADERS ====== */}
        <Section title="Headers">
          <View className="mb-3">
            <HeaderBack title="Header-Back" />
          </View>
          <View className="mb-3">
            <HeaderHome notificationCount={2} />
          </View>
        </Section>
      </View>
      </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
