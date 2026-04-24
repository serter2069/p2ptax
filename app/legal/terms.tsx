import { useRef } from "react";
import { View, Text, ScrollView, Pressable, useWindowDimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderBack from "@/components/HeaderBack";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import { colors, overlay, spacing } from "@/lib/theme";

interface Section {
  id: string;
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    id: "intro",
    title: "Введение",
    body:
      "Используя приложение P2PTax, вы соглашаетесь с настоящими Условиями использования. Если вы не согласны с ними, пожалуйста, не используйте наши услуги.",
  },
  {
    id: "general",
    title: "1. Общие положения",
    body:
      "P2PTax — платформа для поиска налоговых специалистов и взаимодействия между клиентами и специалистами по налоговым вопросам. Платформа не оказывает налоговые услуги напрямую.",
  },
  {
    id: "registration",
    title: "2. Регистрация",
    body:
      "Для использования платформы необходимо зарегистрироваться, указав действующий адрес электронной почты. Вы несёте ответственность за конфиденциальность своего аккаунта и все действия, совершённые от вашего имени.",
  },
  {
    id: "specialists",
    title: "3. Специалисты",
    body:
      "Специалисты, размещающие информацию о своих услугах на платформе, самостоятельно несут ответственность за достоверность предоставленных данных, квалификацию и качество оказываемых услуг.",
  },
  {
    id: "clients",
    title: "4. Клиенты",
    body:
      "Клиенты самостоятельно выбирают специалистов и несут ответственность за принятые решения. P2PTax не гарантирует результат консультаций и услуг, оказываемых специалистами.",
  },
  {
    id: "forbidden",
    title: "5. Запрещённые действия",
    body:
      "Запрещается: размещение ложной информации, мошенничество, оскорбления, спам, нарушение законодательства РФ, а также любые действия, направленные на нарушение работы платформы.",
  },
  {
    id: "liability",
    title: "6. Ограничение ответственности",
    body:
      "P2PTax предоставляется «как есть». Мы не несём ответственности за косвенные убытки, упущенную выгоду или ущерб, возникший в результате использования платформы или взаимодействия между пользователями.",
  },
  {
    id: "changes",
    title: "7. Изменение условий",
    body:
      "Мы можем обновлять настоящие Условия. Продолжение использования платформы после внесения изменений означает ваше согласие с новыми условиями.",
  },
  {
    id: "contact",
    title: "8. Контакты",
    body:
      "По вопросам, связанным с Условиями использования, обращайтесь по адресу: support@p2ptax.ru",
  },
];

export default function TermsScreen() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 1024;
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  const handleJump = (id: string) => {
    const y = sectionOffsets.current[id];
    if (typeof y === "number" && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 16), animated: true });
    }
  };

  const body = (
    <ScrollView
      ref={scrollRef}
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {!isDesktopWeb && (
        <View style={{ backgroundColor: colors.accent, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 }}>
          <Text className="text-xl font-bold text-white mb-0.5">Пользовательское соглашение</Text>
          <Text className="text-sm" style={{ color: overlay.white75 }}>Условия использования платформы P2PTax</Text>
        </View>
      )}

      <View style={isDesktopWeb ? { paddingHorizontal: 0, paddingTop: spacing.xl } : undefined}>
        {isDesktopWeb ? (
          <View style={{ marginBottom: spacing.lg }}>
            <Text className="text-3xl font-bold text-text-base mb-2">
              Пользовательское соглашение
            </Text>
            <Text className="text-base text-text-mute">
              Условия использования платформы P2PTax
            </Text>
            <Text className="text-xs text-text-dim mt-3">
              Последнее обновление: апрель 2026
            </Text>
          </View>
        ) : (
          <View className="mx-4 mt-4">
            <Text className="text-xs text-text-dim text-center mb-2">
              Последнее обновление: апрель 2026
            </Text>
          </View>
        )}

        <View
          className={isDesktopWeb ? "" : "mx-4 bg-white border border-border rounded-2xl p-6"}
          style={isDesktopWeb ? { maxWidth: 720 } : undefined}
        >
          {SECTIONS.map((section, idx) => (
            <View
              key={section.id}
              onLayout={(e) => {
                sectionOffsets.current[section.id] = e.nativeEvent.layout.y;
              }}
            >
              {idx > 0 && (
                <View
                  className="border-t border-border"
                  style={{ marginVertical: spacing.md }}
                />
              )}
              <Text className="text-base font-semibold text-text-base mb-2">
                {section.title}
              </Text>
              <Text className="text-base text-text-mute leading-7 mb-2">
                {section.body}
              </Text>
            </View>
          ))}

          <Text className="text-xs text-text-dim text-center mt-6">
            P2PTax — безопасная платформа для налоговых вопросов
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <HeaderBack title="Пользовательское соглашение" />
      {isDesktopWeb ? (
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
            gap: spacing.xl,
          }}
        >
          {/* TOC rail */}
          <View style={{ width: 220, paddingTop: spacing.xl }}>
            <Text
              className="text-xs font-semibold uppercase mb-3"
              style={{ color: colors.textMuted, letterSpacing: 1 }}
            >
              Содержание
            </Text>
            <View style={{ gap: 2 }}>
              {SECTIONS.map((section) => (
                <Pressable
                  key={section.id}
                  accessibilityRole="link"
                  accessibilityLabel={section.title}
                  onPress={() => handleJump(section.id)}
                  style={{
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                    borderRadius: 6,
                    minHeight: 32,
                    justifyContent: "center",
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {section.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Reading column — capped at 720px for comfortable line length */}
          <View style={{ flex: 1, maxWidth: 720 }}>{body}</View>
        </View>
      ) : (
        <ResponsiveContainer maxWidth={720}>{body}</ResponsiveContainer>
      )}
    </SafeAreaView>
  );
}
