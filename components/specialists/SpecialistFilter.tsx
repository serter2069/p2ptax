import { View } from "react-native";
import CityFnsCascade, {
  FnsCascadeOption,
  TypeaheadValue,
} from "@/components/filters/CityFnsCascade";

interface ServiceOption {
  id: string;
  name: string;
}

interface Props {
  cities: { id: string; name: string }[];
  fnsAll: FnsCascadeOption[];
  services: ServiceOption[];
  typeaheadValue: TypeaheadValue;
  onTypeaheadChange: (v: TypeaheadValue) => void;
}

/**
 * SpecialistFilter — cascade filter for /specialists catalog.
 * Uses CityFnsCascade in typeahead mode: text search → city/FNS picker → per-FNS service chips.
 */
export default function SpecialistFilter({
  cities,
  fnsAll,
  services,
  typeaheadValue,
  onTypeaheadChange,
}: Props) {
  return (
    <View className="px-4 pt-2" style={{ zIndex: 100 }}>
      <CityFnsCascade
        mode="typeahead"
        citiesSource={cities}
        fnsSource={fnsAll}
        services={services}
        typeaheadValue={typeaheadValue}
        onTypeaheadChange={onTypeaheadChange}
      />
    </View>
  );
}
