import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api, ApiError } from '../../lib/api';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { FNS_DEPARTMENTS } from '../../constants/FNS_DEPARTMENTS';
import { useCities, useFnsOffices, CityItem, FnsOfficeItem } from '../../hooks/useFnsData';
import { shortFnsLabel } from '../../lib/format';
import { toast } from '../../lib/toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WorkAreaBinding {
  fnsId: string;
  fnsName: string;
  cityId: string;
  cityName: string;
  departments: string[];
}

interface FnsGroupedByCity {
  city: string;
  offices: Array<{
    fnsId: string;
    fnsName: string;
    services: string[];
  }>;
}

// ---------------------------------------------------------------------------
// Sub-component: CityFnsSection
// ---------------------------------------------------------------------------
function CityFnsSection({
  city,
  bindings,
  onToggleFns,
  onToggleDept,
  onRemoveCity,
}: {
  city: CityItem;
  bindings: WorkAreaBinding[];
  onToggleFns: (fns: FnsOfficeItem) => void;
  onToggleDept: (fnsId: string, dept: string) => void;
  onRemoveCity: (cityId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { offices, loading } = useFnsOffices(city.id);
  const selectedFnsIds = new Set(bindings.map((b) => b.fnsId));
  const deptCount = bindings.reduce((acc, b) => acc + b.departments.length, 0);

  return (
    <View style={styles.cityBlock}>
      <TouchableOpacity
        style={styles.cityHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.cityHeaderLeft}>
          <Feather name="map-pin" size={14} color={Colors.brandPrimary} />
          <Text style={styles.cityName}>{city.name}</Text>
          {bindings.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{bindings.length}</Text>
            </View>
          )}
          {deptCount > 0 && (
            <Text style={styles.deptCountLabel}>{deptCount} svc</Text>
          )}
        </View>
        <View style={styles.cityHeaderRight}>
          <TouchableOpacity
            onPress={() => onRemoveCity(city.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="trash-2" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.fnsListWrap}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.brandPrimary} />
              <Text style={styles.loadingText}>Loading FNS offices...</Text>
            </View>
          ) : offices.length === 0 ? (
            <Text style={styles.emptyText}>No offices for this city</Text>
          ) : (
            offices.map((fns) => {
              const isSelected = selectedFnsIds.has(fns.id);
              const binding = bindings.find((b) => b.fnsId === fns.id);
              const selectedDepts = binding?.departments ?? [];

              return (
                <View key={fns.id} style={styles.fnsItem}>
                  <TouchableOpacity
                    style={styles.fnsRow}
                    onPress={() => onToggleFns(fns)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxActive,
                      ]}
                    >
                      {isSelected && (
                        <Feather name="check" size={13} color={Colors.white} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.fnsName,
                        isSelected && styles.fnsNameActive,
                      ]}
                      numberOfLines={2}
                    >
                      {shortFnsLabel(fns.name, city.name)}
                    </Text>
                  </TouchableOpacity>

                  {isSelected && (
                    <View style={styles.deptChips}>
                      {FNS_DEPARTMENTS.map((dept) => {
                        const isOn = selectedDepts.includes(dept);
                        return (
                          <TouchableOpacity
                            key={dept}
                            style={[
                              styles.deptChip,
                              isOn && styles.deptChipActive,
                            ]}
                            onPress={() => onToggleDept(fns.id, dept)}
                            activeOpacity={0.7}
                          >
                            {isOn && (
                              <Feather
                                name="check"
                                size={12}
                                color={Colors.brandPrimary}
                              />
                            )}
                            <Text
                              style={[
                                styles.deptChipText,
                                isOn && styles.deptChipTextActive,
                              ]}
                            >
                              {dept}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function WorkAreaEditScreen() {
  const router = useRouter();
  const { cities: allCities, loading: citiesLoading } = useCities();

  const [search, setSearch] = useState('');
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [bindings, setBindings] = useState<WorkAreaBinding[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');

  // Load existing work area data from profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await api.get<{
          fnsGroupedByCity?: FnsGroupedByCity[];
          specialistFns?: Array<{
            fnsId: string;
            fns: { id: string; name: string; cityId: string; city: { id: string; name: string } };
          }>;
          specialistServices?: Array<{
            fnsId: string;
            service: { name: string };
          }>;
        }>('/specialists/me');

        if (cancelled) return;

        // Reconstruct bindings from fnsGroupedByCity
        const grouped = profile.fnsGroupedByCity ?? [];
        const newBindings: WorkAreaBinding[] = [];
        const cityIds: string[] = [];

        if (profile.specialistFns && profile.specialistFns.length > 0) {
          // Build from join table data (more precise)
          const serviceMap = new Map<string, string[]>();
          for (const ss of profile.specialistServices ?? []) {
            const existing = serviceMap.get(ss.fnsId) ?? [];
            existing.push(ss.service.name);
            serviceMap.set(ss.fnsId, existing);
          }

          for (const sf of profile.specialistFns) {
            const cityId = sf.fns.cityId;
            if (!cityIds.includes(cityId)) cityIds.push(cityId);
            newBindings.push({
              fnsId: sf.fnsId,
              fnsName: sf.fns.name,
              cityId,
              cityName: sf.fns.city.name,
              departments: serviceMap.get(sf.fnsId) ?? [],
            });
          }
        } else if (grouped.length > 0) {
          // Fallback: reconstruct from grouped data (needs city ID lookup)
          // This path is less precise but works for legacy data
          for (const g of grouped) {
            for (const office of g.offices) {
              newBindings.push({
                fnsId: office.fnsId,
                fnsName: office.fnsName,
                cityId: '', // will be resolved when cities load
                cityName: g.city,
                departments: office.services,
              });
            }
          }
        }

        setSelectedCityIds(cityIds);
        setBindings(newBindings);
      } catch {
        // Profile might not exist yet — that's fine
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Resolve city IDs for legacy bindings once cities load
  useEffect(() => {
    if (allCities.length === 0) return;
    setBindings((prev) => {
      let changed = false;
      const updated = prev.map((b) => {
        if (b.cityId) return b;
        const match = allCities.find((c) => c.name === b.cityName);
        if (match) {
          changed = true;
          return { ...b, cityId: match.id };
        }
        return b;
      });
      if (changed) {
        const ids = [...new Set(updated.filter((b) => b.cityId).map((b) => b.cityId))];
        setSelectedCityIds(ids);
      }
      return changed ? updated : prev;
    });
  }, [allCities]);

  // Filtered cities for search
  const filtered = search.trim()
    ? allCities.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) &&
          !selectedCityIds.includes(c.id),
      )
    : [];

  const selectedCities = allCities.filter((c) => selectedCityIds.includes(c.id));

  // Handlers
  const addCity = useCallback((city: CityItem) => {
    setSelectedCityIds((prev) => [...prev, city.id]);
    setSearch('');
    setError('');
  }, []);

  const removeCity = useCallback((cityId: string) => {
    setSelectedCityIds((prev) => prev.filter((id) => id !== cityId));
    setBindings((prev) => prev.filter((b) => b.cityId !== cityId));
  }, []);

  const toggleFns = useCallback((fns: FnsOfficeItem) => {
    setBindings((prev) => {
      const exists = prev.find((b) => b.fnsId === fns.id);
      if (exists) return prev.filter((b) => b.fnsId !== fns.id);
      return [
        ...prev,
        {
          fnsId: fns.id,
          fnsName: fns.name,
          cityId: fns.cityId,
          cityName: fns.city.name,
          departments: [],
        },
      ];
    });
    setError('');
  }, []);

  const toggleDept = useCallback((fnsId: string, dept: string) => {
    setBindings((prev) =>
      prev.map((b) => {
        if (b.fnsId !== fnsId) return b;
        const has = b.departments.includes(dept);
        return {
          ...b,
          departments: has
            ? b.departments.filter((d) => d !== dept)
            : [...b.departments, dept],
        };
      }),
    );
    setError('');
  }, []);

  // Save
  async function handleSave() {
    if (bindings.length === 0) {
      setError('Select at least one FNS office');
      return;
    }

    for (const b of bindings) {
      if (b.departments.length === 0) {
        setError(`Select at least one service for ${shortFnsLabel(b.fnsName, b.cityName)}`);
        return;
      }
    }

    setError('');
    setSaving(true);
    try {
      const workAreas = bindings.map((b) => ({
        fnsId: b.fnsId,
        departments: b.departments,
      }));

      await api.post('/specialists/work-areas', { workAreas });
      toast.success('Work area saved');
      router.back();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Edit work area" showBack />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brandPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Edit work area" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* City search */}
          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <Feather name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { outlineStyle: 'none' } as any]}
                value={search}
                onChangeText={setSearch}
                placeholder="Find city..."
                placeholderTextColor={Colors.textMuted}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {filtered.length > 0 && (
              <View style={styles.dropdown}>
                {filtered.slice(0, 8).map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={styles.dropdownItem}
                    onPress={() => addCity(city)}
                    activeOpacity={0.7}
                  >
                    <Feather name="map-pin" size={14} color={Colors.textMuted} />
                    <Text style={styles.dropdownText}>{city.name}</Text>
                    {city.region && (
                      <Text style={styles.dropdownRegion}>{city.region}</Text>
                    )}
                    <Feather name="plus" size={14} color={Colors.brandPrimary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Empty state */}
          {selectedCities.length === 0 && !search && (
            <View style={styles.emptyState}>
              <Feather name="map-pin" size={20} color={Colors.textMuted} />
              <Text style={styles.emptyStateText}>
                {citiesLoading ? 'Loading cities...' : 'Start typing a city name'}
              </Text>
            </View>
          )}

          {/* Selected cities */}
          {selectedCities.map((city) => (
            <CityFnsSection
              key={city.id}
              city={city}
              bindings={bindings.filter((b) => b.cityId === city.id)}
              onToggleFns={toggleFns}
              onToggleDept={toggleDept}
              onRemoveCity={removeCity}
            />
          ))}

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={Colors.statusError} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Save */}
          <Button
            onPress={handleSave}
            disabled={bindings.length === 0 || saving}
            loading={saving}
            style={styles.saveBtn}
          >
            Save work area
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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
  },
  // Search
  searchWrap: {
    position: 'relative',
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgSecondary,
  },
  dropdownText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  dropdownRegion: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    opacity: 0.6,
    gap: Spacing.sm,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  // City block
  cityBlock: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
  },
  cityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  cityHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cityName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  deptCountLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  // FNS list
  fnsListWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.bgSecondary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  fnsItem: {
    borderTopWidth: 1,
    borderTopColor: Colors.bgSecondary,
  },
  fnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.brandPrimary,
  },
  fnsName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  fnsNameActive: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brandPrimary,
  },
  // Department chips
  deptChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingLeft: 52,
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  deptChipActive: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.statusBg.accent,
  },
  deptChipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  deptChipTextActive: {
    fontWeight: Typography.fontWeight.medium,
    color: Colors.brandPrimary,
  },
  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.statusBg.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.statusError,
  },
  saveBtn: {
    width: '100%',
    marginBottom: Spacing['3xl'],
  },
});
