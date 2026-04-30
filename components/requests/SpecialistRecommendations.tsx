import { View, Text, Pressable, ScrollView } from "react-native";
import { MessageCircle } from "lucide-react-native";
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
  /** Open the specialist's profile (where the user can contact them). */
  onOpenProfile: (specialistId: string) => void;
  /** Trigger the "Написать" action — opens chat with the specialist. */
  onWrite: (specialistId: string) => void;
  /** Optional title override. */
  title?: string;
}

/**
 * Horizontal scroll feed of recommended specialists for issue #1550.
 *
 * - Horizontal scroll (горизонтальная лента)
 * - Each card: avatar, name, services hint, "Написать" button
 * - Filtering (FNS match + no existing thread) is done server-side
 *   in /api/requests/:id/recommendations.
 */
export default function SpecialistRecommendations({
  recommendations,
  onOpenProfile,
  onWrite,
  title = "Рекомендованные специалисты",
}: SpecialistRecommendationsProps) {
  if (recommendations.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wide mb-3 px-1">
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 4 }}
      >
        {recommendations.map((spec) => {
          const name = getSpecialistName(spec);
          return (
            <View
              key={spec.id}
              className="bg-white rounded-2xl p-4 mr-3"
              style={{
                width: 220,
                shadowColor: colors.text,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Профиль специалиста ${name}`}
                onPress={() => onOpenProfile(spec.id)}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                className="items-center"
              >
                <Avatar
                  name={name}
                  imageUrl={spec.avatarUrl ?? undefined}
                  size="lg"
                />
                <Text
                  className="text-sm font-semibold text-text-base mt-3 text-center"
                  numberOfLines={2}
                >
                  {name}
                </Text>
                {spec.services.length > 0 && (
                  <Text
                    className="text-xs text-text-mute mt-1 text-center"
                    numberOfLines={2}
                  >
                    {spec.services.join(", ")}
                  </Text>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Написать специалисту ${name}`}
                onPress={() => onWrite(spec.id)}
                className="flex-row items-center justify-center rounded-xl mt-3 py-2 px-3"
                style={({ pressed }) => [
                  { backgroundColor: colors.accent, minHeight: 40 },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <MessageCircle size={14} color="#fff" />
                <Text className="text-white text-sm font-semibold ml-1.5">
                  Написать
                </Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
