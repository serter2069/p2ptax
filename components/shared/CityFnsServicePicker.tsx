import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Search, X, MapPin, Check, ChevronDown, Globe } from "lucide-react-native";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
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

export interface EntryValue {
  cityId: string;
  cityName: string;
  fnsId: string | null;
  fnsName: string | null;
  fnsCode: string | null;
  serviceIds: string[];
  serviceNames: string[];
}

interface CommonProps {
  cities: CityCascadeOption[];
  fnsAll?: FnsCascadeOption[];
  services?: ServiceOption[];
  disabled?: boolean;
  labelCities?: string;
  labelFns?: string;
  labelServices?: string;
}

interface SingleModeProps extends CommonProps {
  mode: "single";
  value: SingleValue;
  onChange: (v: SingleValue) => void;
  submitted?: boolean;
}

interface EntryModeProps extends CommonProps {
  mode: "entry";
  onAdd: (entry: EntryValue) => void;
  multiService?: boolean;
  allowAnyFns?: boolean;
  allowAnyService?: boolean;
  excludeFnsIds?: string[];
  /** Hide the top-N city chips below the search input. Used by the
   *  catalog filter where they duplicate the active filter chip row. */
  hideTopCityChips?: boolean;
}

interface MultiModeProps extends CommonProps {
  mode: "multi";
  value: CityFnsValue;
  onChange: (v: CityFnsValue) => void;
}

export type CityFnsServicePickerProps = SingleModeProps | EntryModeProps | MultiModeProps;

const TOP_CITIES = [
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
];

const SERVICE_HINT: Record<string, string> = {
  "Выездная проверка": "Инспекция приходит к вам с проверкой деятельности.",
  "Камеральная проверка": "Спор с инспекцией по поданным декларациям и документам.",
  "Сопровождение декларации": "Подача и защита декларации в инспекции.",
};

export default function CityFnsServicePicker(props: CityFnsServicePickerProps) {
  if (props.mode === "multi") return <MultiPicker {...props} />;
  if (props.mode === "entry") return <EntryPicker {...props} />;
  return <SinglePicker {...props} />;
}

function SinglePicker({
  cities, fnsAll = [], services = [], value, onChange,
  submitted = false, disabled = false,
  labelCities = "Город", labelServices = "Тип ситуации",
}: SingleModeProps) {
  const [cityQuery, setCityQuery] = useState("");
  const [fnsQuery, setFnsQuery] = useState("");
  const [showAllCities, setShowAllCities] = useState(false);
  const [showAllFns, setShowAllFns] = useState(false);

  const selectedCity = useMemo(() => cities.find((c) => c.id === value.cityId) ?? null, [cities, value.cityId]);
  const selectedFns = useMemo(() => fnsAll.find((f) => f.id === value.fnsId) ?? null, [fnsAll, value.fnsId]);
  const fnsForCity = useMemo(
    () => (selectedCity ? fnsAll.filter((f) => f.cityId === selectedCity.id) : []),
    [fnsAll, selectedCity]
  );
  const cityMatches = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return [];
    return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [cities, cityQuery]);
  const fnsMatches = useMemo(() => {
    const q = fnsQuery.trim().toLowerCase();
    if (!q) return fnsForCity;
    return fnsForCity.filter((f) => f.name.toLowerCase().includes(q) || (f.code || "").toLowerCase().includes(q));
  }, [fnsForCity, fnsQuery]);

  const pickCity = (id: string) => {
    if (disabled) return;
    onChange({ cityId: id, fnsId: null, serviceId: null });
    setCityQuery(""); setFnsQuery(""); setShowAllFns(false);
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
  const resetFns = () => onChange({ cityId: value.cityId, fnsId: null, serviceId: null });

  const cityError = submitted && !selectedCity ? "Выберите город" : null;
  const fnsError = submitted && selectedCity && !selectedFns ? "Выберите инспекцию" : null;

  if (!selectedCity) {
    return (
      <CityStep
        cities={cities} cityQuery={cityQuery} setCityQuery={setCityQuery}
        cityMatches={cityMatches} showAllCities={showAllCities}
        setShowAllCities={setShowAllCities} onPick={pickCity}
        labelCities={labelCities} disabled={disabled} error={cityError}
      />
    );
  }
  if (!selectedFns) {
    const visible = showAllFns ? fnsMatches : fnsMatches.slice(0, 5);
    const overflow = fnsMatches.length - visible.length;
    return (
      <View>
        <StepLabel n={2} of={3} text={`инспекцию в г. ${selectedCity.name}`} />
        <SummaryBar label="Город" value={selectedCity.name} onReset={resetCity} disabled={disabled} />
        <View style={{ marginTop: 12 }}>
          <SearchInput value={fnsQuery} onChange={setFnsQuery} placeholder="Найти по номеру или адресу" disabled={disabled} />
        </View>
        {fnsForCity.length === 0 ? (
          <Text className="text-sm text-text-mute mt-3">В выбранном городе нет инспекций.</Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            {visible.map((f) => (<FnsRow key={f.id} fns={f} selected={false} onPress={() => pickFns(f.id)} />))}
            {visible.length === 0 && (<Text className="text-sm text-text-mute px-1 py-2">Ничего не найдено по запросу.</Text>)}
            <ShowMoreRow visible={!showAllFns && overflow > 0} count={overflow} onPress={() => setShowAllFns(true)} />
          </View>
        )}
        {fnsError && <ErrorText text={fnsError} />}
      </View>
    );
  }
  return (
    <View>
      <StepLabel n={3} of={3} text={labelServices.toLowerCase()} />
      <SummaryBar label="Инспекция" value={`${selectedCity.name} · ${selectedFns.name}`} onReset={resetFns} disabled={disabled} />
      <View style={{ marginTop: 12, gap: 8 }}>
        {services.map((s) => (
          <ServiceRow key={s.id} label={s.name} hint={SERVICE_HINT[s.name]}
            selected={value.serviceId === s.id} kind="radio" onPress={() => pickService(s.id)} />
        ))}
        <ServiceRow label="Не уверен — помогите выбрать" hint="Специалист уточнит при первом ответе."
          selected={value.serviceId === null} kind="radio" onPress={() => pickService(null)} />
      </View>
    </View>
  );
}

