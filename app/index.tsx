import React from 'react';
import { ScrollView, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Header } from '../components/Header';
import {
  BottomCTA,
  Footer,
  Hero,
  HowItWorks,
  Services,
  Specialists,
  Stats,
} from '../components/landing/sections';

export default function LandingPage() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPrimary }}>
      <Header variant="guest" />
      <ScrollView style={{ backgroundColor: Colors.bgPrimary }}>
        <Hero />
        <Specialists />
        <Services />
        <HowItWorks />
        <Stats />
        <BottomCTA />
        <Footer />
      </ScrollView>
    </View>
  );
}
