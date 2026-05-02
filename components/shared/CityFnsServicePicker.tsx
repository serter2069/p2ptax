/**
 * CityFnsServicePicker — unified city → FNS → service selector.
 *
 *   single  — one city, one FNS, one service. Custom 3-step UI used by
 *             client request creation (/requests/new). Implemented inline
 *             in this file, not via CityFnsCascade.
 *
 *   multi   — many cities, many FNS, per-FNS subset of services. Pass-through
 *             to CityFnsCascade typeahead, used by specialist work-area and
 *             catalog filter.
 */
import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Search, X, MapPin, Check, ChevronDown } from "lucide-react-native";
import Input from "@/components/ui/Input";
import CityFnsCascade, {
  CityCascadeOption,
  FnsCascadeOption,
  ServiceOption,
  CityFnsValue,
} from "@/components/filters/CityFnsCascade";
import { colors } from "@/lib/theme";
import { Z, layer } from "@/lib/zIndex";

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

const TOP_CITIES = [
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Уфа",
  "Краснодар",
  "Воронеж",
];

const SERVICE_HINT: Record<string, string> = {
  "Выездная проверка":
    "Инспекция приходит к вам с проверкой деятельности.",
  "Камеральная проверка":
    "Спор с инспекцией по поданным декларациям и документам.",
  "Сопровождение декларации":
    "Подача и защита декларации в инспекции.",
};

export default function CityFnsServicePicker(props: CityFnsServicePickerProps) {
  if (props.mode === "multi") return <MultiPicker {...props} />;
  return <SinglePicker {...props} />;
}

// ───────────────────────────── SINGLE ─────────────────────────────

