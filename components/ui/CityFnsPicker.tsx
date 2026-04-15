import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export interface CityFnsPickerProps {
  city: string;
  selectedFns: string[];
  onCityChange: (v: string) => void;
  onFnsToggle: (v: string) => void;
  onRemoveFns: (v: string) => void;
  cities: string[];
  fnsOptions: string[];
  /** Placeholder for the main picker button */
  placeholder?: string;
  /** Show an "all cities" reset option */
  allCitiesLabel?: string;
}

export function CityFnsPicker({
  city,
  selectedFns,
  onCityChange,
  onFnsToggle,
  onRemoveFns,
  cities,
  fnsOptions,
  placeholder = 'City and FNS',
  allCitiesLabel,
}: CityFnsPickerProps) {
  const [openLevel, setOpenLevel] = useState<'city' | 'fns' | null>(null);

  const summary = city
    ? selectedFns.length > 0
      ? `${city} / ${selectedFns.length} FNS`
      : city
    : '';

  return (
    <View className="gap-2">
      {/* Main picker button */}
      <Pressable onPress={() => setOpenLevel(openLevel ? null : 'city')}>
        <View
          className={`h-11 flex-row items-center gap-2 rounded-lg border px-3 ${
            openLevel ? 'border-brandPrimary' : 'border-borderLight'
          } bg-white`}
        >
          <Feather name="map-pin" size={16} color={Colors.textMuted} />
          <Text className={`flex-1 text-sm ${summary ? 'text-textPrimary' : 'text-textMuted'}`}>
            {summary || placeholder}
          </Text>
          <Feather
            name={openLevel ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.textMuted}
          />
        </View>
      </Pressable>

      {/* Cascading panel */}
      {openLevel && (
        <View className="overflow-hidden rounded-lg border border-borderLight bg-white shadow-sm">
          {/* Tabs: City / FNS */}
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
                    : selectedFns.length > 0
                      ? 'text-textPrimary'
                      : 'text-textMuted'
                }`}
              >
                {selectedFns.length > 0 ? `FNS (${selectedFns.length})` : 'FNS'}
              </Text>
            </Pressable>
          </View>

          {/* Options */}
          <View style={{ maxHeight: 200 }}>
            {openLevel === 'city' && (
              <>
                {allCitiesLabel && (
                  <Pressable
                    className="border-b border-bgSecondary px-3 py-2.5"
                    onPress={() => {
                      onCityChange('');
                      setOpenLevel(null);
                    }}
                  >
                    <Text className="text-sm text-textMuted">{allCitiesLabel}</Text>
                  </Pressable>
                )}
                {cities.map((c) => (
                  <Pressable
                    key={c}
                    className="border-b border-bgSecondary px-3 py-2.5"
                    onPress={() => {
                      onCityChange(c);
                      setOpenLevel('fns');
                    }}
                  >
                    <Text
                      className={`text-sm ${
                        city === c ? 'font-semibold text-brandPrimary' : 'text-textPrimary'
                      }`}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
            {openLevel === 'fns' &&
              fnsOptions.map((f) => {
                const isSelected = selectedFns.includes(f);
                return (
                  <Pressable
                    key={f}
                    className="flex-row items-center gap-2 border-b border-bgSecondary px-3 py-2.5"
                    onPress={() => onFnsToggle(f)}
                  >
                    <View
                      className={
                        isSelected
                          ? 'h-5 w-5 items-center justify-center rounded border border-brandPrimary bg-brandPrimary'
                          : 'h-5 w-5 rounded border border-borderLight bg-white'
                      }
                    >
                      {isSelected && <Feather name="check" size={12} color="#fff" />}
                    </View>
                    <Text
                      className={`text-sm ${
                        isSelected ? 'font-semibold text-brandPrimary' : 'text-textPrimary'
                      }`}
                    >
                      {f}
                    </Text>
                  </Pressable>
                );
              })}
          </View>
        </View>
      )}

      {/* Selected FNS chips */}
      {selectedFns.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {selectedFns.map((f) => (
            <Pressable
              key={f}
              onPress={() => onRemoveFns(f)}
              className="flex-row items-center gap-1 rounded-full bg-brandPrimary/10 px-2.5 py-1"
            >
              <Text className="text-xs font-medium text-brandPrimary">{f}</Text>
              <Feather name="x" size={12} color={Colors.brandPrimary} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
