import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';

export function OverviewStates() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>P2PTax</Text>
        <Text style={styles.subtitle}>Tax information arbitrage -- find specialists (lawyers, tax consultants) in any city</Text>

        <Text style={styles.sectionTitle}>Roles</Text>
        <Text style={styles.item}>Guest -- browse public requests, specialists catalog, pricing</Text>
        <Text style={styles.item}>Client -- create requests, view responses, chat with specialists</Text>
        <Text style={styles.item}>Specialist -- respond to requests, manage profile, receive messages</Text>
        <Text style={styles.item}>Admin -- manage users, requests, moderation, reviews, promotions</Text>

        <Text style={styles.sectionTitle}>Pages</Text>
        <Text style={styles.groupTitle}>Auth</Text>
        <Text style={styles.item}>Email Login, OTP Verification</Text>

        <Text style={styles.groupTitle}>Onboarding (Specialist)</Text>
        <Text style={styles.item}>Username, Work Area (City/FNS/Services), Profile</Text>

        <Text style={styles.groupTitle}>Dashboard (Client)</Text>
        <Text style={styles.item}>Home, My Requests, New Request, Request Detail, Responses, Messages, Chat, Profile, Settings</Text>

        <Text style={styles.groupTitle}>Specialist</Text>
        <Text style={styles.item}>Dashboard, Respond to Request, Public Profile</Text>

        <Text style={styles.groupTitle}>Public</Text>
        <Text style={styles.item}>Landing, Public Requests Feed, Request Detail, Specialists Catalog, Pricing</Text>

        <Text style={styles.groupTitle}>Admin</Text>
        <Text style={styles.item}>Dashboard, Users, Requests, Moderation, Reviews, Promotions</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: Platform.OS === 'web' ? ('100vh' as any) : 844, backgroundColor: '#fff' },
  content: { padding: 32, maxWidth: 600 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, marginTop: 24 },
  groupTitle: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 12, marginBottom: 4 },
  item: { fontSize: 14, color: '#555', marginBottom: 4, paddingLeft: 12 },
});
