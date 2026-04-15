import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../../lib/api';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AvatarPicker } from '../../components/AvatarPicker';
import { toast } from '../../lib/toast';

interface SpecialistProfile {
  id: string;
  nick: string;
  displayName?: string;
  bio?: string;
  headline?: string;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  avatarUrl: string | null;
  officeAddress: string | null;
  workingHours: string | null;
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<SpecialistProfile>('/specialists/me');
      setProfile(data);
      setDisplayName(data.displayName ?? '');
      setBio(data.bio ?? '');
      setHeadline(data.headline ?? '');
      setPhone(data.phone ?? '');
      setTelegram(data.telegram ?? '');
      setWhatsapp(data.whatsapp ?? '');
      setOfficeAddress(data.officeAddress ?? '');
      setWorkingHours(data.workingHours ?? '');
      setAvatarUrl(data.avatarUrl ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch<SpecialistProfile>('/specialists/me', {
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        headline: headline.trim() || undefined,
        phone: phone.trim() || null,
        telegram: telegram.trim() || null,
        whatsapp: whatsapp.trim() || null,
        officeAddress: officeAddress.trim() || null,
        workingHours: workingHours.trim() || null,
      });
      toast.success('Profile saved');
      router.back();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Edit profile" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Edit profile" showBack />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={fetchProfile} variant="ghost">
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Edit profile" showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <AvatarPicker
                currentUri={avatarUrl ?? undefined}
                name={displayName || profile?.nick}
                size="xl"
                onUploaded={(url) => setAvatarUrl(url)}
              />
            </View>

            {/* Nick (read-only) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic info</Text>
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyLabel}>Nick</Text>
                <Text style={styles.readonlyValue}>{profile?.nick ?? ''}</Text>
              </View>

              <Input
                label="Display name"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Ivan Petrov"
                autoCapitalize="words"
              />

              <Input
                label="Headline"
                value={headline}
                onChangeText={setHeadline}
                placeholder="Tax consultant with 10 years experience"
                autoCapitalize="sentences"
                maxLength={150}
                showCharCount
              />

              <Input
                label="Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell about your experience..."
                autoCapitalize="sentences"
                multiline
                numberOfLines={4}
                minHeight={100}
                maxLength={1000}
                showCharCount
              />
            </View>

            {/* Contacts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contacts</Text>

              <Input
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="+7 (___) ___-__-__"
                keyboardType="phone-pad"
              />

              <Input
                label="Telegram"
                value={telegram}
                onChangeText={setTelegram}
                placeholder="@username"
                autoCapitalize="none"
              />

              <Input
                label="WhatsApp"
                value={whatsapp}
                onChangeText={setWhatsapp}
                placeholder="+7 (___) ___-__-__"
                keyboardType="phone-pad"
              />

              <Input
                label="Office address"
                value={officeAddress}
                onChangeText={setOfficeAddress}
                placeholder="Moscow, Example St., 1, office 101"
                autoCapitalize="sentences"
              />

              <Input
                label="Working hours"
                value={workingHours}
                onChangeText={setWorkingHours}
                placeholder="Mon-Fri 9:00-18:00"
                autoCapitalize="sentences"
              />
            </View>

            {/* Work area link */}
            <Button
              onPress={() => router.push('/profile/work-area-edit')}
              variant="outline"
              style={styles.workAreaBtn}
            >
              Edit work area (FNS / services)
            </Button>

            {/* Save */}
            <Button
              onPress={handleSave}
              variant="primary"
              loading={saving}
              disabled={saving}
              style={styles.saveBtn}
            >
              Save
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  container: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  readonlyField: {
    gap: 4,
  },
  readonlyLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  readonlyValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  errorText: {
    fontSize: Typography.fontSize.base,
    color: Colors.statusError,
    textAlign: 'center',
  },
  workAreaBtn: {
    width: '100%',
  },
  saveBtn: {
    width: '100%',
    marginBottom: Spacing['3xl'],
  },
});