function SinglePicker({
  cities,
  fnsAll = [],
  services = [],
  value,
  onChange,
  submitted = false,
  disabled = false,
  labelCities = "Город",
  labelFns = "Инспекция ФНС",
  labelServices = "Тип обращения",
}: Extract<CityFnsServicePickerProps, { mode: "single" }>) {
  const [cityQuery, setCityQuery] = useState("");
  const [fnsQuery, setFnsQuery] = useState("");
  const [showAllCities, setShowAllCities] = useState(false);
  const [showAllFns, setShowAllFns] = useState(false);

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === value.cityId) ?? null,
    [cities, value.cityId]
  );
  const selectedFns = useMemo(
    () => fnsAll.find((f) => f.id === value.fnsId) ?? null,
    [fnsAll, value.fnsId]
  );
  const fnsForCity = useMemo(
    () => (selectedCity ? fnsAll.filter((f) => f.cityId === selectedCity.id) : []),
    [fnsAll, selectedCity]
  );

  const topCityOptions = useMemo(() => {
    return TOP_CITIES.map((n) => cities.find((c) => c.name === n)).filter(
      (c): c is CityCascadeOption => !!c
    );
  }, [cities]);

  const topCityIds = useMemo(() => new Set(topCityOptions.map((c) => c.id)), [topCityOptions]);

  const cityMatches = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return [];
    return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [cities, cityQuery]);

  const fnsMatches = useMemo(() => {
    const q = fnsQuery.trim().toLowerCase();
    if (!q) return fnsForCity;
    return fnsForCity.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || (f.code || "").toLowerCase().includes(q)
    );
  }, [fnsForCity, fnsQuery]);

  const pickCity = (id: string) => {
    if (disabled) return;
    onChange({ cityId: id, fnsId: null, serviceId: null });
    setCityQuery("");
    setFnsQuery("");
    setShowAllFns(false);
  };
  const pickFns = (id: string) => {
    if (disabled) return;
    onChange({ cityId: value.cityId, fnsId: id, serviceId: null });
    setFnsQuery("");
  };
  const pickService = (id: string | null) => {
    if (disabled) return;
    onChange({ cityId: value.cityId, fnsId: value.fnsId, serviceId: id });
  };

  const resetCity = () => onChange({ cityId: null, fnsId: null, serviceId: null });
  const resetFns = () =>
    onChange({ cityId: value.cityId, fnsId: null, serviceId: null });

  const cityError = submitted && !selectedCity ? "Выберите город" : null;
  const fnsError =
    submitted && selectedCity && !selectedFns ? "Выберите инспекцию" : null;

  // Step 1: pick city
  if (!selectedCity) {
    const remaining = cities.filter((c) => !topCityIds.has(c.id));
    return (
      <View>
        <StepLabel n={1} of={3} text={labelCities.toLowerCase()} />

        <View style={{ position: "relative", zIndex: Z.STICKY }}>
          <SearchInput
            value={cityQuery}
            onChange={setCityQuery}
            placeholder="Поиск по городу"
            disabled={disabled}
          />
          {cityQuery.trim().length >= 2 && (
            <DropdownContainer>
              {cityMatches.length === 0 ? (
                <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text className="text-sm text-text-mute">Ничего не найдено</Text>
                </View>
              ) : (
                cityMatches.map((c) => (
                  <DropdownRow
                    key={c.id}
                    icon={<MapPin size={14} color={colors.textMuted} />}
                    title={c.name}
                    onPress={() => pickCity(c.id)}
                  />
                ))
              )}
            </DropdownContainer>
          )}
        </View>

        <View
          className="flex-row flex-wrap mt-3"
          style={{ gap: 8 }}
        >
          {topCityOptions.map((c) => (
            <CityChip key={c.id} label={c.name} onPress={() => pickCity(c.id)} />
          ))}
          {!showAllCities && remaining.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Показать ещё ${remaining.length} городов`}
              onPress={() => setShowAllCities(true)}
              className="px-3 py-1.5 rounded-full border border-dashed bg-white"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                + ещё {remaining.length}
              </Text>
            </Pressable>
          )}
          {showAllCities &&
            remaining.map((c) => (
              <CityChip key={c.id} label={c.name} onPress={() => pickCity(c.id)} />
            ))}
        </View>

        {cityError && <ErrorText text={cityError} />}
      </View>
    );
  }

  // Step 2: pick FNS
  if (!selectedFns) {
    const visible = showAllFns ? fnsMatches : fnsMatches.slice(0, 5);
    const overflow = fnsMatches.length - visible.length;
    return (
      <View>
        <StepLabel n={2} of={3} text={`инспекцию в г. ${selectedCity.name}`} />

        <SummaryBar
          label="Город"
          value={selectedCity.name}
          onReset={resetCity}
          disabled={disabled}
        />

        <View style={{ marginTop: 12 }}>
          <SearchInput
            value={fnsQuery}
            onChange={setFnsQuery}
            placeholder="Найти по номеру или адресу"
            disabled={disabled}
          />
        </View>

        {fnsForCity.length === 0 ? (
          <Text className="text-sm text-text-mute mt-3">
            В выбранном городе нет инспекций (или они ещё не загружены).
          </Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            {visible.map((f) => (
              <FnsRow
                key={f.id}
                fns={f}
                selected={false}
                onPress={() => pickFns(f.id)}
              />
            ))}
            {visible.length === 0 && (
              <Text className="text-sm text-text-mute px-1 py-2">
                Ничего не найдено по запросу.
              </Text>
            )}
            {!showAllFns && overflow > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Показать ещё ${overflow}`}
                onPress={() => setShowAllFns(true)}
                className="flex-row items-center justify-center mt-1 py-2"
              >
                <Text className="text-sm" style={{ color: colors.primary }}>
                  Показать ещё ({overflow})
                </Text>
                <ChevronDown size={14} color={colors.primary} style={{ marginLeft: 4 }} />
              </Pressable>
            )}
          </View>
        )}

        {fnsError && <ErrorText text={fnsError} />}
      </View>
    );
  }

  // Step 3: pick service
  return (
    <View>
      <StepLabel n={3} of={3} text={labelServices.toLowerCase()} />

      <SummaryBar
        label="Инспекция"
        value={`${selectedCity.name} · ${selectedFns.name}`}
        onReset={resetFns}
        disabled={disabled}
      />

      <View style={{ marginTop: 12, gap: 8 }}>
        {services.map((s) => (
          <ServiceRow
            key={s.id}
            label={s.name}
            hint={SERVICE_HINT[s.name]}
            selected={value.serviceId === s.id}
            onPress={() => pickService(s.id)}
          />
        ))}
        <ServiceRow
          label="Не уверен — помогите выбрать"
          hint="Специалист уточнит при первом ответе."
          selected={value.serviceId === null}
          onPress={() => pickService(null)}
        />
      </View>
    </View>
  );
}

