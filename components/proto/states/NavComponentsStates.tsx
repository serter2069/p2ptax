import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StateSection } from '../StateSection';
import { ProtoHeader, ProtoTabBar, ProtoBurger } from '../NavComponents';
import { Colors, Spacing, Typography } from '../../../constants/Colors';

export function NavComponentsStates() {
  const [interactiveTab, setInteractiveTab] = useState('home');
  const [burgerOpen, setBurgerOpen] = useState(false);

  return (
    <>
      <StateSection title="HEADER_GUEST">
        <View style={s.sectionContent}>
          <ProtoHeader variant="guest" />
        </View>
      </StateSection>

      <StateSection title="HEADER_AUTH">
        <View style={s.sectionContent}>
          <ProtoHeader variant="auth" />
        </View>
      </StateSection>

      <StateSection title="HEADER_BACK">
        <View style={s.sectionContent}>
          <ProtoHeader variant="back" backTitle="Мои заявки" />
        </View>
      </StateSection>

      <StateSection title="TABBAR_HOME">
        <View style={s.sectionContent}>
          <ProtoTabBar activeTab="home" />
        </View>
      </StateSection>

      <StateSection title="TABBAR_REQUESTS">
        <View style={s.sectionContent}>
          <ProtoTabBar activeTab="requests" />
        </View>
      </StateSection>

      <StateSection title="TABBAR_MESSAGES">
        <View style={s.sectionContent}>
          <ProtoTabBar activeTab="messages" />
        </View>
      </StateSection>

      <StateSection title="TABBAR_PROFILE">
        <View style={s.sectionContent}>
          <ProtoTabBar activeTab="profile" />
        </View>
      </StateSection>

      <StateSection title="TABBAR_INTERACTIVE">
        <View style={s.sectionContent}>
          <ProtoTabBar activeTab={interactiveTab} onTabChange={setInteractiveTab} />
        </View>
      </StateSection>

      <StateSection title="BURGER_CLOSED">
        <View style={s.sectionContent}>
          <ProtoBurger open={false} />
        </View>
      </StateSection>

      <StateSection title="BURGER_OPEN">
        <View style={s.sectionContent}>
          <ProtoBurger open={true} />
        </View>
      </StateSection>

      <StateSection title="BURGER_INTERACTIVE">
        <View style={s.sectionContent}>
          <ProtoBurger open={burgerOpen} onToggle={() => setBurgerOpen(!burgerOpen)} />
        </View>
      </StateSection>
    </>
  );
}

const s = StyleSheet.create({
  sectionContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
});
