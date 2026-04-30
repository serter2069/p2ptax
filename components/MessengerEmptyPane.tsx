import React from "react";
import { View, Text, Pressable } from "react-native";
import { MessagesSquare, Sparkles, ArrowLeft, Plus, Search } from "lucide-react-native";
import { colors } from "@/lib/theme";

/**
 * MessengerEmptyPane — right-side placeholder for 2-pane desktop chat.
 *
 * Replaces the previous grey "Выберите диалог" EmptyState that left half the
 * screen blank. Adds a gradient-ish backdrop, big illustration, hint text,
 * and an optional secondary CTA (e.g. "Создать запрос" for clients,
 * "Публичные запросы" for specialists). Mobile never renders this (mobile
 * uses single-pane full-screen nav).
 */

interface CTAProps {
  label: string;
  onPress: () => void;
  icon?: "plus" | "sparkles" | "search";
}

interface Props {
  title?: string;
  hint?: string;
  leftHint?: string;
  primary?: CTAProps;
  secondary?: CTAProps;
}

export default function MessengerEmptyPane({
  title = "Выберите диалог",
  hint = "Нажмите на переписку слева, чтобы открыть её",
  leftHint,
  primary,
  secondary,
}: Props) {
  return (
    <View
      className="flex-1 items-center justify-center"
      style={{
        // Soft gradient-ish backdrop using a layered background: accent-soft
        // base + subtle radial highlight via an inner absolutely-positioned
        // circle. Works on web (gradient filter) and native (solid layers).
        backgroundColor: colors.accentSoft,
        overflow: "hidden",
      }}
    >
      {/* Decorative blob — top-right */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: colors.accent,
          opacity: 0.08,
        }}
      />
      {/* Decorative blob — bottom-left */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -140,
          left: -140,
          width: 360,
          height: 360,
          borderRadius: 180,
          backgroundColor: colors.accent,
          opacity: 0.06,
        }}
      />

      <View
        className="items-center"
        style={{
          maxWidth: 420,
          paddingHorizontal: 24,
          gap: 16,
          zIndex: 1,
        }}
      >
        <View
          className="rounded-full items-center justify-center bg-white"
          style={{
            width: 96,
            height: 96,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.15,
            shadowRadius: 28,
            elevation: 8,
          }}
        >
          <MessagesSquare size={44} color={colors.accent} />
        </View>

        <View className="items-center" style={{ gap: 8 }}>
          <Text
            className="font-extrabold text-text-base text-center"
            style={{ fontSize: 20 }}
          >
            {title}
          </Text>
          <Text
            className="text-text-mute text-center"
            style={{ fontSize: 14, lineHeight: 20 }}
          >
            {hint}
          </Text>
        </View>

        {/* Left-arrow hint strip — only shown when leftHint is provided */}
        {leftHint ? (
          <View
            className="flex-row items-center gap-2 bg-white rounded-full border border-border"
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <ArrowLeft size={14} color={colors.accent} />
            <Text className="text-accent font-semibold" style={{ fontSize: 12 }}>
              {leftHint}
            </Text>
          </View>
        ) : null}

        {(primary || secondary) && (
          <View className="flex-row flex-wrap items-center justify-center gap-2 mt-2">
            {primary ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={primary.label}
                onPress={primary.onPress}
                className="flex-row items-center gap-2 bg-accent rounded-full"
                style={{ paddingHorizontal: 16, paddingVertical: 10 }}
              >
                {primary.icon === "plus" ? (
                  <Plus size={14} color={colors.white} />
                ) : (
                  <Sparkles size={14} color={colors.white} />
                )}
                <Text
                  className="text-white font-semibold"
                  style={{ fontSize: 13 }}
                >
                  {primary.label}
                </Text>
              </Pressable>
            ) : null}
            {secondary ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={secondary.label}
                onPress={secondary.onPress}
                className="flex-row items-center gap-2 bg-white border border-border rounded-full"
                style={{ paddingHorizontal: 16, paddingVertical: 10 }}
              >
                {secondary.icon === "plus" ? (
                  <Plus size={14} color={colors.accent} />
                ) : secondary.icon === "search" ? (
                  <Search size={14} color={colors.accent} />
                ) : (
                  <Sparkles size={14} color={colors.accent} />
                )}
                <Text
                  className="text-accent font-semibold"
                  style={{ fontSize: 13 }}
                >
                  {secondary.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}
