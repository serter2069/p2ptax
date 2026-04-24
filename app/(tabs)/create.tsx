import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FileText,
  CheckCircle2,
  MapPin,
  Clock,
  Target,
  ScrollText,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { colors, textStyle } from "@/lib/theme";
import Button from "@/components/ui/Button";

const TIPS: { icon: typeof Target; title: string; text: string }[] = [
  {
    icon: Target,
    title: "Вид проверки",
    text: "Камеральная, выездная или оперативный контроль — специалисты фильтруют заявки по этому полю.",
  },
  {
    icon: MapPin,
    title: "Регион ФНС",
    text: "Инспекция и город определяют, кому покажут заявку в первую очередь.",
  },
  {
    icon: Clock,
    title: "Текущий этап",
    text: "Требование получено, назначен выезд, решение вручено — это резко сужает круг экспертов.",
  },
  {
    icon: ScrollText,
    title: "Сроки и бюджет",
    text: "Опишите рамки — так специалисты сразу напишут, берутся или нет.",
  },
  {
    icon: CheckCircle2,
    title: "Контакт — по желанию",
    text: "Телефон не обязателен: вся связь идёт через чат внутри сервиса.",
  },
];

export default function CreateScreen() {
  const router = useRouter();
  const [tipsOpen, setTipsOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View
          style={{
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            paddingHorizontal: 24,
            paddingTop: 24,
          }}
        >
          <Text
            style={{
              ...textStyle.h1,
              color: colors.text,
              fontSize: 28,
              lineHeight: 34,
              marginBottom: 10,
            }}
          >
            Новая заявка специалисту
          </Text>
          <Text
            style={{
              ...textStyle.body,
              color: colors.textSecondary,
              fontSize: 15,
              lineHeight: 22,
              marginBottom: 24,
            }}
          >
            Опишите ситуацию — специалисты из вашего региона увидят заявку и
            сами предложат помощь.
          </Text>

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
              <Text className="text-base font-semibold text-accent ml-2">
                Как работают заявки
              </Text>
            </View>
            <Text
              className="text-sm leading-6"
              style={{ color: colors.textSecondary }}
            >
              Вы бесплатно публикуете заявку с описанием вопроса: вид проверки,
              регион ФНС, сроки. Специалисты пишут вам в чат — вы сравниваете
              предложения и выбираете подходящего.
            </Text>
          </View>

          <Button
            label="Создать заявку"
            onPress={() => router.push("/requests/new" as never)}
          />

          {/* Collapsible tips */}
          <View className="mt-8 border border-border rounded-2xl overflow-hidden">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tipsOpen ? "Скрыть советы" : "Показать советы"}
              onPress={() => setTipsOpen((v) => !v)}
              className="flex-row items-center justify-between px-4 py-3 active:bg-surface2"
            >
              <Text className="text-sm font-semibold text-text-base">
                Советы: что указать в заявке
              </Text>
              {tipsOpen ? (
                <ChevronUp size={16} color={colors.textMuted} />
              ) : (
                <ChevronDown size={16} color={colors.textMuted} />
              )}
            </Pressable>

            {tipsOpen && (
              <View className="px-4 py-4 border-t border-border" style={{ gap: 14 }}>
                {TIPS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <View
                      key={t.title}
                      className="flex-row items-start gap-3"
                    >
                      <View
                        className="rounded-xl items-center justify-center bg-accent-soft"
                        style={{ width: 32, height: 32 }}
                      >
                        <Icon size={14} color={colors.accent} />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text
                          className="text-text-base font-bold"
                          style={{ fontSize: 13 }}
                        >
                          {t.title}
                        </Text>
                        <Text
                          className="text-text-mute mt-0.5"
                          style={{ fontSize: 13, lineHeight: 19 }}
                        >
                          {t.text}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
