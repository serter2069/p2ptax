import { View } from "react-native";
import CityFnsCascade, {
  CityFnsValue,
  FnsCascadeOption,
  ServiceOption,
} from "@/components/filters/CityFnsCascade";

interface CityCascadeOption {
  id: string;
  name: string;
}

interface Props {
  cities: CityCascadeOption[];
  fnsAll: FnsCascadeOption[];
  services: ServiceOption[];
  value: CityFnsValue;
  onChange: (v: CityFnsValue) => void;
}

/**
 * Shared cascade filter (city → FNS → per-FNS services) used by both
 * `/specialists` (public catalog) and `/saved-specialists` (bookmarks).
 *
 * Wraps CityFnsCascade in typeahead mode so the two pages
 * can never drift apart visually.
 */
export default function SpecialistFilter({
  cities,
  fnsAll,
  services,
  value,
  onChange,
}: Props) {
  // No top padding here: PageTitle already provides the canonical 16px gap
  // (#1716). Adding pt-2 would double the gap on /specialists and make the
  // search bar sit lower than on /requests, /my-requests, etc.
  return (
    <View>
      <View className="px-4" style={{ zIndex: 100 }}>
        <CityFnsCascade
          mode="typeahead"
          value={value}
          onChange={onChange}
          citiesSource={cities}
          fnsSource={fnsAll}
          services={services}
        />
      </View>
    </View>
  );
}
