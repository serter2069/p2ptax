import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const COLORS = [
  { name: "primary", value: "#2563EB", tw: "bg-blue-600", usage: "Buttons, links, active tabs" },
  { name: "primary-dark", value: "#1D4ED8", tw: "bg-blue-700", usage: "Button pressed state" },
  { name: "secondary", value: "#F3F4F6", tw: "bg-gray-100", usage: "Secondary buttons, card bg" },
  { name: "background", value: "#FFFFFF", tw: "bg-white", usage: "Page background" },
  { name: "surface", value: "#F9FAFB", tw: "bg-gray-50", usage: "Card bg, input bg" },
  { name: "text-primary", value: "#111827", tw: "text-gray-900", usage: "Headlines, body" },
  { name: "text-secondary", value: "#6B7280", tw: "text-gray-500", usage: "Captions, hints" },
  { name: "text-inverse", value: "#FFFFFF", tw: "text-white", usage: "Text on primary" },
  { name: "border", value: "#E5E7EB", tw: "border-gray-200", usage: "Inputs, dividers" },
  { name: "error", value: "#EF4444", tw: "bg-red-500", usage: "Errors, destructive" },
  { name: "success", value: "#10B981", tw: "bg-emerald-500", usage: "Success messages" },
  { name: "warning", value: "#F59E0B", tw: "bg-amber-500", usage: "Warnings, badges" },
];

const TYPOGRAPHY = [
  { name: "h1", size: "text-3xl", weight: "font-bold", px: "28px / 700", example: "Page Title" },
  { name: "h2", size: "text-xl", weight: "font-semibold", px: "22px / 600", example: "Section Header" },
  { name: "h3", size: "text-lg", weight: "font-semibold", px: "18px / 600", example: "Card Title" },
  { name: "body", size: "text-base", weight: "font-normal", px: "16px / 400", example: "Regular body text for descriptions and content" },
  { name: "caption", size: "text-sm", weight: "font-normal", px: "14px / 400", example: "Secondary info, timestamps" },
  { name: "small", size: "text-xs", weight: "font-normal", px: "12px / 400", example: "Badges, hints" },
];

const SPACING = [
  { name: "xs", value: "4px", tw: "p-1", visual: 4 },
  { name: "sm", value: "8px", tw: "p-2", visual: 8 },
  { name: "md", value: "16px", tw: "p-4", visual: 16 },
  { name: "lg", value: "24px", tw: "p-6", visual: 24 },
  { name: "xl", value: "32px", tw: "p-8", visual: 32 },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-10">
      <Text className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">{title}</Text>
      {children}
    </View>
  );
}

