import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

function SectionHeading({ children }: { children: string }) {
  return <Text className="text-lg font-bold text-gray-900 mt-6 mb-2">{children}</Text>;
}

function Paragraph({ children }: { children: string }) {
  return <Text className="text-base text-gray-600 leading-7 mb-3">{children}</Text>;
}

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-12">
        {/* Header */}
        <View className="flex-row items-center pt-2 pb-3 border-b border-gray-100 mb-4">
          <Pressable onPress={() => router.back()} className="mr-3">
            <FontAwesome name="arrow-left" size={18} color="#374151" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Terms of Service</Text>
        </View>

        <Text className="text-sm text-gray-400 mb-4">Last updated: April 2026</Text>

        <Paragraph>
          By accessing or using Etalon, you agree to be bound by these Terms of Service.
          If you do not agree, please do not use our services.
        </Paragraph>

        <SectionHeading>1. Eligibility</SectionHeading>
        <Paragraph>
          You must be at least 18 years old to use our services. By using Etalon, you
          represent and warrant that you meet this requirement.
        </Paragraph>

        <SectionHeading>2. Account Responsibilities</SectionHeading>
        <Paragraph>
          You are responsible for maintaining the confidentiality of your account and for
          all activities that occur under your account. You agree to notify us immediately
          of any unauthorized use.
        </Paragraph>

        <SectionHeading>3. Listing Guidelines</SectionHeading>
        <Paragraph>
          All listings must be for legal items and services. You may not list counterfeit
          goods, stolen property, weapons, drugs, or any items prohibited by applicable law.
          We reserve the right to remove any listing at our discretion.
        </Paragraph>

        <SectionHeading>4. Transactions</SectionHeading>
        <Paragraph>
          Etalon provides a platform for buyers and sellers to connect. We are not a party
          to any transaction between users. We do not guarantee the quality, safety, or
          legality of items listed.
        </Paragraph>

        <SectionHeading>5. Prohibited Conduct</SectionHeading>
        <Paragraph>
          You may not use our services to: engage in fraud, harassment, or abuse; post
          misleading content; interfere with the operation of the platform; or violate any
          applicable laws or regulations.
        </Paragraph>

        <SectionHeading>6. Intellectual Property</SectionHeading>
        <Paragraph>
          The Etalon name, logo, and all related marks are our intellectual property.
          Content you post remains yours, but you grant us a non-exclusive license to
          display it on our platform.
        </Paragraph>

        <SectionHeading>7. Limitation of Liability</SectionHeading>
        <Paragraph>
          Etalon is provided "as is" without warranties of any kind. We shall not be
          liable for any indirect, incidental, or consequential damages arising from
          your use of the platform.
        </Paragraph>

        <SectionHeading>8. Changes to Terms</SectionHeading>
        <Paragraph>
          We may update these terms from time to time. Continued use of the platform
          after changes constitutes acceptance of the new terms.
        </Paragraph>

        <SectionHeading>9. Contact</SectionHeading>
        <Paragraph>
          For questions about these Terms of Service, contact us at legal@etalon.app.
        </Paragraph>
      </ScrollView>
    </SafeAreaView>
  );
}
