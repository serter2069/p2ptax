/**
 * CityFnsServicePicker — unified city → FNS → service selector.
 *
 * Wraps CityFnsCascade (chip city row + typeahead FNS dropdown + service chips)
 * with a simplified value/onChange API used by forms.
 *
 * Usage (single selection):
 *   <CityFnsServicePicker
 *     cities={cities}
 *     services={services}
 *     cityId={selectedCityId}
 *     fnsId={selectedFnsId}
 *     serviceId={selectedServiceId}
 *     onChange={({ cityId, fnsId, serviceId }) => { ... }}
 *     submitted={submitted}
 *   />
 */
import { View, Text } from "react-native";
import CityFnsCascade, {
  CityCascadeOption,
  ServiceOption,
} from "@/components/filters/CityFnsCascade";

export interface CityFnsServicePickerValue {
  cityId: string | null;
  fnsId: string | null;
  serviceId: string | null;
}

export interface CityFnsServicePickerProps {
  cities: CityCascadeOption[];
  services?: ServiceOption[];
  cityId: string | null;
  fnsId: string | null;
  serviceId?: string | null;
  onChange: (value: CityFnsServicePickerValue) => void;
  /** Show validation errors for required fields */
  submitted?: boolean;
  disabled?: boolean;
  labelCities?: string;
  labelFns?: string;
  labelServices?: string;
}

export default function CityFnsServicePicker({
  cities,
  services,
  cityId,
  fnsId,
  serviceId,
  onChange,
  submitted = false,
  disabled = false,
  labelCities,
  labelFns,
  labelServices,
}: CityFnsServicePickerProps) {
  const handleCascadeChange = (v: { cities: string[]; fns: string[] }) => {
    if (disabled) return;
    onChange({
      cityId: v.cities[0] ?? null,
      fnsId: v.fns[0] ?? null,
      serviceId: serviceId ?? null,
    });
  };

  const handleServiceChange = (id: string | null) => {
    if (disabled) return;
    onChange({ cityId, fnsId, serviceId: id });
  };

  return (
    <View>
      <CityFnsCascade
        mode="single"
        value={{
          cities: cityId ? [cityId] : [],
          fns: fnsId ? [fnsId] : [],
        }}
        onChange={handleCascadeChange}
        citiesSource={cities}
        services={services}
        selectedServiceId={serviceId ?? null}
        onServiceChange={handleServiceChange}
        labelCities={labelCities}
        labelFns={labelFns}
        labelServices={labelServices}
      />
      {submitted && !cityId && (
        <Text className="text-xs text-danger mt-1 px-4">Выберите город</Text>
      )}
      {submitted && cityId && !fnsId && (
        <Text className="text-xs text-danger mt-1 px-4">Выберите инспекцию</Text>
      )}
    </View>
  );
}

// Re-export types for consumers that previously imported from requests/CityFnsServicePicker
export type { CityCascadeOption as CityOption, ServiceOption };
