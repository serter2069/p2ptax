/**
 * CityFnsServicePicker — unified city → FNS → service selector.
 *
 * Two modes:
 *
 *   single  — one city, one FNS, one service. Used by client request creation.
 *             Value: { cityId, fnsId, serviceId }.
 *
 *   multi   — many cities, many FNS, per-FNS subset of services. Used by
 *             specialist work-area onboarding and catalog filter.
 *             Value: CityFnsValue (cities[], fns[], fnsServices).
 *
 * Both modes wrap CityFnsCascade in typeahead UX. Only the value shape and
 * the optional service block differ. The wrapper centralises validation,
 * label overrides, error display, and the optional bordered "frame" so all
 * call sites look identical regardless of mode.
 */
import { View, Text } from "react-native";
import CityFnsCascade, {
  CityCascadeOption,
  FnsCascadeOption,
  ServiceOption,
  CityFnsValue,
} from "@/components/filters/CityFnsCascade";
import { colors } from "@/lib/theme";

export type { CityCascadeOption, FnsCascadeOption, ServiceOption, CityFnsValue };
export type CityOption = CityCascadeOption;

export interface SingleValue {
  cityId: string | null;
  fnsId: string | null;
  serviceId: string | null;
}

interface CommonProps {
  cities: CityCascadeOption[];
  fnsAll?: FnsCascadeOption[];
  services?: ServiceOption[];
  submitted?: boolean;
  disabled?: boolean;
  framed?: boolean;
  frameLabel?: string;
  labelCities?: string;
  labelFns?: string;
  labelServices?: string;
}

export type CityFnsServicePickerProps =
  | (CommonProps & {
      mode: "single";
      value: SingleValue;
      onChange: (v: SingleValue) => void;
    })
  | (CommonProps & {
      mode: "multi";
      value: CityFnsValue;
      onChange: (v: CityFnsValue) => void;
    });

export default function CityFnsServicePicker(props: CityFnsServicePickerProps) {
  const {
    cities,
    fnsAll,
    services,
    submitted = false,
    disabled = false,
    framed = false,
    frameLabel = "Куда обращаемся",
    labelCities,
    labelFns,
    labelServices,
  } = props;

  let cascade: React.ReactNode;
  let validationError: string | null = null;

  if (props.mode === "single") {
    const { value, onChange } = props;
    const handleCascadeChange = (v: CityFnsValue) => {
      if (disabled) return;
      onChange({
        cityId: v.cities[0] ?? null,
        fnsId: v.fns[0] ?? null,
        serviceId: value.serviceId,
      });
    };
    const handleServiceChange = (id: string | null) => {
      if (disabled) return;
      onChange({ cityId: value.cityId, fnsId: value.fnsId, serviceId: id });
    };
    cascade = (
      <CityFnsCascade
        mode="typeahead"
        value={{
          cities: value.cityId ? [value.cityId] : [],
          fns: value.fnsId ? [value.fnsId] : [],
        }}
        onChange={handleCascadeChange}
        citiesSource={cities}
        fnsSource={fnsAll}
        services={services}
        selectedServiceId={value.serviceId}
        onServiceChange={handleServiceChange}
        labelCities={labelCities}
        labelFns={labelFns}
        labelServices={labelServices}
      />
    );
    if (submitted && !value.cityId) validationError = "Выберите город";
    else if (submitted && !value.fnsId) validationError = "Выберите инспекцию ФНС";
  } else {
    const { value, onChange } = props;
    cascade = (
      <CityFnsCascade
        mode="typeahead"
        value={value}
        onChange={(v) => !disabled && onChange(v)}
        citiesSource={cities}
        fnsSource={fnsAll}
        services={services}
        labelCities={labelCities}
        labelFns={labelFns}
        labelServices={labelServices}
      />
    );
  }

  if (!framed) {
    return (
      <View>
        {cascade}
        {validationError && (
          <Text className="text-xs text-danger mt-1.5">{validationError}</Text>
        )}
      </View>
    );
  }

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: validationError ? colors.danger : colors.border,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider mb-2">
        {frameLabel}
      </Text>
      {cascade}
      {validationError && (
        <Text className="text-xs text-danger mt-1.5">{validationError}</Text>
      )}
    </View>
  );
}
