import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ProtoLayout } from '../../../components/proto/ProtoLayout';
import { PageIdProvider } from '../../../components/proto/StateSection';
import { getPageById } from '../../../constants/pageRegistry';
import { Colors, Typography, Spacing } from '../../../constants/Colors';

// State components
import { OverviewStates } from '../../../components/proto/states/OverviewStates';
import { BrandStates } from '../../../components/proto/states/BrandStates';
import { NavComponentsStates } from '../../../components/proto/states/NavComponentsStates';
import { ComponentsStates } from '../../../components/proto/states/ComponentsStates';
import { AuthEmailStates } from '../../../components/proto/states/AuthEmailStates';
import { AuthOtpStates } from '../../../components/proto/states/AuthOtpStates';
import { OnboardingUsernameStates } from '../../../components/proto/states/OnboardingUsernameStates';
import { OnboardingProfileStates } from '../../../components/proto/states/OnboardingProfileStates';
import { OnboardingWorkAreaStates } from '../../../components/proto/states/OnboardingWorkAreaStates';
import { LandingStates } from '../../../components/proto/states/LandingStates';
import { SpecialistsCatalogStates } from '../../../components/proto/states/SpecialistsCatalogStates';
import { SpecialistProfilePublicStates } from '../../../components/proto/states/SpecialistProfilePublicStates';
import { PublicRequestsStates } from '../../../components/proto/states/PublicRequestsStates';
import { PublicRequestDetailStates } from '../../../components/proto/states/PublicRequestDetailStates';
import { TermsStates } from '../../../components/proto/states/TermsStates';
import { PricingStates } from '../../../components/proto/states/PricingStates';
import { DashboardStates } from '../../../components/proto/states/DashboardStates';
import { MyRequestsStates } from '../../../components/proto/states/MyRequestsStates';
import { MyRequestsNewStates } from '../../../components/proto/states/MyRequestsNewStates';
import { MyRequestDetailStates } from '../../../components/proto/states/MyRequestDetailStates';
import { MessagesStates } from '../../../components/proto/states/MessagesStates';
import { MessageThreadStates } from '../../../components/proto/states/MessageThreadStates';
import { SettingsStates } from '../../../components/proto/states/SettingsStates';
import { SpecialistDashboardStates } from '../../../components/proto/states/SpecialistDashboardStates';
import { SpecialistSettingsStates } from '../../../components/proto/states/SpecialistSettingsStates';
import { AdminDashboardStates } from '../../../components/proto/states/AdminDashboardStates';
import { AdminUsersStates } from '../../../components/proto/states/AdminUsersStates';
import { AdminRequestsStates } from '../../../components/proto/states/AdminRequestsStates';
import { AdminModerationStates } from '../../../components/proto/states/AdminModerationStates';
import { AdminReviewsStates } from '../../../components/proto/states/AdminReviewsStates';
import { AdminPromotionsStates } from '../../../components/proto/states/AdminPromotionsStates';
import { NotFoundStates } from '../../../components/proto/states/NotFoundStates';

const STATE_MAP: Record<string, React.ComponentType> = {
  'overview': OverviewStates,
  'brand': BrandStates,
  'nav-components': NavComponentsStates,
  'components': ComponentsStates,
  'auth-email': AuthEmailStates,
  'auth-otp': AuthOtpStates,
  'onboarding-username': OnboardingUsernameStates,
  'onboarding-profile': OnboardingProfileStates,
  'work-area': OnboardingWorkAreaStates,
  'landing': LandingStates,
  'specialists-catalog': SpecialistsCatalogStates,
  'specialist-public-profile': SpecialistProfilePublicStates,
  'public-requests-feed': PublicRequestsStates,
  'public-request-detail': PublicRequestDetailStates,
  'terms': TermsStates,
  'pricing': PricingStates,
  'dashboard': DashboardStates,
  'my-requests': MyRequestsStates,
  'new-request': MyRequestsNewStates,
  'request-detail': MyRequestDetailStates,
  'messages': MessagesStates,
  'chat-thread': MessageThreadStates,
  'client-settings': SettingsStates,
  'specialist-dashboard': SpecialistDashboardStates,
  'specialist-settings': SpecialistSettingsStates,
  'admin-dashboard': AdminDashboardStates,
  'admin-users': AdminUsersStates,
  'admin-requests': AdminRequestsStates,
  'admin-moderation': AdminModerationStates,
  'admin-reviews': AdminReviewsStates,
  'admin-promotions': AdminPromotionsStates,
  'not-found': NotFoundStates,
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
      <ProtoLayout title={pageData.title} route={pageData.route} nav={pageData.nav} activeTab={pageData.activeTab}>
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
