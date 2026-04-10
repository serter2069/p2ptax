import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { PROJECT, ROLES, SCENARIOS, PROTO_RULES } from '../../constants/protoMeta';
import { pageRegistryWithNav, PAGE_TRANSITIONS } from '../../constants/pageRegistry';

const ROLE_COLOR: Record<string, string> = {
  client: '#1A5BA8',
  specialist: '#059669',
  admin: '#DC2626',
  guest: '#D97706',
};

function SectionHeader({ title, icon }: { title: string; icon: keyof typeof Feather.glyphMap }) {
  return (
    <View style={s.sectionHeader}>
      <Feather name={icon} size={16} color={Colors.brandPrimary} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.badge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function RoleCard({ role }: { role: (typeof ROLES)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const color = ROLE_COLOR[role.id] || Colors.brandPrimary;
  return (
    <Pressable
      style={[s.roleCard, { borderLeftColor: color }]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={s.roleHeader}>
        <View style={[s.roleDot, { backgroundColor: color }]} />
        <Text style={s.roleName}>{role.title}</Text>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
      </View>
      <Text style={s.roleDesc}>{role.description}</Text>
      {expanded && (
        <View style={s.rolePages}>
          <Text style={s.rolePagesLabel}>Страницы ({role.pages.length}):</Text>
          <View style={s.pagePillRow}>
            {role.pages.map((pageId) => {
              const page = pageRegistryWithNav.find((p) => p.id === pageId);
              return (
                <Pressable
                  key={pageId}
                  onPress={() => {
                    if (Platform.OS === 'web') window.open(`/proto/states/${pageId}`, '_blank');
                  }}
                  style={s.pagePill}
                >
                  <Text style={s.pagePillText}>{page?.title || pageId}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </Pressable>
  );
}

function ScenarioCard({ scenario }: { scenario: (typeof SCENARIOS)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const color = ROLE_COLOR[scenario.role] || Colors.brandPrimary;
  return (
    <Pressable
      style={s.scenarioCard}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={s.scenarioHeader}>
        <Badge label={scenario.role} color={color} />
        <Text style={s.scenarioTitle}>{scenario.title}</Text>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textMuted} />
      </View>
      <Text style={s.scenarioDesc}>{scenario.description}</Text>
      {expanded && (
        <View style={s.steps}>
          {scenario.steps.map((step, i) => {
            const page = pageRegistryWithNav.find((p) => p.id === step.page);
            return (
              <View key={i} style={s.step}>
                <View style={s.stepNum}>
                  <Text style={s.stepNumText}>{i + 1}</Text>
                </View>
                <View style={s.stepBody}>
                  <Pressable
                    onPress={() => {
                      if (Platform.OS === 'web') window.open(`/proto/states/${step.page}`, '_blank');
                    }}
                  >
                    <Text style={s.stepPage}>{page?.title || step.page}</Text>
                  </Pressable>
                  <Text style={s.stepAction}>{step.action}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Pressable>
  );
}

function FlowTable() {
  const pages = pageRegistryWithNav;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? pages.find((p) => p.id === selectedId) : null;

  return (
    <View style={s.flowWrap}>
      <Text style={s.flowHint}>Кликните на страницу, чтобы увидеть её связи</Text>
      <View style={s.flowGrid}>
        {pages.map((page) => {
          const isActive = selectedId === page.id;
          const isFrom = selected?.navFrom?.includes(page.id);
          const isTo = selected?.navTo?.includes(page.id);
          return (
            <Pressable
              key={page.id}
              onPress={() => setSelectedId(isActive ? null : page.id)}
              style={[
                s.flowNode,
                isActive && s.flowNodeActive,
                isFrom && s.flowNodeFrom,
                isTo && s.flowNodeTo,
              ]}
            >
              <Text style={[s.flowNodeText, (isActive || isFrom || isTo) && s.flowNodeTextActive]} numberOfLines={2}>
                {page.title}
              </Text>
              {isFrom && <Feather name="arrow-right" size={10} color={Colors.statusWarning} />}
              {isTo && <Feather name="arrow-right" size={10} color={Colors.statusSuccess} />}
            </Pressable>
          );
        })}
      </View>
      {selected && (
        <View style={s.flowDetail}>
          <Text style={s.flowDetailTitle}>{selected.title}</Text>
          {(selected.navFrom || []).length > 0 && (
            <View style={s.flowDetailRow}>
              <Feather name="arrow-right" size={13} color={Colors.statusWarning} />
              <Text style={s.flowDetailLabel}>Входит из:</Text>
              <Text style={s.flowDetailValue}>{(selected.navFrom || []).map((id) => pageRegistryWithNav.find((p) => p.id === id)?.title || id).join(', ')}</Text>
            </View>
          )}
          {(selected.navTo || []).length > 0 && (
            <View style={s.flowDetailRow}>
              <Feather name="arrow-right" size={13} color={Colors.statusSuccess} />
              <Text style={s.flowDetailLabel}>Ведёт на:</Text>
              <Text style={s.flowDetailValue}>{(selected.navTo || []).map((id) => pageRegistryWithNav.find((p) => p.id === id)?.title || id).join(', ')}</Text>
            </View>
          )}
          {(PAGE_TRANSITIONS[selected.id] || []).map((t, i) => (
            <Text key={i} style={s.flowTransition}>
              {'→ '}{pageRegistryWithNav.find((p) => p.id === t.to)?.title || t.to}: {t.action}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ProtoOverview() {
  const [activeTab, setActiveTab] = useState<'meta' | 'roles' | 'scenarios' | 'flow' | 'rules'>('meta');

  const totalStates = pageRegistryWithNav.reduce((s, p) => s + p.stateCount, 0);

  const TABS = [
    { id: 'meta', label: 'Проект', icon: 'info' as const },
    { id: 'roles', label: 'Роли', icon: 'users' as const },
    { id: 'scenarios', label: 'Сценарии', icon: 'play-circle' as const },
    { id: 'flow', label: 'Флоу', icon: 'git-merge' as const },
    { id: 'rules', label: 'Правила', icon: 'shield' as const },
  ] as const;

  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <Pressable
          onPress={() => { if (Platform.OS === 'web') window.open('/proto', '_self'); }}
          style={s.backBtn}
        >
          <Feather name="arrow-left" size={16} color={Colors.brandPrimary} />
          <Text style={s.backText}>Прототипы</Text>
        </Pressable>
        <Text style={s.topBarTitle}>Overview</Text>
        <View style={s.topBarStats}>
          <Text style={s.statChip}>{pageRegistryWithNav.length} стр</Text>
          <Text style={s.statChip}>{totalStates} сост</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[s.tab, activeTab === tab.id && s.tabActive]}
          >
            <Feather
              name={tab.icon}
              size={14}
              color={activeTab === tab.id ? Colors.brandPrimary : Colors.textMuted}
            />
            <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={s.content} contentContainerStyle={s.contentInner}>

        {/* Meta */}
        {activeTab === 'meta' && (
          <View style={s.section}>
            <SectionHeader title="О проекте" icon="briefcase" />
            <View style={s.metaCard}>
              <Text style={s.metaName}>{PROJECT.name}</Text>
              <Text style={s.metaDesc}>{PROJECT.description}</Text>
              <View style={s.metaRow}>
                <Feather name="layers" size={13} color={Colors.textMuted} />
                <Text style={s.metaDetail}>{PROJECT.stack}</Text>
              </View>
              <View style={s.metaRow}>
                <Feather name="monitor" size={13} color={Colors.textMuted} />
                <Text style={s.metaDetail}>App: {PROJECT.appUrl}</Text>
              </View>
              <View style={s.metaRow}>
                <Feather name="eye" size={13} color={Colors.textMuted} />
                <Text style={s.metaDetail}>Proto-viewer: {PROJECT.protoViewerUrl}</Text>
              </View>
            </View>

            <SectionHeader title="Статистика" icon="bar-chart-2" />
            <View style={s.statsRow}>
              {[
                { label: 'Страниц', value: String(pageRegistryWithNav.length) },
                { label: 'Состояний', value: String(totalStates) },
                { label: 'Ролей', value: String(ROLES.length) },
                { label: 'Сценариев', value: String(SCENARIOS.length) },
              ].map((stat) => (
                <View key={stat.label} style={s.statCard}>
                  <Text style={s.statValue}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Roles */}
        {activeTab === 'roles' && (
          <View style={s.section}>
            <SectionHeader title="Роли пользователей" icon="users" />
            {ROLES.map((role) => <RoleCard key={role.id} role={role} />)}
          </View>
        )}

        {/* Scenarios */}
        {activeTab === 'scenarios' && (
          <View style={s.section}>
            <SectionHeader title="Ключевые сценарии" icon="play-circle" />
            {SCENARIOS.map((sc) => <ScenarioCard key={sc.id} scenario={sc} />)}
          </View>
        )}

        {/* Flow */}
        {activeTab === 'flow' && (
          <View style={s.section}>
            <SectionHeader title="Навигационный граф" icon="git-merge" />
            <FlowTable />
          </View>
        )}

        {/* Rules */}
        {activeTab === 'rules' && (
          <View style={s.section}>
            <SectionHeader title="Правила для агентов" icon="shield" />
            <View style={s.rulesCard}>
              {PROTO_RULES.map((rule, i) => (
                <View key={i} style={s.ruleRow}>
                  <View style={s.ruleBullet}>
                    <Text style={s.ruleBulletText}>{i + 1}</Text>
                  </View>
                  <Text style={s.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  backText: { fontSize: Typography.fontSize.sm, color: Colors.brandPrimary, fontWeight: Typography.fontWeight.medium },
  topBarTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, flex: 1 },
  topBarStats: { flexDirection: 'row', gap: Spacing.sm },
  statChip: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, backgroundColor: Colors.bgSecondary, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },

  tabs: {
    flexDirection: 'row', backgroundColor: Colors.bgCard,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    marginRight: 4, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  tabTextActive: { color: Colors.brandPrimary, fontWeight: Typography.fontWeight.semibold },

  content: { flex: 1 },
  contentInner: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 48 },

  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },

  badge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.sm, borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold, textTransform: 'uppercase' },

  // Meta
  metaCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  metaName: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  metaDesc: { fontSize: Typography.fontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  metaDetail: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, flex: 1 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, textAlign: 'center' },

  // Roles
  roleCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 3, gap: Spacing.sm,
  },
  roleHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
  roleName: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  roleDesc: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  rolePages: { gap: Spacing.xs, marginTop: Spacing.xs },
  rolePagesLabel: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, fontWeight: Typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  pagePillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pagePill: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  pagePillText: { fontSize: Typography.fontSize.xs, color: Colors.brandPrimary },

  // Scenarios
  scenarioCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  scenarioHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scenarioTitle: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  scenarioDesc: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  steps: { gap: Spacing.sm, marginTop: Spacing.xs },
  step: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  stepNumText: { fontSize: 11, fontWeight: Typography.fontWeight.bold, color: Colors.white },
  stepBody: { flex: 1, gap: 2 },
  stepPage: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.brandPrimary },
  stepAction: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },

  // Flow
  flowWrap: { gap: Spacing.lg },
  flowHint: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  flowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  flowNode: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  flowNodeActive: { borderColor: Colors.brandPrimary, backgroundColor: Colors.bgSecondary },
  flowNodeFrom: { borderColor: Colors.statusWarning, backgroundColor: Colors.statusBg.warning },
  flowNodeTo: { borderColor: Colors.statusSuccess, backgroundColor: Colors.statusBg.success },
  flowNodeText: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  flowNodeTextActive: { color: Colors.textPrimary, fontWeight: Typography.fontWeight.semibold },

  flowDetail: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  flowDetailTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  flowDetailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  flowDetailLabel: { fontSize: Typography.fontSize.sm, color: Colors.textMuted, fontWeight: Typography.fontWeight.medium },
  flowDetailValue: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  flowTransition: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, paddingLeft: Spacing.md },

  // Rules
  rulesCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  ruleBullet: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  ruleBulletText: { fontSize: 11, fontWeight: Typography.fontWeight.bold, color: Colors.brandPrimary },
  ruleText: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