function EntryPicker({
  cities, fnsAll = [], services = [], onAdd,
  multiService = false, allowAnyFns = false, allowAnyService = false,
  excludeFnsIds = [], disabled = false,
  hideTopCityChips = false,
  labelCities = "Город", labelServices = "Услуги",
}: EntryModeProps) {
  const [cityId, setCityId] = useState<string | null>(null);
  const [fnsId, setFnsId] = useState<string | null>(null);
  const [anyFns, setAnyFns] = useState(false);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [anyService, setAnyService] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [fnsQuery, setFnsQuery] = useState("");
  const [showAllCities, setShowAllCities] = useState(false);
  const [showAllFns, setShowAllFns] = useState(false);

  const selectedCity = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);
  const selectedFns = useMemo(() => fnsAll.find((f) => f.id === fnsId) ?? null, [fnsAll, fnsId]);
  const excludeSet = useMemo(() => new Set(excludeFnsIds), [excludeFnsIds]);
  const fnsForCity = useMemo(() => {
    if (!selectedCity) return [];
    return fnsAll.filter((f) => f.cityId === selectedCity.id && !excludeSet.has(f.id));
  }, [fnsAll, selectedCity, excludeSet]);
  const cityMatches = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return [];
    return cities.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [cities, cityQuery]);
  const fnsMatches = useMemo(() => {
    const q = fnsQuery.trim().toLowerCase();
    if (!q) return fnsForCity;
    return fnsForCity.filter((f) => f.name.toLowerCase().includes(q) || (f.code || "").toLowerCase().includes(q));
  }, [fnsForCity, fnsQuery]);

  const reset = () => {
    setCityId(null); setFnsId(null); setAnyFns(false);
    setServiceIds([]); setAnyService(false);
    setCityQuery(""); setFnsQuery(""); setShowAllFns(false);
  };

  const finalize = (overrideServiceIds?: string[], overrideAnyService?: boolean) => {
    if (disabled || !selectedCity) return;
    if (!anyFns && !selectedFns) return;
    const sIds = overrideServiceIds ?? serviceIds;
    const sAny = overrideAnyService ?? anyService;
    onAdd({
      cityId: selectedCity.id,
      cityName: selectedCity.name,
      fnsId: anyFns ? null : selectedFns!.id,
      fnsName: anyFns ? null : selectedFns!.name,
      fnsCode: anyFns ? null : selectedFns!.code,
      serviceIds: sAny ? [] : sIds,
      serviceNames: sAny ? [] : services.filter((s) => sIds.includes(s.id)).map((s) => s.name),
    });
    reset();
  };

  const pickCity = (id: string) => {
    if (disabled) return;
    setCityId(id); setFnsId(null); setAnyFns(false); setCityQuery("");
  };
  const pickFns = (id: string) => {
    if (disabled) return;
    setFnsId(id); setAnyFns(false); setFnsQuery("");
  };
  const pickAnyFns = () => {
    if (disabled || !allowAnyFns) return;
    setFnsId(null); setAnyFns(true); setFnsQuery("");
  };
  const pickServiceSingle = (id: string | null) => {
    if (id) finalize([id], false);
    else finalize([], true);
  };
  const toggleService = (id: string) => {
    if (disabled) return;
    setAnyService(false);
    setServiceIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };
  const toggleAnyService = () => { setServiceIds([]); setAnyService((v) => !v); };
  const resetCity = () => { setCityId(null); setFnsId(null); setAnyFns(false); };
  const resetFns = () => { setFnsId(null); setAnyFns(false); setServiceIds([]); setAnyService(false); };

  if (!selectedCity) {
    return (
      <CityStep
        cities={cities} cityQuery={cityQuery} setCityQuery={setCityQuery}
        cityMatches={cityMatches} showAllCities={showAllCities}
        setShowAllCities={setShowAllCities} onPick={pickCity}
        labelCities={labelCities} disabled={disabled}
        hideTopCityChips={hideTopCityChips}
      />
    );
  }
  if (!anyFns && !selectedFns) {
    const visible = showAllFns ? fnsMatches : fnsMatches.slice(0, 5);
    const overflow = fnsMatches.length - visible.length;
    return (
      <View>
        <StepLabel n={2} of={3} text={`инспекцию в г. ${selectedCity.name}`} />
        <SummaryBar label="Город" value={selectedCity.name} onReset={resetCity} disabled={disabled} />
        <View style={{ marginTop: 12 }}>
          <SearchInput value={fnsQuery} onChange={setFnsQuery} placeholder="Найти по номеру или адресу" disabled={disabled} />
        </View>
        <View style={{ marginTop: 8 }}>
          {allowAnyFns && (
            <AnyRow
              label={`Все ИФНС в г. ${selectedCity.name}`}
              hint="Подойдёт любая инспекция этого города."
              onPress={pickAnyFns}
            />
          )}
          {fnsForCity.length === 0 && !allowAnyFns ? (
            <Text className="text-sm text-text-mute mt-3">В выбранном городе нет инспекций.</Text>
          ) : (
            visible.map((f) => (<FnsRow key={f.id} fns={f} selected={false} onPress={() => pickFns(f.id)} />))
          )}
          {visible.length === 0 && fnsQuery.length > 0 && (
            <Text className="text-sm text-text-mute px-1 py-2">Ничего не найдено по запросу.</Text>
          )}
          <ShowMoreRow visible={!showAllFns && overflow > 0} count={overflow} onPress={() => setShowAllFns(true)} />
        </View>
      </View>
    );
  }

  const fnsLabel = anyFns
    ? `${selectedCity.name} · все ИФНС`
    : `${selectedCity.name} · ${selectedFns!.name}`;

  if (!multiService) {
    return (
      <View>
        <StepLabel n={3} of={3} text={labelServices.toLowerCase()} />
        <SummaryBar label="Инспекция" value={fnsLabel} onReset={resetFns} disabled={disabled} />
        <View style={{ marginTop: 12, gap: 8 }}>
          {services.map((s) => (
            <ServiceRow key={s.id} label={s.name} hint={SERVICE_HINT[s.name]}
              selected={false} kind="radio" onPress={() => pickServiceSingle(s.id)} />
          ))}
          {allowAnyService && (
            <ServiceRow label="Любая услуга" hint="Все доступные услуги в этой инспекции."
              selected={false} kind="radio" onPress={() => pickServiceSingle(null)} />
          )}
        </View>
      </View>
    );
  }

  const canFinalize = anyService || serviceIds.length > 0;
  return (
    <View>
      <StepLabel n={3} of={3} text={labelServices.toLowerCase()} />
      <SummaryBar label="Инспекция" value={fnsLabel} onReset={resetFns} disabled={disabled} />
      <View style={{ marginTop: 12, gap: 8 }}>
        {services.map((s) => (
          <ServiceRow key={s.id} label={s.name} hint={SERVICE_HINT[s.name]}
            selected={!anyService && serviceIds.includes(s.id)} kind="checkbox"
            onPress={() => toggleService(s.id)} />
        ))}
        {allowAnyService && (
          <ServiceRow label="Все услуги" hint="Любая услуга в этой инспекции."
            selected={anyService} kind="checkbox" onPress={toggleAnyService} />
        )}
      </View>
      <View style={{ marginTop: 16 }}>
        <Button label="Добавить" onPress={() => finalize()} disabled={!canFinalize || disabled} />
      </View>
    </View>
  );
}

