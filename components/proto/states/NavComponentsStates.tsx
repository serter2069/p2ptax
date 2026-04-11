import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { ProtoHeader, ProtoTabBar, ProtoBurger } from '../NavComponents';
import { Colors, Spacing, Typography } from '../../../constants/Colors';

function NavLabel({ text }: { text: string }) {
  return (
    <View style={s.labelBox}>
      <Text style={s.labelText}>{text}</Text>
    </View>
  );
}

export function NavComponentsStates() {
  const [interactiveTab, setInteractiveTab] = useState('home');
  const [burgerOpen, setBurgerOpen] = useState(false);

  return (
    <View style={s.root}>
      {/* HEADER — GUEST */}
      <View style={s.section}>
        <NavLabel text="HEADER -- GUEST" />
        <ProtoHeader variant="guest" />
      </View>

      {/* HEADER — AUTH */}
      <View style={s.section}>
        <NavLabel text="HEADER -- AUTH" />
        <ProtoHeader variant="auth" />
      </View>

      {/* HEADER — BACK */}
      <View style={s.section}>
        <NavLabel text="HEADER -- BACK" />
        <ProtoHeader variant="back" backTitle="Мои заявки" />
      </View>

      {/* TAB BAR — HOME ACTIVE */}
      <View style={s.section}>
        <NavLabel text="TAB BAR -- HOME ACTIVE" />
        <ProtoTabBar activeTab="home" />
      </View>

      {/* TAB BAR — REQUESTS ACTIVE */}
      <View style={s.section}>
        <NavLabel text="TAB BAR -- REQUESTS ACTIVE" />
        <ProtoTabBar activeTab="requests" />
      </View>

      {/* TAB BAR — MESSAGES ACTIVE */}
      <View style={s.section}>
        <NavLabel text="TAB BAR -- MESSAGES ACTIVE" />
        <ProtoTabBar activeTab="messages" />
      </View>

      {/* TAB BAR — PROFILE ACTIVE */}
      <View style={s.section}>
        <NavLabel text="TAB BAR -- PROFILE ACTIVE" />
        <ProtoTabBar activeTab="profile" />
      </View>

      {/* TAB BAR — INTERACTIVE */}
      <View style={s.section}>
        <NavLabel text="TAB BAR -- INTERACTIVE" />
        <ProtoTabBar activeTab={interactiveTab} onTabChange={setInteractiveTab} />
      </View>

      {/* BURGER — CLOSED */}
      <View style={s.section}>
        <NavLabel text="BURGER -- CLOSED" />
        <ProtoBurger open={false} />
      </View>

      {/* BURGER — OPEN */}
      <View style={s.section}>
        <NavLabel text="BURGER -- OPEN" />
        <ProtoBurger open={true} />
      </View>

      {/* BURGER — INTERACTIVE */}
      <View style={s.section}>
        <NavLabel text="BURGER -- INTERACTIVE" />
        <ProtoBurger open={burgerOpen} onToggle={() => setBurgerOpen(!burgerOpen)} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: Spacing['3xl'],
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  labelBox: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  labelText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
