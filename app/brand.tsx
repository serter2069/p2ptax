import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-10">
      <Text className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">{title}</Text>
      {children}
    </View>
  );
}

export default function BrandScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 pb-20">
        <Text className="text-2xl font-bold text-slate-900 mb-1">P2PTax</Text>
        <Text className="text-sm text-slate-400 mb-8">Navy + Gold · 9 tokens</Text>

        {/* ====== COLORS ====== */}
        <Section title="Colors">
          <Text className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Base (6)</Text>
          <View className="flex-row flex-wrap gap-3 mb-4">
            <View className="w-[30%]">
              <View className="h-20 rounded-lg bg-blue-900" />
              <Text className="text-xs font-bold text-slate-900 mt-1">primary</Text>
              <Text className="text-xs text-slate-400">blue-900</Text>
            </View>
            <View className="w-[30%]">
              <View className="h-20 rounded-lg bg-slate-900" />
              <Text className="text-xs font-bold text-slate-900 mt-1">primary-dark</Text>
              <Text className="text-xs text-slate-400">slate-900</Text>
            </View>
            <View className="w-[30%]">
              <View className="h-20 rounded-lg bg-amber-700" />
              <Text className="text-xs font-bold text-slate-900 mt-1">accent</Text>
              <Text className="text-xs text-slate-400">amber-700</Text>
            </View>
            <View className="w-[30%]">
              <View className="h-20 rounded-lg bg-white border border-slate-200" />
              <Text className="text-xs font-bold text-slate-900 mt-1">background</Text>
              <Text className="text-xs text-slate-400">white</Text>
            </View>
            <View className="w-[30%]">
              <View className="h-20 rounded-lg bg-slate-50 border border-slate-100" />
              <Text className="text-xs font-bold text-slate-900 mt-1">surface</Text>
              <Text className="text-xs text-slate-400">slate-50</Text>
            </View>
            <View className="w-[30%]">
              <View className="h-20 rounded-lg bg-slate-900" />
              <Text className="text-xs font-bold text-slate-900 mt-1">text-primary</Text>
              <Text className="text-xs text-slate-400">slate-900</Text>
            </View>
          </View>

          <Text className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Semantic (3)</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <View className="h-16 rounded-lg bg-red-600" />
              <Text className="text-xs font-bold text-slate-900 mt-1">error</Text>
              <Text className="text-xs text-slate-400">red-600</Text>
            </View>
            <View className="flex-1">
              <View className="h-16 rounded-lg bg-emerald-600" />
              <Text className="text-xs font-bold text-slate-900 mt-1">success</Text>
              <Text className="text-xs text-slate-400">emerald-600</Text>
            </View>
            <View className="flex-1">
              <View className="h-16 rounded-lg bg-amber-500" />
              <Text className="text-xs font-bold text-slate-900 mt-1">warning</Text>
              <Text className="text-xs text-slate-400">amber-500</Text>
            </View>
          </View>
        </Section>

        {/* ====== TYPOGRAPHY ====== */}
        <Section title="Typography">
          <View className="gap-3">
            <View className="pb-3 border-b border-slate-100">
              <Text className="text-xs text-amber-700 font-bold mb-1">h1 · 24px bold</Text>
              <Text className="text-2xl font-bold text-slate-900">Найдите налогового специалиста</Text>
            </View>
            <View className="pb-3 border-b border-slate-100">
              <Text className="text-xs text-amber-700 font-bold mb-1">h2 · 20px semibold</Text>
              <Text className="text-xl font-semibold text-slate-900">Мои заявки</Text>
            </View>
            <View className="pb-3 border-b border-slate-100">
              <Text className="text-xs text-amber-700 font-bold mb-1">h3 · 18px semibold</Text>
              <Text className="text-lg font-semibold text-slate-900">Камеральная проверка</Text>
            </View>
            <View className="pb-3 border-b border-slate-100">
              <Text className="text-xs text-amber-700 font-bold mb-1">body · 16px</Text>
              <Text className="text-base text-slate-900">Требуется помощь с проверкой за 3 квартал.</Text>
            </View>
            <View className="pb-3 border-b border-slate-100">
              <Text className="text-xs text-amber-700 font-bold mb-1">caption · 14px</Text>
              <Text className="text-sm text-slate-400">3 специалиста · 2 часа назад</Text>
            </View>
            <View>
              <Text className="text-xs text-amber-700 font-bold mb-1">small · 12px</Text>
              <Text className="text-xs text-slate-400">ИФНС №15 · Москва</Text>
            </View>
          </View>
        </Section>

        {/* ====== SPACING ====== */}
        <Section title="Spacing">
          <View className="gap-2">
            {[
              { name: "xs", size: "4px", cls: "w-4" },
              { name: "sm", size: "8px", cls: "w-8" },
              { name: "md", size: "16px", cls: "w-16" },
              { name: "lg", size: "24px", cls: "w-24" },
              { name: "xl", size: "32px", cls: "w-32" },
            ].map((s) => (
              <View key={s.name} className="flex-row items-center gap-3">
                <Text className="text-xs text-slate-400 w-6">{s.name}</Text>
                <View className={`h-4 rounded bg-blue-900 ${s.cls}`} />
                <Text className="text-xs text-slate-400">{s.size}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* ====== BUTTONS ====== */}
        <Section title="Buttons">
          <View className="gap-3">
            <Pressable className="h-12 rounded-xl bg-blue-900 items-center justify-center active:bg-slate-900">
              <Text className="text-white text-base font-semibold">Primary — Создать заявку</Text>
            </Pressable>
            <Pressable className="h-12 rounded-xl bg-blue-900 items-center justify-center opacity-50">
              <Text className="text-white text-base font-semibold">Primary Disabled</Text>
            </Pressable>
            <Pressable className="h-12 rounded-xl bg-amber-700 items-center justify-center active:bg-amber-800">
              <Text className="text-white text-base font-semibold">Accent — Написать специалисту</Text>
            </Pressable>
            <Pressable className="h-12 rounded-xl bg-slate-100 items-center justify-center active:bg-slate-200">
              <Text className="text-slate-900 text-base font-semibold">Secondary — Отмена</Text>
            </Pressable>
            <Pressable className="h-12 rounded-xl border border-red-600 items-center justify-center active:bg-red-50">
              <Text className="text-red-600 text-base font-semibold">Destructive — Удалить</Text>
            </Pressable>
          </View>
        </Section>

        {/* ====== INPUTS ====== */}
        <Section title="Inputs">
          <View className="gap-3">
            <View>
              <Text className="text-sm font-medium text-slate-900 mb-1">Default</Text>
              <TextInput
                className="h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-base text-slate-900"
                placeholder="your@email.com"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-slate-900 mb-1">Focused</Text>
              <TextInput
                className="h-12 rounded-xl bg-white border-2 border-blue-900 px-4 text-base text-slate-900"
                value="ivan@mail.ru"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-slate-900 mb-1">Error</Text>
              <TextInput
                className="h-12 rounded-xl bg-red-50 border border-red-600 px-4 text-base text-slate-900"
                value="не-email"
              />
              <Text className="text-xs text-red-600 mt-1">Введите корректный email</Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-slate-900 mb-1">With Icon</Text>
              <View className="flex-row items-center h-12 rounded-xl bg-slate-50 border border-slate-200 px-4">
                <FontAwesome name="search" size={14} color="#94a3b8" />
                <Text className="flex-1 ml-3 text-base text-slate-400">Поиск специалиста...</Text>
              </View>
            </View>
          </View>
        </Section>

        {/* ====== CARDS ====== */}
        <Section title="Cards">
          {/* Request card */}
          <View className="rounded-xl bg-white border border-slate-200 p-4 mb-3">
            <View className="flex-row items-start justify-between mb-2">
              <Text className="text-lg font-semibold text-slate-900 flex-1 mr-2">Камеральная проверка по НДС</Text>
              <View className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                <Text className="text-xs font-semibold text-emerald-700">Активна</Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-1.5 mb-3">
              <View className="flex-row items-center px-2 py-0.5 rounded bg-slate-50">
                <FontAwesome name="map-marker" size={9} color="#94a3b8" />
                <Text className="text-xs text-slate-500 ml-1">Москва</Text>
              </View>
              <View className="px-2 py-0.5 rounded bg-blue-50">
                <Text className="text-xs text-blue-900">Камеральная</Text>
              </View>
            </View>
            <Text className="text-base text-slate-500 mb-3" numberOfLines={2}>
              Требуется помощь с проверкой по НДС за 3 квартал 2025 года.
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <FontAwesome name="comments-o" size={13} color="#94a3b8" />
                <Text className="text-sm text-slate-400 ml-1.5">3 специалиста</Text>
              </View>
              <Text className="text-xs text-slate-400">2 ч назад</Text>
            </View>
          </View>

          {/* Specialist card */}
          <View className="rounded-xl bg-white border border-slate-200 p-4">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Text className="text-base font-bold text-blue-900">ИИ</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-slate-900">Иван Иванов</Text>
                <Text className="text-sm text-slate-400">Москва · 5 ФНС</Text>
              </View>
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </View>
            <Pressable className="h-10 rounded-lg bg-amber-700 items-center justify-center active:bg-amber-800">
              <Text className="text-white text-sm font-semibold">Написать</Text>
            </Pressable>
          </View>
        </Section>

        {/* ====== AVATARS ====== */}
        <Section title="Avatars">
          <View className="flex-row items-end gap-5">
            <View className="items-center">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-xs font-bold text-blue-900">И</Text>
              </View>
              <Text className="text-xs text-slate-400 mt-1">sm 32</Text>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-base font-bold text-blue-900">ИИ</Text>
              </View>
              <Text className="text-xs text-slate-400 mt-1">md 48</Text>
            </View>
            <View className="items-center">
              <View className="w-[72px] h-[72px] rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-2xl font-bold text-blue-900">ИИ</Text>
              </View>
              <Text className="text-xs text-slate-400 mt-1">lg 72</Text>
            </View>
          </View>
        </Section>

        {/* ====== BADGES ====== */}
        <Section title="Badges">
          <View className="flex-row flex-wrap items-center gap-3">
            <View className="min-w-[22px] h-[22px] rounded-full bg-red-600 px-1.5 items-center justify-center">
              <Text className="text-xs font-bold text-white">3</Text>
            </View>
            <View className="px-2.5 py-0.5 rounded-full bg-blue-50">
              <Text className="text-xs font-semibold text-blue-900">Info</Text>
            </View>
            <View className="px-2.5 py-0.5 rounded-full bg-amber-50">
              <Text className="text-xs font-semibold text-amber-700">Warning</Text>
            </View>
          </View>
        </Section>

        {/* ====== STATES ====== */}
        <Section title="States">
          <View className="items-center py-10 mb-3 rounded-xl bg-slate-50">
            <FontAwesome name="file-text-o" size={44} color="#cbd5e1" />
            <Text className="text-base font-semibold text-slate-400 mt-3">Нет заявок</Text>
            <Text className="text-sm text-slate-400 mt-1">Создайте первую заявку</Text>
            <Pressable className="mt-4 px-6 h-10 rounded-lg bg-blue-900 items-center justify-center">
              <Text className="text-sm font-semibold text-white">Создать</Text>
            </Pressable>
          </View>

          <View className="items-center py-10 mb-3 rounded-xl bg-red-50">
            <FontAwesome name="exclamation-circle" size={44} color="#dc2626" />
            <Text className="text-base font-semibold text-red-600 mt-3">Ошибка загрузки</Text>
            <Pressable className="mt-4 px-6 h-10 rounded-lg bg-red-600 items-center justify-center">
              <Text className="text-sm font-semibold text-white">Повторить</Text>
            </Pressable>
          </View>

          <View className="rounded-xl bg-white border border-slate-100 p-4">
            <View className="h-4 w-2/3 rounded bg-slate-200 mb-2" />
            <View className="h-4 w-1/2 rounded bg-slate-100 mb-2" />
            <View className="h-4 w-4/5 rounded bg-slate-200" />
          </View>
        </Section>

        {/* ====== HEADERS ====== */}
        <Section title="Headers">
          <View className="flex-row items-center h-14 bg-white border border-slate-200 rounded-xl px-4 mb-3">
            <FontAwesome name="arrow-left" size={18} color="#0f172a" />
            <Text className="flex-1 text-center text-base font-semibold text-slate-900">Header-Back</Text>
            <View className="w-5" />
          </View>
          <View className="flex-row items-center justify-between h-14 bg-blue-900 rounded-xl px-4 mb-3">
            <Text className="text-lg font-bold text-white">P2PTax</Text>
            <View className="flex-row items-center gap-4">
              <View>
                <FontAwesome name="bell-o" size={18} color="#ffffff" />
                <View className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-amber-500 items-center justify-center">
                  <Text className="text-[9px] font-bold text-white">2</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="flex-row items-center h-14 bg-white border border-slate-200 rounded-xl px-4">
            <FontAwesome name="search" size={14} color="#94a3b8" />
            <Text className="flex-1 ml-3 text-base text-slate-400">Поиск специалиста...</Text>
          </View>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}
