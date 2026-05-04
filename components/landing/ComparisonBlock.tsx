import { View, Text } from "react-native";
import { Check, X } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface ComparisonBlockProps {
  isDesktop: boolean;
}

interface Row {
  axis: string;
  generic: string;
  specialist: string;
}

const ROWS: Row[] = [
  {
    axis: "Знание инспекции",
    generic: "Теория из кодекса. Каждое требование — как в первый раз.",
    specialist: "Знает, как именно ваша ИФНС читает 88-ю и 93-ю — потому что ходит туда каждую неделю.",
  },
  {
    axis: "Сроки реакции",
    generic: "«Завтра позвоним», секретарь, расписание на неделю.",
    specialist: "Пишет первым в течение суток. Без диспетчера и формы из 12 полей.",
  },
  {
    axis: "Цена",
    generic: "Часы юриста + накладные офиса + неизвестный исход.",
    specialist: "Прямо со специалистом, без комиссии платформы. Договариваетесь по факту работы.",
  },
  {
    axis: "Зона ответственности",
    generic: "Берёт всё подряд — НДС, развод, банкротство.",
    specialist: "Узкая практика по налогам. Не пытается «закрыть» ваше дело между уголовкой и арбитражем.",
  },
];

/**
 * Comparison block — anchors the value prop against the alternative the
 * visitor is implicitly comparing against ("can't I just call the lawyer
 * I already know"). Two-column on desktop, stacked on mobile.
 *
 * Sits between Cases and HowItWorks: cases prove "our people deliver",
 * comparison answers "but why not a generic lawyer", then HowItWorks
 * shows the actual process.
 */
export default function ComparisonBlock({ isDesktop }: ComparisonBlockProps) {
  return (
    <View
      style={{
        paddingVertical: isDesktop ? 96 : 64,
        paddingHorizontal: isDesktop ? 32 : 20,
        backgroundColor: colors.white,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1024,
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
            Чем мы отличаемся
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: isDesktop ? 36 : 28,
              lineHeight: isDesktop ? 44 : 36,
              fontWeight: "800",
              letterSpacing: -0.6,
              textAlign: "center",
              maxWidth: 640,
            }}
          >
            Юрист «общей практики» vs специалист по ИФНС
          </Text>
        </View>

        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            gap: isDesktop ? 20 : 16,
            alignItems: "stretch",
          }}
        >
          {/* Generic — muted, X icons. */}
          <View
            className="rounded-2xl"
            style={{
              flex: 1,
              padding: isDesktop ? 28 : 22,
              backgroundColor: colors.surface2,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                fontWeight: "600",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Юрист общей практики
            </Text>
            {ROWS.map((r) => (
              <View
                key={`g-${r.axis}`}
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginBottom: 14,
                  alignItems: "flex-start",
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 22,
                    backgroundColor: colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  <X size={14} color={colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    className="font-semibold"
                    style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}
                  >
                    {r.axis}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      lineHeight: 20,
                      marginTop: 2,
                    }}
                  >
                    {r.generic}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Specialist — accent border, primary check icons. */}
          <View
            className="rounded-2xl"
            style={{
              flex: 1,
              padding: isDesktop ? 28 : 22,
              backgroundColor: colors.white,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Специалист по ИФНС
            </Text>
            {ROWS.map((r) => (
              <View
                key={`s-${r.axis}`}
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginBottom: 14,
                  alignItems: "flex-start",
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 22,
                    backgroundColor: colors.accentSoft,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  <Check size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    className="font-semibold"
                    style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}
                  >
                    {r.axis}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: 13,
                      lineHeight: 20,
                      marginTop: 2,
                    }}
                  >
                    {r.specialist}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
