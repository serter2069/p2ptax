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
      "Настоящая Политика конфиденциальности описывает, как P2PTax собирает, использует и защищает ваши персональные данные при использовании нашей платформы.",
  },
  {
    id: "collected",
    title: "1. Собираемые данные",
    body:
      "Мы собираем данные, которые вы предоставляете при регистрации и использовании платформы: адрес электронной почты, имя, контактную информацию и данные о профессиональной деятельности.",
  },
  {
    id: "usage",
    title: "2. Использование данных",
    body:
      "Данные используются для предоставления и улучшения наших услуг, обработки запросов, отправки уведомлений и обеспечения безопасности платформы.",
  },
  {
    id: "sharing",
    title: "3. Передача данных",
    body:
      "Мы не продаём ваши персональные данные третьим лицам. Данные могут передаваться только поставщикам услуг, обеспечивающим работу платформы, а также по требованию закона.",
  },
  {
    id: "security",
    title: "4. Безопасность",
    body:
      "Мы принимаем разумные меры для защиты ваших данных. Все данные передаются по зашифрованным каналам (TLS/SSL).",
  },
  {
    id: "rights",
    title: "5. Ваши права",
    body:
      "Вы имеете право на доступ, исправление или удаление своих персональных данных. Для этого обратитесь к нам через приложение или по адресу: privacy@p2ptax.ru",
  },
  {
    id: "contact",
    title: "6. Контакты",
    body:
      "По вопросам, связанным с Политикой конфиденциальности, обращайтесь по адресу: privacy@p2ptax.ru",
  },
];

export default function PrivacyPolicyScreen() {
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
          <Text className="text-xl font-bold text-white mb-0.5">Политика конфиденциальности</Text>
          <Text className="text-sm" style={{ color: overlay.white75 }}>Как P2PTax собирает, хранит и защищает ваши данные</Text>
        </View>
      )}

      <View style={isDesktopWeb ? { paddingHorizontal: 0, paddingTop: spacing.xl } : undefined}>
        {isDesktopWeb ? (
          <View style={{ marginBottom: spacing.lg }}>
            <Text className="text-3xl font-bold text-text-base mb-2">
              Политика конфиденциальности
            </Text>
            <Text className="text-base text-text-mute">
              Как P2PTax собирает, хранит и защищает ваши данные
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
            P2PTax — ваши данные под защитой
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface2">
      <HeaderBack title="Политика конфиденциальности" />
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
