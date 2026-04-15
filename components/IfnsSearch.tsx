import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { api } from '../lib/api';
import { Colors } from '../constants/Colors';

interface IfnsItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  address: string | null;
  searchAliases: string | null;
  city: { id: string; name: string; slug: string; region: string | null };
}

interface IfnsSearchProps {
  onSelect: (ifns: IfnsItem | null) => void;
  selected?: IfnsItem | null;
  placeholder?: string;
}

export function IfnsSearch({ onSelect, selected, placeholder }: IfnsSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IfnsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get<IfnsItem[]>(`/ifns/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setResults([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(ifns: IfnsItem) {
    onSelect(ifns);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  }

  function handleClear() {
    onSelect(null);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  }

  if (selected) {
    return (
      <View className="flex-row items-center bg-bgSecondary border border-brandPrimary rounded-md p-2 gap-2">
        <View className="flex-1 gap-[2px]">
          <Text className="text-[13px] text-textPrimary font-medium" numberOfLines={2}>{selected.name}</Text>
          <Text className="text-[11px] text-brandPrimary">{selected.city.name}</Text>
        </View>
        <Pressable onPress={handleClear} className="w-7 h-7 rounded-full bg-textMuted items-center justify-center">
          <Text className="text-white text-sm font-bold leading-4">x</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="relative z-20">
      <View className="flex-row items-center">
        <TextInput
          className="flex-1 border border-border rounded-md py-2 px-3 text-[15px] text-textPrimary bg-bgPrimary min-h-[44px]"
          style={{ outlineStyle: 'none' } as any}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder || 'Введите номер или название инспекции...'}
          placeholderTextColor={Colors.textMuted}
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color={Colors.brandPrimary} className="absolute right-3" />}
      </View>

      {showDropdown && results.length > 0 && (
        <View
          className="absolute top-full left-0 right-0 mt-1 bg-bgCard border border-border rounded-md z-30"
          style={Platform.OS === 'web'
            ? { boxShadow: '0 4px 16px rgba(15, 36, 71, 0.12)' } as any
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 10,
              }
          }
        >
          <ScrollView className="max-h-60" nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {results.map((item) => (
              <Pressable
                key={item.id}
                className="py-2 px-3 border-b border-bgSecondary"
                onPress={() => handleSelect(item)}
              >
                <Text className="text-[13px] text-textPrimary font-medium" numberOfLines={2}>{item.name}</Text>
                <Text className="text-[11px] text-brandPrimary mt-[2px]">{item.city.name}</Text>
                {item.address && (
                  <Text className="text-[11px] text-textMuted mt-[2px]" numberOfLines={1}>{item.address}</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
