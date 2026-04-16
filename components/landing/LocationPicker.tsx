import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/Colors';
import { Text } from '../ui';

// Fixed service list per product spec
export const SERVICES = [
  'Выездная проверка',
  'Отдел оперативного контроля',
  'Камеральная проверка',
  'Не знаю',
];

export interface LocationPickerProps {
  city: string;
  fns: string;
  service: string;
  onCityChange: (v: string) => void;
  onFnsChange: (v: string) => void;
  onServiceChange: (v: string) => void;
  cities: string[];
  fnsByCity: Record<string, string[]>;
}

type Level = 'city' | 'fns' | 'service' | null;

/**
 * Cascading City / FNS / Service picker for the landing form.
 *
 * Kept as a local component (not a primitive) because the tri-level dropdown
 * flow is landing-specific — a generic `<Dropdown>` primitive does not exist.
 */
export function LocationPicker({
  city,
  fns,
  service,
  onCityChange,
  onFnsChange,
  onServiceChange,
  cities,
  fnsByCity,
}: LocationPickerProps) {
  const [openLevel, setOpenLevel] = useState<Level>(null);
  const fnsOptions = city ? (fnsByCity[city] || []) : [];
  const summary = city ? [city, fns, service].filter(Boolean).join(' / ') : '';

  return (
    <View style={{ gap: Spacing.xs }}>
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            borderRadius: BorderRadius.input,
            borderWidth: 1,
            borderColor: openLevel ? Colors.brandPrimary : Colors.borderLight,
            backgroundColor: Colors.white,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm + 2,
          }}
        >
          <Feather name="map-pin" size={14} color={Colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text
              variant={summary ? 'body' : 'muted'}
              numberOfLines={2}
              style={{ fontSize: Typography.fontSize.sm, color: summary ? Colors.textPrimary : Colors.textMuted }}
            >
              {summary || 'Город, ФНС и услуга'}
            </Text>
          </View>
          <Feather
            name={openLevel ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.textMuted}
          />
        </View>
      </Pressable>

      {openLevel ? (
        <View
          style={{
            overflow: 'hidden',
            borderRadius: BorderRadius.input,
            borderWidth: 1,
            borderColor: Colors.borderLight,
            backgroundColor: Colors.white,
          }}
        >
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.bgSecondary }}>
            <StepTab
              label={city || 'Город'}
              active={openLevel === 'city'}
              filled={!!city}
              onPress={() => setOpenLevel('city')}
            />
            <StepTab
              label={fns ? fns.replace(/^ФНС\s*/, '').substring(0, 18) : 'ФНС'}
              active={openLevel === 'fns'}
              filled={!!fns}
              disabled={!city}
              onPress={() => city && setOpenLevel('fns')}
            />
            <StepTab
              label={service || 'Услуга'}
              active={openLevel === 'service'}
              filled={!!service}
              disabled={!fns}
              onPress={() => fns && setOpenLevel('service')}
            />
          </View>

          <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
            {openLevel === 'city' &&
              cities.map((c) => (
                <OptionRow
                  key={c}
                  label={c}
                  selected={city === c}
                  onPress={() => {
                    onCityChange(c);
                    onFnsChange('');
                    onServiceChange('');
                    setOpenLevel('fns');
                  }}
                />
              ))}
            {openLevel === 'fns' &&
              fnsOptions.map((f) => (
                <OptionRow
                  key={f}
                  label={f}
                  selected={fns === f}
                  onPress={() => {
                    onFnsChange(f);
                    setOpenLevel('service');
                  }}
                />
              ))}
            {openLevel === 'service' &&
              SERVICES.map((s) => (
                <OptionRow
                  key={s}
                  label={s}
                  selected={service === s}
                  onPress={() => {
                    onServiceChange(s);
                    setOpenLevel(null);
                  }}
                />
              ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function StepTab({
  label,
  active,
  filled,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  filled: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const color = active ? Colors.brandPrimary : filled ? Colors.textPrimary : Colors.textMuted;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: active ? 2 : 0,
        borderBottomColor: Colors.brandPrimary,
      }}
    >
      <Text
        style={{
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.semibold,
          fontFamily: Typography.fontFamily.semibold,
          color,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderBottomWidth: 1,
        borderBottomColor: Colors.bgSecondary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
      }}
    >
      <Text
        style={{
          fontSize: Typography.fontSize.sm,
          color: selected ? Colors.brandPrimary : Colors.textPrimary,
          fontWeight: selected ? Typography.fontWeight.semibold : Typography.fontWeight.regular,
          fontFamily: selected ? Typography.fontFamily.semibold : Typography.fontFamily.regular,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
