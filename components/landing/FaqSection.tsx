import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface FaqSectionProps {
  isDesktop: boolean;
}

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Сколько стоит сама платформа?",
    a: "Ничего. Площадка не берёт комиссию с клиентов — оплата идёт напрямую специалисту, цена и условия — ваше с ним дело.",
  },
  {
    q: "Что значит «специалист знает именно мою ИФНС»?",
    a: "Каждый специалист в каталоге привязан к конкретным инспекциям, в которых он реально ведёт дела. Вы видите эти ИФНС в его профиле и выбираете того, кто работает с вашей.",
  },
  {
    q: "Что если ИФНС откажет, а я уже заплатил?",
    a: "Платформа не гарантирует исход — он зависит от ФНС и материалов дела. Вы платите специалисту за работу, а не за гарантированный результат. Цены, условия и ответственность — всё это вы согласовываете напрямую.",
  },
  {
    q: "Кто эти специалисты — где проверка?",
    a: "Это практикующие налоговые консультанты, бухгалтеры, бывшие сотрудники ФНС и юристы. У каждого — открытый профиль с опытом, ИФНС и услугами; верификация идёт на стороне платформы.",
  },
  {
    q: "Как быстро отвечают?",
    a: "Обычно специалисты пишут первыми в течение суток после публикации запроса. Это не контактный центр — отвечают практики между делами, поэтому окно «несколько часов–сутки» нормально.",
  },
  {
    q: "Моей ИФНС нет в каталоге — что делать?",
    a: "Создайте запрос всё равно — мы видим, в какие инспекции приходят запросы без специалистов, и подключаем туда практиков в первую очередь. Каталог расширяется по реальному спросу.",
  },
];

/**
 * FAQ accordion — collapsed by default, one item expanded at a time.
 * Sits between services and SpecialistCTA: by this point the visitor has
 * seen the value prop, the data and concrete cases, and is now in
 * "what's the catch" mode. Six questions cover the most common
 * friction (cost, verification, ИФНС coverage, response time, refunds).
 */
export default function FaqSection({ isDesktop }: FaqSectionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <View
      style={{
        paddingVertical: isDesktop ? 96 : 64,
        paddingHorizontal: isDesktop ? 32 : 20,
        backgroundColor: colors.surface2,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 840,
          marginHorizontal: "auto",
        }}
      >
        <View style={{ marginBottom: isDesktop ? 48 : 32, alignItems: "center" }}>
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              fontWeight: "600",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Частые вопросы
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: isDesktop ? 36 : 28,
              lineHeight: isDesktop ? 44 : 36,
              fontWeight: "800",
              letterSpacing: -0.6,
              textAlign: "center",
            }}
          >
            Что обычно спрашивают перед запросом
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {FAQS.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <Pressable
                key={item.q}
                accessibilityRole="button"
                accessibilityLabel={item.q}
                accessibilityState={{ expanded: open }}
                onPress={() => setOpenIdx(open ? null : idx)}
                className="rounded-2xl"
                style={{
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: isDesktop ? 24 : 18,
                  paddingVertical: 18,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      lineHeight: 22,
                      fontWeight: "600",
                      flex: 1,
                    }}
                  >
                    {item.q}
                  </Text>
                  <View
                    style={{
                      transform: [{ rotate: open ? "180deg" : "0deg" }],
                    }}
                  >
                    <ChevronDown size={20} color={colors.textSecondary} />
                  </View>
                </View>
                {open ? (
                  <Text
                    style={{
                      marginTop: 12,
                      color: colors.textSecondary,
                      fontSize: 15,
                      lineHeight: 24,
                    }}
                  >
                    {item.a}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
