import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTypedRouter } from "@/lib/navigation";
import { FileText, Shield, ChevronRight, ChevronLeft } from "lucide-react-native";
import { colors } from "@/lib/theme";
import DesktopScreen from "@/components/layout/DesktopScreen";
import PageTitle from "@/components/layout/PageTitle";

const LEGAL_DOCS = [
  {
    icon: FileText,
    title: "Условия использования",
    subtitle: "Правила использования сервиса",
    route: "legalTerms" as const,
  },
  {
    icon: Shield,
    title: "Политика конфиденциальности",
    subtitle: "Как мы обрабатываем ваши данные",
    route: "legalPrivacy" as const,
  },
];

export default function LegalIndexPage() {
  const nav = useTypedRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface2" edges={["top"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* House rule: legal prose caps at 720 (CLAUDE.md). */}
        <DesktopScreen maxWidth={720}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Назад"
            onPress={() => nav.back()}
            className="flex-row items-center mb-4"
          >
            <ChevronLeft size={20} color={colors.primary} />
            <Text className="text-sm font-medium text-accent ml-1">Назад</Text>
          </Pressable>

          <PageTitle title="Правовая информация" subtitle="Документы и соглашения P2PTax" />

          <View className="bg-white border border-border rounded-2xl overflow-hidden">
            {LEGAL_DOCS.map((doc, idx) => {
              const Icon = doc.icon;
              return (
                <Pressable
                  key={doc.route}
                  accessibilityRole="link"
                  accessibilityLabel={doc.title}
                  onPress={() => nav.routes[doc.route]()}
                  className={`flex-row items-center px-4 min-h-[60px] ${idx > 0 ? "border-t border-border" : ""}`}
                >
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: colors.accentSoft }}
                  >
                    <Icon size={18} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base text-text-base font-medium">{doc.title}</Text>
                    <Text className="text-xs text-text-mute mt-0.5">{doc.subtitle}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.borderLight} />
                </Pressable>
              );
            })}
          </View>

          <Text className="text-xs text-text-mute text-center mt-8 px-4">
            © {new Date().getFullYear()} P2PTax. Все права защищены.
          </Text>
        </DesktopScreen>
      </ScrollView>
    </SafeAreaView>
  );
}
