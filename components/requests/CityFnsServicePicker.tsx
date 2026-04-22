import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { ChevronUp, ChevronDown } from "lucide-react-native";
import { colors } from "@/lib/theme";

export interface CityOption {
  id: string;
  name: string;
  slug: string;
}

export interface FnsOption {
  id: string;
  name: string;
  code: string;
  cityId: string;
}

export interface ServiceOption {
  id: string;
  name: string;
}

interface CityFnsServicePickerProps {
  cities: CityOption[];
  fnsOffices: FnsOption[];
  services: ServiceOption[];
  selectedCity: CityOption | undefined;
  selectedFns: FnsOption | undefined;
  selectedService: ServiceOption | undefined;
  cityOpen: boolean;
  fnsOpen: boolean;
  serviceOpen: boolean;
  loadingFns: boolean;
  submitted: boolean;
  disabled: boolean;
  onCitySelect: (city: CityOption) => void;
  onFnsSelect: (fns: FnsOption) => void;
  onServiceSelect: (svc: ServiceOption) => void;
  onServiceClear: () => void;
  onCityOpenChange: (val: boolean) => void;
  onFnsOpenChange: (val: boolean) => void;
  onServiceOpenChange: (val: boolean) => void;
}

export default function CityFnsServicePicker({
  cities,
  fnsOffices,
  services,
  selectedCity,
  selectedFns,
  selectedService,
  cityOpen,
  fnsOpen,
  serviceOpen,
  loadingFns,
  submitted,
  disabled,
  onCitySelect,
  onFnsSelect,
  onServiceSelect,
  onServiceClear,
  onCityOpenChange,
  onFnsOpenChange,
  onServiceOpenChange,
}: CityFnsServicePickerProps) {
  return (
    <View>
      {/* City select */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-text-base mb-1.5">
          Город <Text className="text-danger">*</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Выбрать город"
          onPress={() => {
            if (disabled) return;
            onCityOpenChange(!cityOpen);
            onFnsOpenChange(false);
            onServiceOpenChange(false);
          }}
          className={`h-12 border rounded-xl px-4 flex-row items-center justify-between ${
            submitted && !selectedCity
              ? "border-danger bg-danger-soft"
              : "border-border bg-white"
          }`}
        >
          <Text className={selectedCity ? "text-text-base text-base" : "text-text-mute text-base"}>
            {selectedCity?.name || "Выберите город"}
          </Text>
          {cityOpen
            ? <ChevronUp size={12} color={colors.placeholder} />
            : <ChevronDown size={12} color={colors.placeholder} />}
        </Pressable>
        {submitted && !selectedCity && (
          <Text className="text-xs text-danger mt-1">Выберите город</Text>
        )}
        {cityOpen && (
          <View
            className="border border-border rounded-xl mt-1 bg-white overflow-hidden"
            style={{ maxHeight: 192 }}
          >
            <ScrollView nestedScrollEnabled>
              {cities.length === 0 ? (
                <View className="px-4 py-3">
                  <Text className="text-sm text-text-mute">Загрузка...</Text>
                </View>
              ) : (
                cities.map((city) => (
                  <Pressable
                    accessibilityRole="button"
                    key={city.id}
                    accessibilityLabel={city.name}
                    onPress={() => onCitySelect(city)}
                    className="px-4 py-3 border-b border-surface2 active:bg-surface2"
                  >
                    <Text className="text-base text-text-base">{city.name}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* FNS select */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-text-base mb-1.5">
          Инспекция <Text className="text-danger">*</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Выбрать инспекцию ФНС"
          onPress={() => {
            if (!selectedCity || disabled) return;
            onFnsOpenChange(!fnsOpen);
            onCityOpenChange(false);
            onServiceOpenChange(false);
          }}
          className={`h-12 border rounded-xl px-4 flex-row items-center justify-between ${
            !selectedCity
              ? "border-border bg-surface2"
              : submitted && !selectedFns
              ? "border-danger bg-danger-soft"
              : "border-border bg-white"
          }`}
        >
          <Text className={selectedFns ? "text-text-base text-base" : "text-text-mute text-base"}>
            {loadingFns
              ? "Загрузка..."
              : selectedFns?.name ||
                (selectedCity ? "Выберите инспекцию" : "Сначала выберите город")}
          </Text>
          {loadingFns ? (
            <ActivityIndicator size="small" color={colors.placeholder} />
          ) : fnsOpen ? (
            <ChevronUp size={12} color={colors.placeholder} />
          ) : (
            <ChevronDown size={12} color={colors.placeholder} />
          )}
        </Pressable>
        {submitted && selectedCity && !selectedFns && (
          <Text className="text-xs text-danger mt-1">Выберите инспекцию</Text>
        )}
        {fnsOpen && (
          <View
            className="border border-border rounded-xl mt-1 bg-white overflow-hidden"
            style={{ maxHeight: 192 }}
          >
            <ScrollView nestedScrollEnabled>
              {fnsOffices.length === 0 ? (
                <View className="px-4 py-3">
                  <Text className="text-sm text-text-mute">Нет отделений для выбранного города</Text>
                </View>
              ) : (
                fnsOffices.map((fns) => (
                  <Pressable
                    accessibilityRole="button"
                    key={fns.id}
                    accessibilityLabel={fns.name}
                    onPress={() => onFnsSelect(fns)}
                    className="px-4 py-3 border-b border-surface2 active:bg-surface2"
                  >
                    <Text className="text-base text-text-base">{fns.name}</Text>
                    <Text className="text-xs text-text-mute">{fns.code}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Service type select (optional) */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-text-base mb-1.5">Тип проверки</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Выбрать тип проверки"
          onPress={() => {
            if (disabled) return;
            onServiceOpenChange(!serviceOpen);
            onCityOpenChange(false);
            onFnsOpenChange(false);
          }}
          className="h-12 border border-border rounded-xl bg-white px-4 flex-row items-center justify-between"
        >
          <Text className={selectedService ? "text-text-base text-base" : "text-text-mute text-base"}>
            {selectedService?.name || "Не знаю / не указывать"}
          </Text>
          {serviceOpen ? <ChevronUp size={12} color={colors.placeholder} /> : <ChevronDown size={12} color={colors.placeholder} />}
        </Pressable>
        {serviceOpen && (
          <View
            className="border border-border rounded-xl mt-1 bg-white overflow-hidden"
            style={{ maxHeight: 192 }}
          >
            <ScrollView nestedScrollEnabled>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Не знаю"
                onPress={onServiceClear}
                className="px-4 py-3 border-b border-surface2 active:bg-surface2"
              >
                <Text className="text-base text-text-mute">Не знаю / не указывать</Text>
              </Pressable>
              {services.map((svc) => (
                <Pressable
                  accessibilityRole="button"
                  key={svc.id}
                  accessibilityLabel={svc.name}
                  onPress={() => onServiceSelect(svc)}
                  className="px-4 py-3 border-b border-surface2 active:bg-surface2"
                >
                  <Text className="text-base text-text-base">{svc.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}
