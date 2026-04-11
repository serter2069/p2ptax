import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ProtoLayout } from '../../../components/proto/ProtoLayout';
import { PageIdProvider } from '../../../components/proto/StateSection';
import { getPageById } from '../../../constants/pageRegistry';
import { Colors, Typography, Spacing } from '../../../constants/Colors';

// State components
import { OverviewStates } from '../../../components/proto/states/OverviewStates';
import { BrandStyleStates } from '../../../components/proto/states/BrandStyleStates';
import { AuthEmailStates } from '../../../components/proto/states/AuthEmailStates';
import { AuthOtpStates } from '../../../components/proto/states/AuthOtpStates';
import { OnboardingUsernameStates } from '../../../components/proto/states/OnboardingUsernameStates';
import { OnboardingWorkAreaStates } from '../../../components/proto/states/OnboardingWorkAreaStates';
import { OnboardingProfileStates } from '../../../components/proto/states/OnboardingProfileStates';
import { DashboardStates } from '../../../components/proto/states/DashboardStates';
import { MyRequestsStates } from '../../../components/proto/states/MyRequestsStates';
import { MyRequestsNewStates } from '../../../components/proto/states/MyRequestsNewStates';
import { MyRequestDetailStates } from '../../../components/proto/states/MyRequestDetailStates';
import { ResponsesStates } from '../../../components/proto/states/ResponsesStates';
import { MessagesStates } from '../../../components/proto/states/MessagesStates';
import { MessageThreadStates } from '../../../components/proto/states/MessageThreadStates';
import { ProfileStates } from '../../../components/proto/states/ProfileStates';
import { SettingsStates } from '../../../components/proto/states/SettingsStates';
import { SpecialistDashboardStates } from '../../../components/proto/states/SpecialistDashboardStates';
import { SpecialistRespondStates } from '../../../components/proto/states/SpecialistRespondStates';
import { SpecialistProfilePublicStates } from '../../../components/proto/states/SpecialistProfilePublicStates';
import { LandingStates } from '../../../components/proto/states/LandingStates';
import { PublicRequestsStates } from '../../../components/proto/states/PublicRequestsStates';
import { PublicRequestDetailStates } from '../../../components/proto/states/PublicRequestDetailStates';
import { SpecialistsCatalogStates } from '../../../components/proto/states/SpecialistsCatalogStates';
import { PricingStates } from '../../../components/proto/states/PricingStates';
import { AdminDashboardStates } from '../../../components/proto/states/AdminDashboardStates';
import { AdminUsersStates } from '../../../components/proto/states/AdminUsersStates';
import { AdminRequestsStates } from '../../../components/proto/states/AdminRequestsStates';
import { AdminModerationStates } from '../../../components/proto/states/AdminModerationStates';
import { AdminReviewsStates } from '../../../components/proto/states/AdminReviewsStates';
import { AdminPromotionsStates } from '../../../components/proto/states/AdminPromotionsStates';
import { NavComponentsStates } from '../../../components/proto/states/NavComponentsStates';
import { ComponentsStates } from '../../../components/proto/states/ComponentsStates';
import { BrandStates } from '../../../components/proto/states/BrandStates';

const STATE_MAP: Record<string, React.ComponentType> = {
  'overview': OverviewStates,
  'brand': BrandStates,
  'nav-components': NavComponentsStates,
  'brand-style': BrandStyleStates,
  'components': ComponentsStates,
  'auth-email': AuthEmailStates,
  'auth-otp': AuthOtpStates,
  'onboarding-username': OnboardingUsernameStates,
  'onboarding-work-area': OnboardingWorkAreaStates,
  'onboarding-profile': OnboardingProfileStates,
  'dashboard': DashboardStates,
  'my-requests': MyRequestsStates,
  'my-requests-new': MyRequestsNewStates,
  'my-request-detail': MyRequestDetailStates,
  'responses': ResponsesStates,
  'messages': MessagesStates,
  'message-thread': MessageThreadStates,
  'profile': ProfileStates,
  'settings': SettingsStates,
  'specialist-dashboard': SpecialistDashboardStates,
  'specialist-respond': SpecialistRespondStates,
  'specialist-profile-public': SpecialistProfilePublicStates,
  'landing': LandingStates,
  'public-requests': PublicRequestsStates,
  'public-request-detail': PublicRequestDetailStates,
  'specialists-catalog': SpecialistsCatalogStates,
  'pricing': PricingStates,
  'admin-dashboard': AdminDashboardStates,
  'admin-users': AdminUsersStates,
  'admin-requests': AdminRequestsStates,
  'admin-moderation': AdminModerationStates,
  'admin-reviews': AdminReviewsStates,
  'admin-promotions': AdminPromotionsStates,
};

export default function ProtoStatesPage() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const pageData = getPageById(page || '');
  const StatesComponent = page ? STATE_MAP[page] : undefined;

  if (!pageData || !StatesComponent) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>Страница не найдена</Text>
        <Text style={styles.notFoundText}>Proto page "{page}" не существует в реестре</Text>
      </View>
    );
  }

  return (
    <PageIdProvider value={page || ''}>
      <ProtoLayout title={pageData.title} route={pageData.route} nav={pageData.nav}>
        <StatesComponent />
      </ProtoLayout>
    </PageIdProvider>
  );
}

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },
  notFoundTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  notFoundText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
});