export default function BrandScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 pb-20">
        <Text className="text-3xl font-bold text-gray-900 mb-1">Brand & Design System</Text>
        <Text className="text-base text-gray-500 mb-8">Visual reference for all design tokens</Text>

        {/* COLORS */}
        <Section title="Colors">
          <View className="flex-row flex-wrap gap-3">
            {COLORS.map((c) => (
              <View key={c.name} className="w-[48%] mb-4">
                <View
                  className="h-20 rounded-xl mb-2 border border-gray-200"
                  style={{ backgroundColor: c.value }}
                />
                <Text className="text-sm font-semibold text-gray-900">{c.name}</Text>
                <Text className="text-xs text-gray-500">{c.value}</Text>
                <Text className="text-xs text-blue-600">{c.tw}</Text>
                <Text className="text-xs text-gray-400 mt-0.5">{c.usage}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* TYPOGRAPHY */}
        <Section title="Typography">
          {TYPOGRAPHY.map((t) => (
            <View key={t.name} className="mb-5 pb-4 border-b border-gray-100">
              <View className="flex-row items-baseline justify-between mb-1">
                <Text className="text-sm font-bold text-blue-600">{t.name}</Text>
                <Text className="text-xs text-gray-400">{t.px} | {t.size} {t.weight}</Text>
              </View>
              <Text className={`${t.size} ${t.weight} text-gray-900`}>{t.example}</Text>
            </View>
          ))}
        </Section>

        {/* SPACING */}
        <Section title="Spacing">
          {SPACING.map((s) => (
            <View key={s.name} className="flex-row items-center mb-3">
              <View className="w-16">
                <Text className="text-sm font-semibold text-gray-900">{s.name}</Text>
                <Text className="text-xs text-gray-400">{s.value}</Text>
              </View>
              <View
                className="bg-blue-200 rounded"
                style={{ width: s.visual * 4, height: 24 }}
              />
              <Text className="text-xs text-blue-600 ml-2">{s.tw}</Text>
            </View>
          ))}
        </Section>

        {/* BUTTONS */}
        <Section title="Buttons">
          <View className="gap-3">
            <Pressable className="h-12 rounded-xl bg-blue-600 items-center justify-center active:bg-blue-700">
              <Text className="text-white text-base font-semibold">Primary Button</Text>
            </Pressable>

            <Pressable className="h-12 rounded-xl bg-blue-600 items-center justify-center opacity-50">
              <Text className="text-white text-base font-semibold">Primary Disabled</Text>
            </Pressable>

            <Pressable className="h-12 rounded-xl bg-gray-100 items-center justify-center active:bg-gray-200">
              <Text className="text-gray-900 text-base font-semibold">Secondary Button</Text>
            </Pressable>

            <Pressable className="h-12 rounded-xl border border-red-200 items-center justify-center active:bg-red-50">
              <Text className="text-red-500 text-base font-semibold">Destructive Button</Text>
            </Pressable>

            <Pressable className="h-12 rounded-xl border border-gray-200 items-center justify-center active:bg-gray-50">
              <Text className="text-gray-700 text-base font-semibold">Outline Button</Text>
            </Pressable>
          </View>
        </Section>

        {/* INPUTS */}
        <Section title="Inputs">
          <View className="gap-3">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Default</Text>
              <TextInput
                className="h-12 rounded-xl bg-gray-50 border border-gray-200 px-4 text-base text-gray-900"
                placeholder="Placeholder text"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Focused</Text>
              <TextInput
                className="h-12 rounded-xl bg-gray-50 border-2 border-blue-600 px-4 text-base text-gray-900"
                value="Typed value"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Error</Text>
              <TextInput
                className="h-12 rounded-xl bg-red-50 border border-red-400 px-4 text-base text-gray-900"
                value="Invalid input"
              />
              <Text className="text-xs text-red-500 mt-1">This field is required</Text>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">With icon</Text>
              <View className="flex-row items-center h-12 rounded-xl bg-gray-50 border border-gray-200 px-4">
                <FontAwesome name="search" size={16} color="#9ca3af" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Search..."
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
          </View>
        </Section>

        {/* CARDS */}
        <Section title="Cards">
          <View className="rounded-xl border border-gray-200 p-4 mb-3" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}>
            <Text className="text-lg font-semibold text-gray-900">Card Title</Text>
            <Text className="text-base text-gray-500 mt-1">Card description text goes here with some details about the content.</Text>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 rounded-xl overflow-hidden border border-gray-200">
              <View className="h-28 bg-blue-100 items-center justify-center">
                <FontAwesome name="image" size={28} color="#93c5fd" />
              </View>
              <View className="p-3">
                <Text className="text-sm font-semibold text-gray-900">Listing Card</Text>
                <Text className="text-base font-bold text-blue-600 mt-0.5">$299</Text>
                <View className="flex-row items-center mt-1">
                  <FontAwesome name="map-marker" size={10} color="#9ca3af" />
                  <Text className="text-xs text-gray-400 ml-1">Tbilisi</Text>
                </View>
              </View>
            </View>
            <View className="flex-1 rounded-xl overflow-hidden border border-gray-200">
              <View className="h-28 bg-pink-100 items-center justify-center">
                <FontAwesome name="image" size={28} color="#f9a8d4" />
              </View>
              <View className="p-3">
                <Text className="text-sm font-semibold text-gray-900">Another Card</Text>
                <Text className="text-base font-bold text-blue-600 mt-0.5">$1,450</Text>
                <View className="flex-row items-center mt-1">
                  <FontAwesome name="map-marker" size={10} color="#9ca3af" />
                  <Text className="text-xs text-gray-400 ml-1">Batumi</Text>
                </View>
              </View>
            </View>
          </View>
        </Section>

        {/* AVATARS */}
        <Section title="Avatars">
          <View className="flex-row items-end gap-4">
            <View className="items-center">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-xs font-bold text-blue-600">S</Text>
              </View>
              <Text className="text-xs text-gray-400 mt-1">sm 32px</Text>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-base font-bold text-blue-600">M</Text>
              </View>
              <Text className="text-xs text-gray-400 mt-1">md 48px</Text>
            </View>
            <View className="items-center">
              <View className="w-[72px] h-[72px] rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-2xl font-bold text-blue-600">L</Text>
              </View>
              <Text className="text-xs text-gray-400 mt-1">lg 72px</Text>
            </View>
          </View>
        </Section>

        {/* BADGES */}
        <Section title="Badges">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-2">
              <View className="min-w-[20px] h-5 rounded-full bg-red-500 px-1.5 items-center justify-center">
                <Text className="text-xs font-bold text-white">3</Text>
              </View>
              <Text className="text-sm text-gray-500">Error / unread</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="min-w-[20px] h-5 rounded-full bg-blue-600 px-1.5 items-center justify-center">
                <Text className="text-xs font-bold text-white">12</Text>
              </View>
              <Text className="text-sm text-gray-500">Info</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="min-w-[20px] h-5 rounded-full bg-amber-500 px-1.5 items-center justify-center">
                <Text className="text-xs font-bold text-white">!</Text>
              </View>
              <Text className="text-sm text-gray-500">Warning</Text>
            </View>
          </View>
        </Section>

        {/* STATES */}
        <Section title="States">
          {/* Empty */}
          <View className="items-center py-10 mb-4 rounded-xl bg-gray-50">
            <FontAwesome name="inbox" size={48} color="#d1d5db" />
            <Text className="text-lg font-semibold text-gray-400 mt-3">Empty State</Text>
            <Text className="text-sm text-gray-400 mt-1">Nothing to show here yet</Text>
          </View>

          {/* Error */}
          <View className="items-center py-10 mb-4 rounded-xl bg-red-50">
            <FontAwesome name="exclamation-triangle" size={48} color="#fca5a5" />
            <Text className="text-lg font-semibold text-red-400 mt-3">Error State</Text>
            <Text className="text-sm text-red-400 mt-1">Something went wrong</Text>
            <Pressable className="mt-3 px-6 h-10 rounded-lg bg-red-500 items-center justify-center">
              <Text className="text-sm font-semibold text-white">Retry</Text>
            </Pressable>
          </View>

          {/* Loading skeleton */}
          <View className="rounded-xl border border-gray-100 p-4">
            <Text className="text-sm font-medium text-gray-500 mb-3">Loading Skeleton</Text>
            <View className="h-4 w-3/4 rounded bg-gray-200 mb-2" />
            <View className="h-4 w-1/2 rounded bg-gray-200 mb-2" />
            <View className="h-4 w-5/6 rounded bg-gray-200" />
          </View>
        </Section>

        {/* HEADER PATTERNS */}
        <Section title="Header Patterns">
          {/* Back header */}
          <View className="flex-row items-center h-14 bg-white border border-gray-200 rounded-xl px-4 mb-3">
            <FontAwesome name="arrow-left" size={18} color="#374151" />
            <Text className="flex-1 text-center text-lg font-semibold text-gray-900">Header-Back</Text>
            <View className="w-5" />
          </View>

          {/* Home header */}
          <View className="flex-row items-center justify-between h-14 bg-white border border-gray-200 rounded-xl px-4 mb-3">
            <Text className="text-lg font-bold text-blue-600">Etalon</Text>
            <View className="flex-row items-center gap-3">
              <FontAwesome name="bell-o" size={18} color="#374151" />
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-xs font-bold text-blue-600">U</Text>
              </View>
            </View>
          </View>

          {/* Search header */}
          <View className="flex-row items-center h-14 bg-white border border-gray-200 rounded-xl px-4">
            <FontAwesome name="search" size={16} color="#9ca3af" />
            <Text className="flex-1 ml-3 text-base text-gray-400">Header-Search</Text>
          </View>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}