function MultiPicker({
  cities, fnsAll, services, value, onChange,
  disabled = false, labelCities, labelFns, labelServices,
}: MultiModeProps) {
  return (
    <View>
      <CityFnsCascade
        mode="typeahead" value={value}
        onChange={(v) => !disabled && onChange(v)}
        citiesSource={cities} fnsSource={fnsAll} services={services}
        labelCities={labelCities} labelFns={labelFns} labelServices={labelServices}
      />
    </View>
  );
}

function CityStep({
  cities, cityQuery, setCityQuery, cityMatches, showAllCities,
  setShowAllCities, onPick, labelCities, disabled, error,
}: {
  cities: CityCascadeOption[];
  cityQuery: string;
  setCityQuery: (v: string) => void;
  cityMatches: CityCascadeOption[];
  showAllCities: boolean;
  setShowAllCities: (v: boolean) => void;
  onPick: (id: string) => void;
  labelCities: string;
  disabled: boolean;
  error?: string | null;
  hideTopCityChips?: boolean;
}) {
  const topCityOptions = useMemo(
    () => TOP_CITIES.map((n) => cities.find((c) => c.name === n)).filter((c): c is CityCascadeOption => !!c),
    [cities]
  );
  const topCityIds = useMemo(() => new Set(topCityOptions.map((c) => c.id)), [topCityOptions]);
  const remaining = useMemo(() => cities.filter((c) => !topCityIds.has(c.id)), [cities, topCityIds]);

  return (
    <View>
      <StepLabel n={1} of={3} text={labelCities.toLowerCase()} />
      <View style={{ position: "relative", zIndex: Z.POPOVER }}>
        <SearchInput value={cityQuery} onChange={setCityQuery} placeholder="Поиск по городу" disabled={disabled} />
        {cityQuery.trim().length >= 2 && (
          <DropdownContainer>
            {cityMatches.length === 0 ? (
              <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                <Text className="text-sm text-text-mute">Ничего не найдено</Text>
              </View>
            ) : (
              cityMatches.map((c) => (
                <DropdownRow key={c.id}
                  icon={<MapPin size={14} color={colors.textMuted} />}
                  title={c.name} onPress={() => onPick(c.id)} />
              ))
            )}
          </DropdownContainer>
        )}
      </View>
      <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
        {topCityOptions.map((c) => (<CityChip key={c.id} label={c.name} onPress={() => onPick(c.id)} />))}
      </View>
      {error && <ErrorText text={error} />}
    </View>
  );
}

