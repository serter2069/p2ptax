import { View } from "react-native";
import CityFnsServicePicker, {
  CityFnsValue,
  FnsCascadeOption,
  ServiceOption,
} from "@/components/shared/CityFnsServicePicker";
import { Z } from "@/lib/zIndex";

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
 * Routes through the unified CityFnsServicePicker (multi mode) so the two
 * pages and the request intake form never drift apart visually.
 */
export default function SpecialistFilter({
  cities,
  fnsAll,
  services,
  value,
  onChange,
}: Props) {
  return (
    <View>
      <View className="px-4" style={{ zIndex: Z.STICKY }}>
        <CityFnsServicePicker
          mode="multi"
          value={value}
          onChange={onChange}
          cities={cities}
          fnsAll={fnsAll}
          services={services}
        />
      </View>
    </View>
  );
}
