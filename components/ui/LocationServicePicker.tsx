import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export interface LocationServicePickerProps {
  city: string;
  fns: string;
  service: string;
  onCityChange: (v: string) => void;
  onFnsChange: (v: string) => void;
  onServiceChange: (v: string) => void;
  cities: string[];
  fnsOptions: string[];
  services: string[];
  /** Placeholder for the main picker button */
  placeholder?: string;
  /** Label above the picker */
  label?: string;
}

export function LocationServicePicker({
  city,
  fns,
  service,
  onCityChange,
  onFnsChange,
  onServiceChange,
  cities,
  fnsOptions,
  services,
  placeholder = 'Select city, FNS, and service',
  label,
}: LocationServicePickerProps) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | 'service' | null>(null);

  const summary = city ? [city, fns, service].filter(Boolean).join(' / ') : '';

  return (
    <View className="gap-1">
      {label && <Text className="text-sm font-medium text-textSecondary">{label}</Text>}

      {/* Main picker button */}
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View
          className={`min-h-[48px] flex-row items-center gap-2 rounded-xl border px-4 py-3 ${
            openLevel ? 'border-brandPrimary' : 'border-borderLight'
          } bg-white`}
        >
          <Feather name="map-pin" size={16} color={Colors.textMuted} />
          <Text
            className={`flex-1 text-base ${summary ? 'text-textPrimary' : 'text-textMuted'}`}
            numberOfLines={2}
          >
            {summary || placeholder}
          </Text>
          <Feather
            name={openLevel ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textMuted}
          />
        </View>
      </Pressable>

      {/* Cascading dropdown panel */}
      {openLevel && (
        <View className="overflow-hidden rounded-xl border border-borderLight bg-white shadow-sm">
          {/* Step indicator */}
          <View className="flex-row border-b border-bgSecondary">
            <Pressable
              className={`flex-1 items-center py-2.5 ${
                openLevel === 'city' ? 'border-b-2 border-brandPrimary' : ''
              }`}
              onPress={() => setOpenLevel('city')}
            >
              <Text
                className={`text-xs font-semibold ${
                  openLevel === 'city'
                    ? 'text-brandPrimary'
                    : city
                      ? 'text-textPrimary'
                      : 'text-textMuted'
                }`}
              >
                {city || 'City'}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2.5 ${
                openLevel === 'fns' ? 'border-b-2 border-brandPrimary' : ''
              }`}
              onPress={() => city && setOpenLevel('fns')}
              disabled={!city}
            >
              <Text
                className={`text-xs font-semibold ${
                  openLevel === 'fns'
                    ? 'text-brandPrimary'
                    : fns
                      ? 'text-textPrimary'
                      : 'text-textMuted'
                }`}
              >
                {fns ? fns.replace(/^FNS\s*/, '').substring(0, 20) : 'FNS'}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center py-2.5 ${
                openLevel === 'service' ? 'border-b-2 border-brandPrimary' : ''
              }`}
              onPress={() => fns && setOpenLevel('service')}
              disabled={!fns}
            >
              <Text
                className={`text-xs font-semibold ${
                  openLevel === 'service'
                    ? 'text-brandPrimary'
                    : service
                      ? 'text-textPrimary'
                      : 'text-textMuted'
                }`}
              >
                {service || 'Service'}
              </Text>
            </Pressable>
          </View>

          {/* Options list */}
          <View className="max-h-48">
            {openLevel === 'city' &&
              cities.map((c) => (
                <Pressable
                  key={c}
                  className="border-b border-bgSecondary px-4 py-3"
                  onPress={() => {
                    onCityChange(c);
                    onFnsChange('');
                    onServiceChange('');
                    setOpenLevel('fns');
                  }}
                >
                  <Text
                    className={`text-base ${
                      city === c ? 'font-semibold text-brandPrimary' : 'text-textPrimary'
                    }`}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            {openLevel === 'fns' &&
              fnsOptions.map((f) => (
                <Pressable
                  key={f}
                  className="border-b border-bgSecondary px-4 py-3"
                  onPress={() => {
                    onFnsChange(f);
                    setOpenLevel('service');
                  }}
                >
                  <Text
                    className={`text-base ${
                      fns === f ? 'font-semibold text-brandPrimary' : 'text-textPrimary'
                    }`}
                  >
                    {f}
                  </Text>
                </Pressable>
              ))}
            {openLevel === 'service' &&
              services.map((s) => (
                <Pressable
                  key={s}
                  className="border-b border-bgSecondary px-4 py-3"
                  onPress={() => {
                    onServiceChange(s);
                    setOpenLevel(null);
                  }}
                >
                  <Text
                    className={`text-base ${
                      service === s ? 'font-semibold text-brandPrimary' : 'text-textPrimary'
                    }`}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
          </View>
        </View>
      )}
    </View>
  );
}
