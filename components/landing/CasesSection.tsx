import { View, Text, Pressable } from "react-native";
import { colors } from "@/lib/theme";
import CaseCard, { CaseCardData } from "./CaseCard";

interface CasesSectionProps {
  isDesktop: boolean;
  cases: CaseCardData[];
  onCreateRequest: () => void;
}

export default function CasesSection({ isDesktop, cases, onCreateRequest }: CasesSectionProps) {
  const hasCases = cases.length > 0;
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
          maxWidth: 1152,
          marginHorizontal: "auto",
        }}
      >
        <View style={{ marginBottom: isDesktop ? 48 : 32, maxWidth: 700 }}>
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
            Реальные кейсы
          </Text>
          <Text
            style={{
              color: colors.text,
              fontSize: isDesktop ? 40 : 30,
              lineHeight: isDesktop ? 48 : 38,
              fontWeight: "800",
              letterSpacing: -0.8,
            }}
          >
            Настоящие клиенты. Настоящие суммы.
          </Text>
          <Text
            style={{
              marginTop: 16,
              color: colors.textSecondary,
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            Истории, где специалисты оспорили доначисления ФНС целиком
            или в большой части.
          </Text>
        </View>

        {hasCases ? (
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              gap: 20,
              alignItems: "stretch",
            }}
          >
            {cases.slice(0, 3).map((c, idx) => (
              <CaseCard key={c.id} data={c} index={idx} />
            ))}
          </View>
        ) : (
          <View
            className="rounded-2xl items-center justify-center"
            style={{
              padding: 56,
              backgroundColor: colors.accentSoft,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 24,
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: -0.4,
              }}
            >
              Станьте первым успешным кейсом
            </Text>
            <Text
              style={{
                marginTop: 12,
                color: colors.textSecondary,
                fontSize: 15,
                textAlign: "center",
                maxWidth: 440,
              }}
            >
              Создайте заявку — специалисты в вашей ФНС напишут первыми.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Создать заявку"
              onPress={onCreateRequest}
              className="rounded-xl items-center justify-center"
              style={{
                marginTop: 24,
                height: 52,
                paddingHorizontal: 28,
                backgroundColor: colors.primary,
              }}
            >
              <Text className="text-white font-semibold" style={{ fontSize: 15 }}>
                Создать заявку
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
