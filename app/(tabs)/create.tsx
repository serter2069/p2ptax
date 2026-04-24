import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FileText, Lightbulb } from "lucide-react-native";
import { colors } from "@/lib/theme";
import ResponsiveContainer from "@/components/ResponsiveContainer";
import Button from "@/components/ui/Button";

export default function CreateScreen() {
  const { width } = useWindowDimensions();
  const _isDesktop = width >= 640;
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <ResponsiveContainer>
          {/* Header */}
          <View className="pt-4 pb-4">
            <Text className="text-2xl font-bold text-text-base">Новая заявка специалисту</Text>
            <Text className="text-sm text-text-mute mt-1 leading-5">
              Опишите ситуацию — специалисты из вашего региона увидят заявку и сами предложат помощь.
            </Text>
          </View>

          {/* Intro card */}
          <View
            className="rounded-2xl border border-border bg-accent-soft p-5 mb-6"
            style={{
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View className="flex-row items-center mb-2">
              <FileText size={18} color={colors.accent} />
              <Text className="text-base font-semibold text-accent ml-2">Как работают заявки</Text>
            </View>
            <Text className="text-sm leading-6" style={{ color: colors.textSecondary }}>
              Вы бесплатно публикуете заявку с описанием вопроса: вид проверки, регион ФНС, сроки.
              Специалисты откликаются в чат — вы сравниваете предложения и выбираете подходящего.
            </Text>
          </View>

          {/* Tips */}
          <View className="p-4 rounded-xl border border-warning-soft mb-8 bg-warning-soft">
            <View className="flex-row items-center mb-2">
              <Lightbulb size={16} color={colors.warning} />
              <Text className="text-sm font-semibold ml-2" style={{ color: colors.warning }}>Что указать в заявке</Text>
            </View>
            <Text className="text-sm leading-6 text-text-mute">
              Вид проверки (камеральная, выездная, оперативный контроль) · регион налогового органа ·
              этап (требование получено, назначен выезд, решение вручено) · желаемые сроки и бюджет.
            </Text>
          </View>

          {/* Next Button — uses shared primary Button */}
          <Button
            label="Создать заявку"
            onPress={() => router.push("/requests/new" as never)}
          />
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}
