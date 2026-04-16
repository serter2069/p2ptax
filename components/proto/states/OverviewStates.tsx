import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { PROJECT, ROLES, SCENARIOS } from '../../../constants/protoMeta';
import { pageRegistry } from '../../../constants/pageRegistry';
import { Feather } from '@expo/vector-icons';

function RoleCard({ id, title, description, color, pages }: { id: string; title: string; description: string; color: string; pages: string[] }) {
  return (
    <View style={s.roleCard}>
      <View style={[s.roleBadge, { backgroundColor: color }]}>
        <Text style={s.roleBadgeText}>{id.toUpperCase()}</Text>
      </View>
      <Text style={s.roleTitle}>{title}</Text>
      <Text style={s.roleDesc}>{description}</Text>
      <Text style={s.rolePages}>{pages.length} экранов</Text>
    </View>
  );
}

function ScenarioCard({ id, title, role, description, steps }: { id: string; title: string; role: string; description: string; steps: { page: string; action: string }[] }) {
  return (
    <View style={s.scenarioCard}>
      <View style={s.scenarioHeader}>
        <Text style={s.scenarioId}>{id}</Text>
        <View style={[s.roleBadgeSmall, { backgroundColor: ROLES.find(r => r.id === role)?.color || Colors.brandPrimary }]}>
          <Text style={s.roleBadgeSmallText}>{role.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={s.scenarioTitle}>{title}</Text>
      <Text style={s.scenarioDesc}>{description}</Text>
      <View style={s.stepFlow}>
        {steps.map((step, idx) => {
          const pageEntry = pageRegistry.find(p => p.id === step.page);
          return (
            <View key={idx} style={s.stepItem}>
              {idx > 0 && <Feather name="chevron-right" size={14} color={Colors.textMuted} />}
              <Pressable style={s.stepChip} onPress={() => {
                if (typeof window !== 'undefined') window.open(`/proto/states/${step.page}`, '_self');
              }}>
                <Text style={s.stepChipText}>{pageEntry?.title || step.page}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function OverviewStates() {
  const total = pageRegistry.length;
  const proto = pageRegistry.filter(p => (p.qaCycles || 0) > 0 && (p.qaCycles || 0) < 5).length;
  const review = pageRegistry.filter(p => (p.qaCycles || 0) >= 5).length;
  const pct = Math.round(((proto + review) / total) * 100);

  return (
    <StateSection title="DEFAULT">
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.projectName}>{PROJECT.name}</Text>
        <Text style={s.projectTagline}>Налоговый информационный арбитраж</Text>
        <Text style={s.projectDesc}>{PROJECT.description}</Text>

        <Text style={s.sectionTitle}>РОЛИ</Text>
        <View style={s.rolesGrid}>
          {ROLES.map(role => (
            <RoleCard key={role.id} {...role} />
          ))}
        </View>

        <Text style={s.sectionTitle}>СЦЕНАРИИ</Text>
        {SCENARIOS.map(sc => (
          <ScenarioCard key={sc.id} {...sc} />
        ))}

        <Text style={s.sectionTitle}>ПРОГРЕСС</Text>
        <View style={s.progressCard}>
          <Text style={s.progressText}>
            {total} страниц | {proto} proto | {review} review
          </Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={s.progressPct}>{pct}%</Text>
        </View>
      </ScrollView>
    </StateSection>
  );
}

const s = StyleSheet.create({
  content: {
    padding: Spacing['2xl'],
    gap: Spacing.xl,
  },
  projectName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  projectTagline: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brandPrimary,
    marginTop: Spacing.xs,
  },
  projectDesc: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.brandPrimary,
    paddingLeft: Spacing.md,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  roleCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    minWidth: 200,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  roleBadgeSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  roleBadgeSmallText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  roleTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  roleDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  rolePages: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  scenarioCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scenarioId: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textMuted,
  },
  scenarioTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  scenarioDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  stepFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  stepChip: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  stepChipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brandPrimary,
  },
  progressCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  progressText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.xxl,
  },
  progressPct: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'right',
  },
});
