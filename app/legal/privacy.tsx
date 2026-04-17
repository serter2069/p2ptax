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

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-12">
        {/* Header */}
        <View className="flex-row items-center pt-2 pb-3 border-b border-gray-100 mb-4">
          <Pressable onPress={() => router.back()} className="mr-3">
            <FontAwesome name="arrow-left" size={18} color="#374151" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Privacy Policy</Text>
        </View>

        <Text className="text-sm text-gray-400 mb-4">Last updated: April 2026</Text>

        <Paragraph>
          This Privacy Policy describes how Etalon ("we", "us", or "our") collects, uses, and
          shares information about you when you use our marketplace application and services.
        </Paragraph>

        <SectionHeading>1. Information We Collect</SectionHeading>
        <Paragraph>
          We collect information you provide directly to us, such as when you create an account,
          post a listing, send a message, or contact us for support. This includes your email
          address, name, profile information, and listing details.
        </Paragraph>

        <SectionHeading>2. How We Use Your Information</SectionHeading>
        <Paragraph>
          We use the information we collect to provide, maintain, and improve our services,
          process transactions, send you technical notices and support messages, and respond
          to your comments and questions.
        </Paragraph>

        <SectionHeading>3. Sharing of Information</SectionHeading>
        <Paragraph>
          We do not sell your personal information. We may share information with third-party
          service providers who perform services on our behalf, such as email delivery, hosting,
          and analytics. We may also share information when required by law.
        </Paragraph>

        <SectionHeading>4. Data Security</SectionHeading>
        <Paragraph>
          We take reasonable measures to help protect information about you from loss, theft,
          misuse, unauthorized access, disclosure, alteration, and destruction. All data is
          transmitted over encrypted connections (TLS/SSL).
        </Paragraph>

        <SectionHeading>5. Data Retention</SectionHeading>
        <Paragraph>
          We retain your personal information for as long as your account is active or as
          needed to provide you services. You may request deletion of your account and
          associated data at any time through the app settings.
        </Paragraph>

        <SectionHeading>6. Your Rights</SectionHeading>
        <Paragraph>
          You have the right to access, correct, or delete your personal information.
          You may also object to or restrict certain processing of your data. To exercise
          these rights, contact us through the app or at privacy@etalon.app.
        </Paragraph>

        <SectionHeading>7. Contact Us</SectionHeading>
        <Paragraph>
          If you have any questions about this Privacy Policy, please contact us at
          privacy@etalon.app.
        </Paragraph>
      </ScrollView>
    </SafeAreaView>
  );
}