function StepLabel({ n, of, text }: { n: number; of: number; text: string }) {
  return (
    <Text className="text-xs font-semibold uppercase tracking-wider mb-2"
      style={{ color: colors.textMuted }}>
      Шаг {n} из {of} · {text}
    </Text>
  );
}

function SearchInput({
  value, onChange, placeholder, disabled,
}: { value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean }) {
  return (
    <Input
      variant="bordered" icon={Search} placeholder={placeholder}
      value={value} onChangeText={onChange} editable={!disabled}
      rightSlot={
        value.length > 0 ? (
          <Pressable
            accessibilityRole="button" accessibilityLabel="Очистить"
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
    <View className="absolute left-0 right-0 bg-white border border-border rounded-xl overflow-hidden"
      style={{
        top: 48, maxHeight: 360, ...layer("POPOVER"),
        shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1, shadowRadius: 16,
      }}>
      {children}
    </View>
  );
}

function DropdownRow({
  icon, title, subtitle, onPress,
}: { icon: React.ReactNode; title: string; subtitle?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={title}
      onPress={onPress} className="px-4 py-3 flex-row items-start" style={{ gap: 10 }}
    >
      <View style={{ marginTop: 1 }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text className="text-sm text-text-base">{title}</Text>
        {subtitle && (<Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{subtitle}</Text>)}
      </View>
    </Pressable>
  );
}

function CityChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      className="px-3 py-1.5 rounded-full border bg-white" style={{ borderColor: colors.border }}
    >
      <Text className="text-xs" style={{ color: colors.text }}>{label}</Text>
    </Pressable>
  );
}

function FnsRow({
  fns, selected, onPress,
}: { fns: FnsCascadeOption; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={fns.name} onPress={onPress}
      className="flex-row items-start py-3 px-3 rounded-lg"
      style={{ gap: 12, backgroundColor: selected ? colors.accentSoft : "transparent" }}
    >
      <Radio selected={selected} />
      <View style={{ flex: 1 }}>
        <Text className="text-sm font-medium" style={{ color: colors.text }} numberOfLines={2}>{fns.name}</Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }} numberOfLines={1}>
          {fns.cityName ? `г. ${fns.cityName}` : ""}{fns.code ? ` · код ${fns.code}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

function AnyRow({
  label, hint, onPress,
}: { label: string; hint?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      className="flex-row items-start py-3 px-3 rounded-lg mb-1"
      style={{ gap: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border }}
    >
      <Globe size={16} color={colors.primary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text className="text-sm font-medium" style={{ color: colors.text }}>{label}</Text>
        {hint && (<Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{hint}</Text>)}
      </View>
    </Pressable>
  );
}

function ShowMoreRow({
  visible, count, onPress,
}: { visible: boolean; count: number; onPress: () => void }) {
  if (!visible) return null;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={`Показать ещё ${count}`} onPress={onPress}
      className="flex-row items-center justify-center mt-1 py-2"
    >
      <Text className="text-sm" style={{ color: colors.primary }}>Показать ещё ({count})</Text>
      <ChevronDown size={14} color={colors.primary} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

function ServiceRow({
  label, hint, selected, kind, onPress,
}: { label: string; hint?: string; selected: boolean; kind: "radio" | "checkbox"; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      className="flex-row items-start p-3 rounded-xl border"
      style={{
        gap: 12,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.accentSoft : colors.white,
      }}
    >
      {kind === "radio" ? <Radio selected={selected} /> : <CheckBox selected={selected} />}
      <View style={{ flex: 1 }}>
        <Text className="text-sm font-medium" style={{ color: colors.text }}>{label}</Text>
        {hint && (<Text className="text-xs mt-1" style={{ color: colors.textMuted }}>{hint}</Text>)}
      </View>
    </Pressable>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <View style={{
      width: 20, height: 20, borderRadius: 10, borderWidth: 2,
      borderColor: selected ? colors.primary : colors.border,
      alignItems: "center", justifyContent: "center", marginTop: 1,
    }}>
      {selected && (<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />)}
    </View>
  );
}

function CheckBox({ selected }: { selected: boolean }) {
  return (
    <View style={{
      width: 20, height: 20, borderRadius: 4, borderWidth: 2,
      borderColor: selected ? colors.primary : colors.border,
      backgroundColor: selected ? colors.primary : "transparent",
      alignItems: "center", justifyContent: "center", marginTop: 1,
    }}>
      {selected && <Check size={12} color="#fff" />}
    </View>
  );
}

function SummaryBar({
  label, value, onReset, disabled,
}: { label: string; value: string; onReset: () => void; disabled?: boolean }) {
  return (
    <View className="flex-row items-center justify-between rounded-lg px-3 py-2"
      style={{ backgroundColor: colors.surface2, gap: 8 }}>
      <View className="flex-row items-center" style={{ gap: 8, flex: 1, minWidth: 0 }}>
        <Check size={14} color={colors.success} />
        <Text className="text-xs" style={{ color: colors.textMuted }}>{label}:</Text>
        <Text className="text-sm font-medium" style={{ color: colors.text, flexShrink: 1 }} numberOfLines={1}>{value}</Text>
      </View>
      {!disabled && (
        <Pressable accessibilityRole="button"
          accessibilityLabel={`Изменить ${label.toLowerCase()}`}
          onPress={onReset} className="px-2 py-1" hitSlop={6}
        >
          <Text className="text-xs" style={{ color: colors.primary }}>Изменить</Text>
        </Pressable>
      )}
    </View>
  );
}

function ErrorText({ text }: { text: string }) {
  return (<Text className="text-xs mt-2" style={{ color: colors.danger }}>{text}</Text>);
}
