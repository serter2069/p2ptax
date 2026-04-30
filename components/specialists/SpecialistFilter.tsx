import { View } from "react-native";
import SpecialistSearchBar, {
  CityOpt,
  FnsOpt,
} from "@/components/filters/SpecialistSearchBar";
import ServiceChipsRow from "@/components/specialists/ServiceChipsRow";

interface ServiceOption {
  id: string;
  name: string;
}

interface Props {
  cities: CityOpt[];
  fnsAll: FnsOpt[];
  services: ServiceOption[];
  selectedCityId: string | null;
  selectedFnsId: string | null;
  selectedServiceIds: string[];
  onPickCity: (cityId: string) => void;
  onPickFns: (fns: FnsOpt) => void;
  onClearLocation: () => void;
  onToggleService: (id: string) => void;
  onClearServices: () => void;
}

/**
 * Shared cascade filter (city → FNS → services) used by both
 * `/specialists` (public catalog) and `/saved-specialists` (bookmarks).
 *
 * Keeps the typeahead SearchBar + horizontal service chips together so the
 * two pages can never drift apart visually.
 */
export default function SpecialistFilter({
  cities,
  fnsAll,
  services,
  selectedCityId,
  selectedFnsId,
  selectedServiceIds,
  onPickCity,
  onPickFns,
  onClearLocation,
  onToggleService,
  onClearServices,
}: Props) {
  return (
    <View>
      <View className="px-4 pt-2" style={{ zIndex: 20 }}>
        <SpecialistSearchBar
          cities={cities}
          fnsAll={fnsAll}
          selectedCityId={selectedCityId}
          selectedFnsId={selectedFnsId}
          onPickCity={onPickCity}
          onPickFns={onPickFns}
          onClear={onClearLocation}
        />
      </View>
      <ServiceChipsRow
        services={services}
        selectedServiceIds={selectedServiceIds}
        onToggle={onToggleService}
        onClearAll={onClearServices}
      />
    </View>
  );
}
