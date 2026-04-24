import React from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { Check, ChevronRight } from "lucide-react-native";
import { colors, overlay, textStyle, spacing } from "@/lib/theme";

export type StageStatus = "done" | "current" | "pending";

export interface TimelineStage {
  key: string;
  label: string;
  status: StageStatus;
  meta?: string;
  date?: string;
}

export interface CaseTimelineProps {
  caseTitle: string;
  currentStage?: string;
  stages: TimelineStage[];
  nextAction?: {
    label: string;
    description?: string;
    cta?: { label: string; onPress: () => void };
  };
  /** Optional header action, e.g. "Open case" link */
  headerAction?: React.ReactNode;
}

function StageNode({ stage }: { stage: TimelineStage }) {
  const size = 28;
  const baseStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  if (stage.status === "done") {
    return (
      <View style={[baseStyle, { backgroundColor: colors.success }]}>
        <Check size={16} color={colors.white} />
      </View>
    );
  }
  if (stage.status === "current") {
    return (
      <View
        style={[
          baseStyle,
          {
            backgroundColor: colors.accent,
            borderWidth: 3,
            borderColor: colors.accentSoft,
          },
        ]}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.white,
          }}
        />
      </View>
    );
  }
  return (
    <View
      style={[
        baseStyle,
        {
          borderWidth: 2,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    />
  );
}

export default function CaseTimeline({
  caseTitle,
  stages,
  nextAction,
  headerAction,
}: CaseTimelineProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        padding: isDesktop ? spacing.xl : spacing.lg,
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: spacing.lg,
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...textStyle.caption,
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Текущее дело
          </Text>
          <Text
            style={{
              ...textStyle.h4,
              color: colors.text,
              marginTop: spacing.xs,
            }}
            numberOfLines={2}
          >
            {caseTitle}
          </Text>
        </View>
        {headerAction ? <View>{headerAction}</View> : null}
      </View>

      {/* Timeline */}
      {isDesktop ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: nextAction ? spacing.lg : 0,
          }}
        >
          {stages.map((stage, i) => {
            const isLast = i === stages.length - 1;
            return (
              <View
                key={stage.key}
                style={{ flex: 1, alignItems: "center", minWidth: 0 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <View style={{ flex: 1, height: 2 }} />
                  <StageNode stage={stage} />
                  <View
                    style={{
                      flex: 1,
                      height: 2,
                      backgroundColor:
                        isLast || stage.status === "pending"
                          ? "transparent"
                          : stage.status === "done"
                            ? colors.success
                            : colors.border,
                    }}
                  />
                </View>
                <View
                  style={{
                    marginTop: spacing.sm,
                    alignItems: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    numberOfLines={2}
                    style={{
                      ...textStyle.caption,
                      fontWeight:
                        stage.status === "current" ? "700" : "600",
                      color:
                        stage.status === "pending"
                          ? colors.textMuted
                          : colors.text,
                      textAlign: "center",
                    }}
                  >
                    {stage.label}
                  </Text>
                  {stage.meta ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        ...textStyle.caption,
                        color: colors.textSecondary,
                        marginTop: 2,
                        textAlign: "center",
                      }}
                    >
                      {stage.meta}
                    </Text>
                  ) : null}
                  {stage.date ? (
                    <Text
                      style={{
                        ...textStyle.caption,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {stage.date}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        // Mobile — vertical timeline
        <View style={{ marginBottom: nextAction ? spacing.lg : 0 }}>
          {stages.map((stage, i) => {
            const isLast = i === stages.length - 1;
            return (
              <View
                key={stage.key}
                style={{ flexDirection: "row", alignItems: "flex-start" }}
              >
                <View style={{ alignItems: "center", width: 32 }}>
                  <StageNode stage={stage} />
                  {!isLast ? (
                    <View
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 28,
                        backgroundColor:
                          stage.status === "done"
                            ? colors.success
                            : colors.border,
                      }}
                    />
                  ) : null}
                </View>
                <View
                  style={{
                    flex: 1,
                    paddingLeft: spacing.md,
                    paddingBottom: isLast ? 0 : spacing.md,
                  }}
                >
                  <Text
                    style={{
                      ...textStyle.bodyBold,
                      color:
                        stage.status === "pending"
                          ? colors.textMuted
                          : colors.text,
                    }}
                  >
                    {stage.label}
                  </Text>
                  {stage.meta ? (
                    <Text
                      style={{
                        ...textStyle.caption,
                        color: colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {stage.meta}
                    </Text>
                  ) : null}
                  {stage.date ? (
                    <Text
                      style={{
                        ...textStyle.caption,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {stage.date}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Next action */}
      {nextAction ? (
        <View
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            borderRadius: 14,
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.accentSoft,
            flexDirection: isDesktop ? "row" : "column",
            alignItems: isDesktop ? "center" : "flex-start",
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                ...textStyle.caption,
                color: colors.accentSoftInk,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Следующее действие
            </Text>
            <Text
              style={{
                ...textStyle.bodyBold,
                color: colors.accentSoftInk,
                marginTop: 2,
              }}
            >
              {nextAction.label}
            </Text>
            {nextAction.description ? (
              <Text
                style={{
                  ...textStyle.small,
                  color: colors.accentSoftInk,
                  marginTop: 2,
                }}
              >
                {nextAction.description}
              </Text>
            ) : null}
          </View>
          {nextAction.cta ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={nextAction.cta.label}
              onPress={nextAction.cta.onPress}
              style={{
                backgroundColor: colors.accent,
                paddingHorizontal: spacing.lg,
                paddingVertical: 10,
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 44,
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {nextAction.cta.label}
              </Text>
              <ChevronRight size={16} color={overlay.white80} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
