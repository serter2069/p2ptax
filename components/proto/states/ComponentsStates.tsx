import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/Colors';
import { ProtoHeader, ProtoTabBar, ProtoBurger } from '../NavComponents';

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.sectionWrap}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={s.label}>{text}</Text>;
}

// ---------------------------------------------------------------------------
// Section 1: Header variants
// ---------------------------------------------------------------------------
function HeaderVariantsSection() {
  return (
    <Section title="1. Navigation - Header variants">
      <Label text="guest - no avatar, login button" />
      <ProtoHeader variant="guest" />
      <View style={s.gap} />
      <Label text="auth - avatar + notifications" />
      <ProtoHeader variant="auth" />
      <View style={s.gap} />
      <Label text="back - arrow + page title" />
      <ProtoHeader variant="back" backTitle="Мои заявки" />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Bottom Tab Bar
// ---------------------------------------------------------------------------
function TabBarSection() {
  const [activeTab, setActiveTab] = useState('home');
  return (
    <Section title="2. Navigation - Bottom Tab Bar">
      <Label text={`Active tab: ${activeTab}`} />
      <ProtoTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Burger Menu
// ---------------------------------------------------------------------------
function BurgerSection() {
  const [open, setOpen] = useState(false);
  return (
    <Section title="3. Navigation - Burger Menu">
      <Label text="Click hamburger icon to toggle drawer" />
      <ProtoBurger open={open} onToggle={() => setOpen(!open)} />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Section 4: Search
// ---------------------------------------------------------------------------
const CITIES = [
  'Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Екатеринбург',
  'Краснодар', 'Самара', 'Уфа', 'Челябинск', 'Ростов-на-Дону',
];

function SearchSection() {
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('');

  const handleCitySearch = (text: string) => {
    setCityQuery(text);
    setSelectedCity('');
    if (text.length > 0) {
      setCityResults(CITIES.filter(c => c.toLowerCase().includes(text.toLowerCase())));
    } else {
      setCityResults([]);
    }
  };

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setCityQuery(city);
    setCityResults([]);
  };

  return (
    <Section title="4. Search">
      <Label text="Search by city (type to filter)" />
      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={Colors.textMuted} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Введите город..."
          placeholderTextColor={Colors.textMuted}
          value={cityQuery}
          onChangeText={handleCitySearch}
        />
        {cityQuery.length > 0 && (
          <Pressable onPress={() => { setCityQuery(''); setCityResults([]); setSelectedCity(''); }}>
            <Feather name="x" size={16} color={Colors.textMuted} />
          </Pressable>
        )}
      </View>
      {cityResults.length > 0 && (
        <View style={s.dropdownList}>
          {cityResults.map((city) => (
            <Pressable key={city} style={s.dropdownItem} onPress={() => handleSelectCity(city)}>
              <Feather name="map-pin" size={14} color={Colors.textMuted} />
              <Text style={s.dropdownItemText}>{city}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {selectedCity !== '' && (
        <View style={s.selectedRow}>
          <Feather name="check-circle" size={14} color={Colors.statusSuccess} />
          <Text style={s.selectedText}>Выбран: {selectedCity}</Text>
        </View>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Section 5: Inputs
// ---------------------------------------------------------------------------
function InputsSection() {
  const [defaultVal, setDefaultVal] = useState('');
  const [focusedVal, setFocusedVal] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [errorVal, setErrorVal] = useState('');
  const [showError, setShowError] = useState(false);
  const [iconVal, setIconVal] = useState('');
  const [multiVal, setMultiVal] = useState('');

  return (
    <Section title="5. Inputs">
      <Label text="Default" />
      <TextInput
        style={s.input}
        placeholder="Введите текст..."
        placeholderTextColor={Colors.textMuted}
        value={defaultVal}
        onChangeText={setDefaultVal}
      />

      <Label text="Focused (tap to focus)" />
      <TextInput
        style={[s.input, isFocused && s.inputFocused]}
        placeholder="Нажмите для фокуса..."
        placeholderTextColor={Colors.textMuted}
        value={focusedVal}
        onChangeText={setFocusedVal}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <Label text="Error state (type and clear to trigger)" />
      <TextInput
        style={[s.input, showError && s.inputError]}
        placeholder="Email"
        placeholderTextColor={Colors.textMuted}
        value={errorVal}
        onChangeText={(t) => { setErrorVal(t); setShowError(t.length > 0 && !t.includes('@')); }}
      />
      {showError && <Text style={s.errorText}>Введите корректный email</Text>}

      <Label text="With icon (left)" />
      <View style={s.inputIconWrap}>
        <Feather name="mail" size={16} color={Colors.textMuted} style={s.inputIconLeft} />
        <TextInput
          style={s.inputWithIcon}
          placeholder="email@example.com"
          placeholderTextColor={Colors.textMuted}
          value={iconVal}
          onChangeText={setIconVal}
        />
      </View>

      <Label text="Multiline / textarea" />
      <TextInput
        style={s.inputMultiline}
        placeholder="Опишите вашу проблему подробнее..."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={4}
        value={multiVal}
        onChangeText={setMultiVal}
        textAlignVertical="top"
      />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Section 6: Buttons
// ---------------------------------------------------------------------------
function ButtonsSection() {
  return (
    <Section title="6. Buttons">
      <Label text="Primary" />
      <View style={s.btnRow}>
        <Pressable style={s.btnPrimary}><Text style={s.btnPrimaryText}>Primary</Text></Pressable>
        <Pressable style={[s.btnPrimary, s.btnDisabled]}><Text style={[s.btnPrimaryText, s.btnDisabledText]}>Disabled</Text></Pressable>
      </View>

      <Label text="Secondary" />
      <View style={s.btnRow}>
        <Pressable style={s.btnSecondary}><Text style={s.btnSecondaryText}>Secondary</Text></Pressable>
        <Pressable style={[s.btnSecondary, s.btnSecondaryDisabled]}><Text style={[s.btnSecondaryText, s.btnSecondaryDisabledText]}>Disabled</Text></Pressable>
      </View>

      <Label text="Ghost / Outline" />
      <View style={s.btnRow}>
        <Pressable style={s.btnGhost}><Text style={s.btnGhostText}>Ghost</Text></Pressable>
      </View>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Section 7: Select / Dropdown
// ---------------------------------------------------------------------------
const SERVICES = ['Бухгалтерия', 'Налоговый учёт', 'Юридические услуги', 'Аудит', 'Регистрация ИП/ООО'];

function SelectSection() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');

  return (
    <Section title="7. Select / Dropdown">
      <Label text="Service type" />
      <Pressable style={s.selectTrigger} onPress={() => setOpen(!open)}>
        <Text style={[s.selectTriggerText, !selected && s.selectPlaceholder]}>
          {selected || 'Выберите услугу'}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
      </Pressable>
      {open && (
        <View style={s.dropdownList}>
          {SERVICES.map((svc) => (
            <Pressable
              key={svc}
              style={[s.dropdownItem, selected === svc && s.dropdownItemSelected]}
              onPress={() => { setSelected(svc); setOpen(false); }}
            >
              {selected === svc && <Feather name="check" size={14} color={Colors.brandPrimary} />}
              <Text style={[s.dropdownItemText, selected === svc && s.dropdownItemTextSelected]}>{svc}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Section 8: Cards
// ---------------------------------------------------------------------------
function CardsSection() {
  return (
    <Section title="8. Cards">
      <Label text="Basic request card" />
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Декларация 3-НДФЛ</Text>
          <View style={[s.statusBadge, { backgroundColor: Colors.statusBg.info }]}>
            <Text style={[s.statusBadgeText, { color: Colors.brandPrimary }]}>Новая</Text>
          </View>
        </View>
        <View style={s.cardMeta}>
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text style={s.cardMetaText}>Москва</Text>
          <Feather name="briefcase" size={12} color={Colors.textMuted} />
          <Text style={s.cardMetaText}>Налоговый учёт</Text>
        </View>
      </View>

      <Label text="Card with specialist avatar" />
      <View style={s.card}>
        <View style={s.cardSpecialist}>
          <Image source={{ uri: 'https://picsum.photos/seed/spec1/80/80' }} style={s.cardAvatar} />
          <View style={s.cardSpecInfo}>
            <Text style={s.cardTitle}>Иванов Алексей</Text>
            <Text style={s.cardSubtitle}>Налоговый консультант</Text>
            <View style={s.cardRating}>
              <Feather name="star" size={12} color={Colors.statusWarning} />
              <Text style={s.cardRatingText}>4.8</Text>
              <Text style={s.cardMetaText}>(42 отзыва)</Text>
            </View>
          </View>
        </View>
      </View>

      <Label text="Card with action button" />
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Регистрация ИП</Text>
          <View style={[s.statusBadge, { backgroundColor: Colors.statusBg.warning }]}>
            <Text style={[s.statusBadgeText, { color: Colors.statusWarning }]}>В работе</Text>
          </View>
        </View>
        <View style={s.cardMeta}>
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text style={s.cardMetaText}>Казань</Text>
        </View>
        <View style={s.cardActions}>
          <Pressable style={s.cardActionBtn}>
            <Feather name="message-circle" size={14} color={Colors.white} />
            <Text style={s.cardActionBtnText}>Написать</Text>
          </Pressable>
          <Pressable style={s.cardActionBtnOutline}>
            <Feather name="eye" size={14} color={Colors.brandPrimary} />
            <Text style={s.cardActionBtnOutlineText}>Подробнее</Text>
          </Pressable>
        </View>
      </View>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Section 9: Badges & Tags
// ---------------------------------------------------------------------------
function BadgesSection() {
  return (
    <Section title="9. Badges & Tags">
      <View style={s.badgesRow}>
        <View style={[s.statusBadge, { backgroundColor: Colors.statusBg.info }]}>
          <Text style={[s.statusBadgeText, { color: Colors.brandPrimary }]}>Новый</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: Colors.statusBg.warning }]}>
          <Text style={[s.statusBadgeText, { color: Colors.statusWarning }]}>В работе</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: Colors.statusBg.success }]}>
          <Text style={[s.statusBadgeText, { color: Colors.statusSuccess }]}>Выполнен</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: Colors.statusBg.error }]}>
          <Text style={[s.statusBadgeText, { color: Colors.statusError }]}>Отклонён</Text>
        </View>
      </View>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Section 10: Alerts
// ---------------------------------------------------------------------------
function AlertsSection() {
  return (
    <Section title="10. Alerts">
      <View style={[s.alert, { backgroundColor: Colors.statusBg.info, borderColor: Colors.brandPrimary }]}>
        <Feather name="info" size={16} color={Colors.brandPrimary} />
        <Text style={[s.alertText, { color: Colors.brandPrimary }]}>
          Информационное сообщение для пользователя
        </Text>
      </View>
      <View style={[s.alert, { backgroundColor: Colors.statusBg.success, borderColor: Colors.statusSuccess }]}>
        <Feather name="check-circle" size={16} color={Colors.statusSuccess} />
        <Text style={[s.alertText, { color: Colors.statusSuccess }]}>
          Заявка успешно создана
        </Text>
      </View>
      <View style={[s.alert, { backgroundColor: Colors.statusBg.error, borderColor: Colors.statusError }]}>
        <Feather name="alert-circle" size={16} color={Colors.statusError} />
        <Text style={[s.alertText, { color: Colors.statusError }]}>
          Ошибка при отправке данных
        </Text>
      </View>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function ComponentsStates() {
  return (
    <StateSection title="SHOWCASE">
      <View style={{ minHeight: Platform.OS === 'web' ? 900 : 844 }}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
          <Text style={s.pageTitle}>UI Components</Text>
          <Text style={s.pageSubtitle}>Interactive showcase of all reusable components</Text>
          <HeaderVariantsSection />
          <TabBarSection />
          <BurgerSection />
          <SearchSection />
          <InputsSection />
          <ButtonsSection />
          <SelectSection />
          <CardsSection />
          <BadgesSection />
          <AlertsSection />
          <View style={s.footer} />
        </ScrollView>
      </View>
    </StateSection>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bgPrimary },
  scrollContent: { padding: Spacing.lg, gap: Spacing.lg },
  pageTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.sm,
  },
  footer: { height: Spacing['3xl'] },

  // Section wrapper
  sectionWrap: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
    marginBottom: Spacing.xs,
  },
  sectionBody: { gap: Spacing.md },

  // Label
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  gap: { height: Spacing.sm },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    height: 44,
    outlineStyle: 'none',
  } as any,
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  selectedText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.statusSuccess,
    fontWeight: Typography.fontWeight.medium,
  },

  // Dropdown (shared by search + select)
  dropdownList: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.bgSecondary,
  },
  dropdownItemTextSelected: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Inputs
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgPrimary,
    outlineStyle: 'none',
  } as any,
  inputFocused: {
    borderColor: Colors.brandPrimary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.statusError,
    borderWidth: 2,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusError,
    marginTop: -Spacing.sm + 2,
  },
  inputIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  inputIconLeft: { marginRight: Spacing.sm },
  inputWithIcon: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    height: 44,
    outlineStyle: 'none',
  } as any,
  inputMultiline: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgPrimary,
    minHeight: 100,
    outlineStyle: 'none',
  } as any,

  // Buttons
  btnRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  btnPrimary: {
    height: 44,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  btnPrimaryText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  btnDisabled: {
    backgroundColor: Colors.border,
  },
  btnDisabledText: {
    color: Colors.textMuted,
  },
  btnSecondary: {
    height: 44,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
  },
  btnSecondaryText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },
  btnSecondaryDisabled: {
    borderColor: Colors.border,
    backgroundColor: Colors.bgPrimary,
  },
  btnSecondaryDisabledText: {
    color: Colors.textMuted,
  },
  btnGhost: {
    height: 44,
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnGhostText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },

  // Select
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgPrimary,
  },
  selectTriggerText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  selectPlaceholder: {
    color: Colors.textMuted,
  },

  // Cards
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardMetaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  cardSpecialist: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgSecondary,
  },
  cardSpecInfo: { flex: 1, gap: 2 },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardRatingText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    height: 36,
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  cardActionBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  cardActionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  cardActionBtnOutlineText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.brandPrimary,
  },

  // Badges
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Alerts
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
  },
  alertText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
