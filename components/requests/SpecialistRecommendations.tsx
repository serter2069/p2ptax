import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import Avatar from "@/components/ui/Avatar";
import { colors } from "@/lib/theme";

export interface SpecialistCard {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  description: string | null;
  services: string[];
}

function getSpecialistName(
  user: { firstName: string | null; lastName: string | null }
): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Специалист";
}

interface SpecialistRecommendationsProps {
  recommendations: SpecialistCard[];
  onContact: (specialistId: string) => void;
}

export default function SpecialistRecommendations({
  recommendations,
  onContact,
}: SpecialistRecommendationsProps) {
  const router = useRouter();

  if (recommendations.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Рекомендованные специалисты
      </Text>
      {recommendations.map((spec) => {
        const name = getSpecialistName(spec);
        return (
          <Pressable
            accessibilityRole="button"
            key={spec.id}
            accessibilityLabel={`Профиль специалиста ${name}`}
            onPress={() => onContact(spec.id)}
            className="bg-white rounded-2xl p-4 mb-3"
            style={({ pressed }) => [
              {
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              },
              pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View className="flex-row items-center">
              <Avatar
                name={name}
                imageUrl={spec.avatarUrl ?? undefined}
                size="md"
              />
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-slate-900">
                  {name}
                </Text>
                {spec.services.length > 0 && (
                  <Text
                    className="text-xs text-slate-400 mt-0.5"
                    numberOfLines={1}
                  >
                    {spec.services.join(", ")}
                  </Text>
                )}
                {spec.description && (
                  <Text
                    className="text-sm text-slate-600 mt-1 leading-5"
                    numberOfLines={2}
                  >
                    {spec.description}
                  </Text>
                )}
              </View>
              <ChevronRight size={12} color={colors.placeholder} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
