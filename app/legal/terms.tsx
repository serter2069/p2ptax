import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { colors } from "@/lib/theme";
import ResponsiveContainer from "@/components/ResponsiveContainer";

function SectionHeading({ children }: { children: string }) {
  return (
    <Text className="text-lg font-bold text-slate-900 mt-6 mb-2">
      {children}
    </Text>
  );
}

function Paragraph({ children }: { children: string }) {
  return (
    <Text className="text-base text-slate-500 leading-7 mb-3">{children}</Text>
  );
}

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with close button */}
      <View className="flex-row items-center h-14 bg-white border-b border-slate-200 px-4">
        <View className="flex-1" />
        <Text className="text-base font-semibold text-slate-900">
          Условия использования
        </Text>
        <View className="flex-1 items-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
            onPress={() => router.back()}
            className="w-11 h-11 items-center justify-center"
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <X size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ResponsiveContainer maxWidth={720}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 48 }}
        >
          <Text className="text-sm text-slate-400 mt-4 mb-4">
            Последнее обновление: апрель 2026
          </Text>

          <Paragraph>
            Используя приложение P2PTax, вы соглашаетесь с настоящими Условиями
            использования. Если вы не согласны с ними, пожалуйста, не
            используйте наши услуги.
          </Paragraph>

          <SectionHeading>1. Общие положения</SectionHeading>
          <Paragraph>
            P2PTax — платформа для поиска налоговых специалистов и взаимодействия
            между клиентами и специалистами по налоговым вопросам. Платформа не
            оказывает налоговые услуги напрямую.
          </Paragraph>

          <SectionHeading>2. Регистрация</SectionHeading>
          <Paragraph>
            Для использования платформы необходимо зарегистрироваться, указав
            действующий адрес электронной почты. Вы несёте ответственность за
            конфиденциальность своего аккаунта и все действия, совершённые от
            вашего имени.
          </Paragraph>

          <SectionHeading>3. Специалисты</SectionHeading>
          <Paragraph>
            Специалисты, размещающие информацию о своих услугах на платформе,
            самостоятельно несут ответственность за достоверность предоставленных
            данных, квалификацию и качество оказываемых услуг.
          </Paragraph>

          <SectionHeading>4. Клиенты</SectionHeading>
          <Paragraph>
            Клиенты самостоятельно выбирают специалистов и несут ответственность
            за принятые решения. P2PTax не гарантирует результат консультаций и
            услуг, оказываемых специалистами.
          </Paragraph>

          <SectionHeading>5. Запрещённые действия</SectionHeading>
          <Paragraph>
            Запрещается: размещение ложной информации, мошенничество,
            оскорбления, спам, нарушение законодательства РФ, а также любые
            действия, направленные на нарушение работы платформы.
          </Paragraph>

          <SectionHeading>6. Ограничение ответственности</SectionHeading>
          <Paragraph>
            P2PTax предоставляется «как есть». Мы не несём ответственности за
            косвенные убытки, упущенную выгоду или ущерб, возникший в результате
            использования платформы или взаимодействия между пользователями.
          </Paragraph>

          <SectionHeading>7. Изменение условий</SectionHeading>
          <Paragraph>
            Мы можем обновлять настоящие Условия. Продолжение использования
            платформы после внесения изменений означает ваше согласие с новыми
            условиями.
          </Paragraph>

          <SectionHeading>8. Контакты</SectionHeading>
          <Paragraph>
            По вопросам, связанным с Условиями использования, обращайтесь по
            адресу: support@p2ptax.ru
          </Paragraph>
        </ScrollView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
