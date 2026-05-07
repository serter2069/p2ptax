import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { MapPin, X } from "lucide-react-native";
import CityFnsCascade, { type CityFnsValue } from "@/components/filters/CityFnsCascade";
import { apiPatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";

/**
 * ConsultantFnsCard — карточка в /profile, в которой юзер выбирает свою
 * налоговую инспекцию для контекста бота-консультанта.
 *
 * Зачем:
 *   - Бот в /consultant подмешивает выбранную ИФНС в каждый запрос к
 *     TaxLLM. Это улучшает релевантность ответов про региональные
 *     ставки/льготы и позволяет шаблонам сразу подставлять реквизиты
 *     адресата.
 *   - Раньше pickup жил в шапке консультанта (AsyncStorage). Перенесён
 *     сюда чтобы:
 *       * хранилось в БД (синк между устройствами);
 *       * админ видел в профиле;
 *       * бот мог сам спросить и записать в будущем;
 *       * чат не отвлекался на инфраструктурный UI.
 */
export default function ConsultantFnsCard() {
  const { user, updateUser } = useAuth();
  const current = user?.consultantFns ?? null;
  const [saving, setSaving] = useState(false);

  // Внутреннее состояние каскада — single-mode хранит массивы из 0/1 элемента.
  const [value, setValue] = useState<CityFnsValue>(() => ({
    cities: current?.city?.id ? [current.city.id] : [],
    fns: current?.id ? [current.id] : [],
  }));

  async function handleChange(next: CityFnsValue) {
    setValue(next);
    // Если выбрана ИФНС — сохраняем. Если только город — ждём выбора ИФНС.
    if (next.fns.length > 0 && next.fns[0] !== current?.id) {
      await save(next.fns[0]);
    }
  }

  async function save(consultantFnsId: string | null) {
    setSaving(true);
    try {
      const r = await apiPatch<{
        user: typeof user & { consultantFns: typeof current };
      }>("/api/user/profile", { consultantFnsId });
      // Локально обновляем user в auth-context — баннер в /consultant
      // тут же исчезнет, и backend будет получать новый контекст.
      updateUser({ consultantFns: r.user?.consultantFns ?? null });
    } catch {
      // best effort — UI оставим как есть
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setValue({ cities: [], fns: [] });
    await save(null);
  }

  return (
    <View
      className="bg-white border border-border rounded-2xl px-4 py-5 mb-4"
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <MapPin size={16} color={colors.primary} />
        <Text className="text-xs font-semibold text-text-mute uppercase tracking-wider">
          Моя налоговая инспекция (для консультанта)
        </Text>
      </View>
      <Text className="text-sm text-text-secondary mb-4">
        Бот-консультант будет учитывать вашу инспекцию при ответах:
        региональные ставки, точные реквизиты адресата в шаблонах
        документов. Если не указано — бот может попросить уточнить
        в самом чате.
      </Text>

      {current && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: colors.accentSoft,
            marginBottom: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.accentSoftInk }}>
              {current.name}
              {current.code ? ` (код ${current.code})` : ""}
            </Text>
            <Text style={{ fontSize: 12, color: colors.accentSoftInk, marginTop: 2 }}>
              г. {current.city.name}
              {current.address ? ` · ${current.address}` : ""}
            </Text>
          </View>
          <Pressable
            onPress={handleClear}
            disabled={saving}
            accessibilityLabel="Сбросить выбор инспекции"
            hitSlop={8}
            style={{
              padding: 6,
              borderRadius: 6,
              backgroundColor: colors.surface,
            }}
          >
            <X size={14} color={colors.danger} />
          </Pressable>
        </View>
      )}

      <CityFnsCascade
        mode="single"
        value={value}
        onChange={handleChange}
        labelCities={current ? "Изменить город" : "Город"}
        labelFns="Инспекция ФНС"
      />

      {saving && (
        <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
          Сохраняем…
        </Text>
      )}
    </View>
  );
}