// ───────────────────────────── MULTI ─────────────────────────────

function MultiPicker({
  cities,
  fnsAll,
  services,
  value,
  onChange,
  disabled = false,
  labelCities,
  labelFns,
  labelServices,
}: Extract<CityFnsServicePickerProps, { mode: "multi" }>) {
  return (
    <View>
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
    </View>
  );
}

// ───────────────────────────── shared bits ─────────────────────────────

function StepLabel({ n, of, text }: { n: number; of: number; text: string }) {
  return (
    <Text
      className="text-xs font-semibold uppercase tracking-wider mb-2"
      style={{ color: colors.textMuted }}
    >
      Шаг {n} из {of} · {text}
    </Text>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Input
      variant="bordered"
      icon={Search}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
      editable={!disabled}
      rightSlot={
        value.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Очистить"
            onPress={() => onChange("")}
            className="ml-1 w-7 h-7 items-center justify-center"
          >
            <X size={14} color={colors.placeholder} />
          </Pressable>
        ) : null
      }
    />
  );
}

function DropdownContainer({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="absolute left-0 right-0 bg-white border border-border rounded-xl overflow-hidden"
      style={{
        top: 48,
        maxHeight: 360,
        ...layer("POPOVER"),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      }}
    >
      {children}
    </View>
  );
}

function DropdownRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="px-4 py-3 flex-row items-start"
      style={{ gap: 10 }}
    >
      <View style={{ marginTop: 1 }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text className="text-sm text-text-base">{title}</Text>
        {subtitle && (
          <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function CityChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="px-3 py-1.5 rounded-full border bg-white"
      style={{ borderColor: colors.border }}
    >
      <Text className="text-xs" style={{ color: colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

function FnsRow({
  fns,
  selected,
  onPress,
}: {
  fns: FnsCascadeOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={fns.name}
      onPress={onPress}
      className="flex-row items-start py-3 px-3 rounded-lg"
      style={{
        gap: 12,
        backgroundColor: selected ? colors.accentSoft : "transparent",
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.border,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        }}
      >
        {selected && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.primary,
            }}
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          className="text-sm font-medium"
          style={{ color: colors.text }}
          numberOfLines={2}
        >
          {fns.name}
        </Text>
        <Text
          className="text-xs mt-0.5"
          style={{ color: colors.textMuted }}
          numberOfLines={1}
        >
          {fns.cityName ? `г. ${fns.cityName}` : ""}
          {fns.code ? ` · код ${fns.code}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

function ServiceRow({
  label,
  hint,
  selected,
  onPress,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-row items-start p-3 rounded-xl border"
      style={{
        gap: 12,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.accentSoft : colors.white,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.border,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        }}
      >
        {selected && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.primary,
            }}
          />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text className="text-sm font-medium" style={{ color: colors.text }}>
          {label}
        </Text>
        {hint && (
          <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>
            {hint}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function SummaryBar({
  label,
  value,
  onReset,
  disabled,
}: {
  label: string;
  value: string;
  onReset: () => void;
  disabled?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between rounded-lg px-3 py-2"
      style={{ backgroundColor: colors.surface2, gap: 8 }}
    >
      <View className="flex-row items-center" style={{ gap: 8, flex: 1, minWidth: 0 }}>
        <Check size={14} color={colors.success} />
        <Text className="text-xs" style={{ color: colors.textMuted }}>
          {label}:
        </Text>
        <Text
          className="text-sm font-medium"
          style={{ color: colors.text, flexShrink: 1 }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      {!disabled && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Изменить ${label.toLowerCase()}`}
          onPress={onReset}
          className="px-2 py-1"
          hitSlop={6}
        >
          <Text className="text-xs" style={{ color: colors.primary }}>
            Изменить
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function ErrorText({ text }: { text: string }) {
  return (
    <Text className="text-xs mt-2" style={{ color: colors.danger }}>
      {text}
    </Text>
  );
}
