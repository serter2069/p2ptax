import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { api } from '../lib/api';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/Colors';

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
      <View style={styles.selectedContainer}>
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedName} numberOfLines={2}>{selected.name}</Text>
          <Text style={styles.selectedCity}>{selected.city.name}</Text>
        </View>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
          <Text style={styles.clearBtnText}>x</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { outlineStyle: 'none' } as any]}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder || 'Введите номер или название инспекции...'}
          placeholderTextColor={Colors.textMuted}
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color={Colors.brandPrimary} style={styles.spinner} />}
      </View>

      {showDropdown && results.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {results.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.dropdownItem}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.dropdownCity}>{item.city.name}</Text>
                {item.address && (
                  <Text style={styles.dropdownAddress} numberOfLines={1}>{item.address}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgPrimary,
    minHeight: 44,
  },
  spinner: {
    position: 'absolute',
    right: 12,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    zIndex: 30,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 36, 71, 0.12)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 10,
        }),
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  dropdownItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  dropdownName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  dropdownCity: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    marginTop: 2,
  },
  dropdownAddress: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  selectedInfo: {
    flex: 1,
    gap: 2,
  },
  selectedName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  selectedCity: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 16,
  },
});
