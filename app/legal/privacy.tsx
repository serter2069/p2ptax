import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { colors } from "@/lib/theme";

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

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center h-14 bg-white border-b border-slate-200 px-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Назад"
          onPress={() => router.back()}
          className="w-11 h-11 items-center justify-center -ml-2"
        >
          <FontAwesome name="arrow-left" size={18} color={colors.text} />
        </Pressable>
        <Text className="flex-1 text-center text-base font-semibold text-slate-900">
          Политика конфиденциальности
        </Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 px-4 md:max-w-[520px] md:self-center md:px-0">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48 }}
        >
          <Text className="text-sm text-slate-400 mt-4 mb-4">
            Последнее обновление: апрель 2026
          </Text>

          <Paragraph>
            Настоящая Политика конфиденциальности описывает, как P2PTax собирает,
            использует и защищает ваши персональные данные при использовании нашей
            платформы.
          </Paragraph>

          <SectionHeading>1. Собираемые данные</SectionHeading>
          <Paragraph>
            Мы собираем данные, которые вы предоставляете при регистрации и
            использовании платформы: адрес электронной почты, имя, контактную
            информацию и данные о профессиональной деятельности.
          </Paragraph>

          <SectionHeading>2. Использование данных</SectionHeading>
          <Paragraph>
            Данные используются для предоставления и улучшения наших услуг,
            обработки запросов, отправки уведомлений и обеспечения безопасности
            платформы.
          </Paragraph>

          <SectionHeading>3. Передача данных</SectionHeading>
          <Paragraph>
            Мы не продаём ваши персональные данные третьим лицам. Данные могут
            передаваться только поставщикам услуг, обеспечивающим работу
            платформы, а также по требованию закона.
          </Paragraph>

          <SectionHeading>4. Безопасность</SectionHeading>
          <Paragraph>
            Мы принимаем разумные меры для защиты ваших данных. Все данные
            передаются по зашифрованным каналам (TLS/SSL).
          </Paragraph>

          <SectionHeading>5. Ваши права</SectionHeading>
          <Paragraph>
            Вы имеете право на доступ, исправление или удаление своих
            персональных данных. Для этого обратитесь к нам через приложение или
            по адресу: privacy@p2ptax.ru
          </Paragraph>

          <SectionHeading>6. Контакты</SectionHeading>
          <Paragraph>
            По вопросам, связанным с Политикой конфиденциальности, обращайтесь по
            адресу: privacy@p2ptax.ru
          </Paragraph>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
