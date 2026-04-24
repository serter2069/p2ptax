import React from "react";
import { View, Text } from "react-native";
import { type LucideIcon } from "lucide-react-native";
import { colors, textStyle } from "@/lib/theme";

interface Props {
  step: 1 | 2 | 3;
  title: string;
  description: string;
  bullets?: string[];
  icon?: LucideIcon;
}

const TOTAL = 3;

export default function OnboardingLeft({
  step,
  title,
  description,
  bullets,
  icon: Icon,
}: Props) {
  return (
    <View style={{ gap: 24 }}>
      {Icon ? (
        <View
          className="rounded-2xl items-center justify-center bg-white self-start"
          style={{ width: 56, height: 56 }}
        >
          <Icon size={26} color={colors.accent} />
        </View>
      ) : null}

      {/* Progress */}
      <View style={{ gap: 8 }}>
        <View className="flex-row gap-2">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${i < step ? "bg-accent" : "bg-white"}`}
              style={{ width: 40 }}
            />
          ))}
        </View>
        <Text
          className="text-accent font-semibold"
          style={{ fontSize: 12, letterSpacing: 0.5 }}
        >
          {`ШАГ ${step} ИЗ ${TOTAL}`}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <Text
          style={{ ...textStyle.h1, color: colors.text, fontSize: 28, lineHeight: 34 }}
        >
          {title}
        </Text>
        <Text
          style={{ ...textStyle.body, color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}
        >
          {description}
        </Text>
      </View>

      {bullets && bullets.length > 0 ? (
        <View style={{ gap: 10 }}>
          {bullets.map((b) => (
            <View key={b} className="flex-row items-start gap-2">
              <View
                className="bg-accent rounded-full"
                style={{ width: 6, height: 6, marginTop: 8 }}
              />
              <Text
                className="flex-1 text-text-base"
                style={{ fontSize: 14, lineHeight: 20 }}
              >
                {b}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
