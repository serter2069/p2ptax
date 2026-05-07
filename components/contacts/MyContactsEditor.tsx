import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Plus, Trash2 } from "lucide-react-native";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { colors } from "@/lib/theme";

export interface UserContactRow {
  id: string;
  kind: string; // email | phone | telegram | whatsapp | other
  value: string;
  label: string | null;
  sortOrder: number;
}

const KIND_OPTIONS: { value: string; label: string; icon: string; placeholder: string }[] = [
  { value: "email",    label: "Email",    icon: "✉️", placeholder: "you@example.com" },
  { value: "phone",    label: "Телефон",  icon: "📞", placeholder: "+7 (___) ___-__-__" },
  { value: "telegram", label: "Telegram", icon: "✈️", placeholder: "@username или t.me/username" },
  { value: "whatsapp", label: "WhatsApp", icon: "💬", placeholder: "+7 (___) ___-__-__" },
  { value: "other",    label: "Другое",   icon: "🔗", placeholder: "ссылка / ник / адрес" },
];

const KIND_BY: Record<string, (typeof KIND_OPTIONS)[number]> = Object.fromEntries(
  KIND_OPTIONS.map((k) => [k.value, k]),
);

interface Props {
  /** Если true — всё компактно (без хедера), для встраивания в форму запроса. */
  compact?: boolean;
  /** Колбэк после любого изменения списка (полезно вызывающему). */
  onChange?: (items: UserContactRow[]) => void;
}

/**
 * CRUD-редактор «Мои контакты». Используется на /profile и инлайн на
 * /requests/new (когда клиент включает «Показывать мои контакты»).
 * Хранит данные на сервере в UserContact, а email-контакт автоматически
 * создаётся при регистрации — пользователь может удалить и его.
 */
export default function MyContactsEditor({ compact, onChange }: Props) {
  const [items, setItems] = useState<UserContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Форма добавления нового контакта.
  const [newKind, setNewKind] = useState<string>("phone");
  const [newValue, setNewValue] = useState("");
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await apiGet<{ items: UserContactRow[] }>("/api/user/contacts");
      setItems(res.items);
      onChange?.(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить контакты");
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleAdd = useCallback(async () => {
    const v = newValue.trim();
    if (!v) return;
    setAdding(true);
    setError(null);
    try {
      const created = await apiPost<UserContactRow>("/api/user/contacts", {
        kind: newKind,
        value: v,
      });
      const next = [...items, created];
      setItems(next);
      onChange?.(next);
      setNewValue("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось добавить контакт");
    } finally {
      setAdding(false);
    }
  }, [items, newKind, newValue, onChange]);

  const handleDelete = useCallback(
    async (id: string) => {
      const next = items.filter((c) => c.id !== id);
      setItems(next);
      onChange?.(next);
      try {
        await apiDelete(`/api/user/contacts/${id}`);
      } catch {
        // откат
        await refresh();
      }
    },
    [items, onChange, refresh],
  );

  if (loading) {
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View>
      {!compact && (
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          Мои контакты
        </Text>
      )}
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12, lineHeight: 16 }}>
        Эти контакты увидят авторизованные специалисты по кнопке «Показать контакты» на запросе — если вы включили показ. На каждом запросе видимость можно переключить отдельно.
      </Text>

      {/* Список существующих контактов */}
      {items.length > 0 && (
        <View style={{ gap: 8, marginBottom: 12 }}>
          {items.map((c) => {
            const kind = KIND_BY[c.kind] ?? KIND_BY.other;
            return (
              <View
                key={c.id}
                className="flex-row items-center"
                style={{
                  gap: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.white,
                }}
              >
                <Text style={{ fontSize: 16 }}>{kind.icon}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: "600" }}>
                    {kind.label}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.text, marginTop: 1 }} numberOfLines={1}>
                    {c.value}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Удалить контакт"
                  onPress={() => handleDelete(c.id)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    {
                      padding: 6,
                      borderRadius: 8,
                    },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Trash2 size={15} color={colors.textMuted} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {/* Форма добавления */}
      <View
        style={{
          gap: 8,
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          borderStyle: "dashed",
          backgroundColor: colors.white,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>
          Добавить контакт
        </Text>
        <View className="flex-row flex-wrap" style={{ gap: 6 }}>
          {KIND_OPTIONS.map((opt) => {
            const active = newKind === opt.value;
            return (
              <Pressable
                key={opt.value}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
                onPress={() => setNewKind(opt.value)}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : colors.white,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={{ fontSize: 12 }}>{opt.icon}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: active ? "600" : "400",
                    color: active ? colors.white : colors.textSecondary,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View className="flex-row" style={{ gap: 8 }}>
          <TextInput
            value={newValue}
            onChangeText={setNewValue}
            placeholder={KIND_BY[newKind]?.placeholder ?? ""}
            placeholderTextColor={colors.placeholder}
            autoCapitalize="none"
            keyboardType={newKind === "phone" || newKind === "whatsapp" ? "phone-pad" : "default"}
            editable={!adding}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: colors.text,
              backgroundColor: colors.white,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              outlineWidth: 0 as any,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Добавить"
            onPress={handleAdd}
            disabled={!newValue.trim() || adding}
            style={({ pressed }) => [
              {
                paddingHorizontal: 14,
                borderRadius: 10,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 4,
              },
              pressed && { opacity: 0.85 },
              (!newValue.trim() || adding) && { opacity: 0.5 },
            ]}
          >
            <Plus size={14} color={colors.white} />
            <Text style={{ color: colors.white, fontSize: 13, fontWeight: "600" }}>
              Добавить
            </Text>
          </Pressable>
        </View>
      </View>

      {error && (
        <Text style={{ fontSize: 12, color: colors.error, marginTop: 8 }}>{error}</Text>
      )}
    </View>
  );
}
