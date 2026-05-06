import { View, Text, Image } from "react-native";
import { colors } from "@/lib/theme";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FNS_LOGO = require("@/assets/fns/fns-logo.webp");

interface FnsLogoProps {
  /** Полное название ИФНС — из него вытаскиваем «№ N», если есть. */
  name: string;
  /** Город — подписывается под логотипом. */
  cityName?: string | null;
  /** sm = 48px, md = 64px, lg = 96px квадрат под иконку. */
  size?: "sm" | "md" | "lg";
}

/**
 * «Герб» ИФНС — квадратная карточка-логотип. Сверху иконка + бейдж
 * с номером (если есть в названии «№ N»), снизу подпись города.
 *
 * Дизайн-задумка: вытаскиваем номер из названия ИФНС регэкспом,
 * чтобы УФНС/МРИ без номера показывали короткий ярлык («УФНС»/«МРИ»).
 * Когда подъедет реальный webp-логотип ФНС, заменим иконку на Image.
 */
export default function FnsLogo({ name, cityName, size = "md" }: FnsLogoProps) {
  const dim = size === "sm" ? 48 : size === "lg" ? 96 : 64;
  const fontSize = size === "sm" ? 9 : size === "lg" ? 13 : 11;
  const cityFontSize = size === "sm" ? 9 : size === "lg" ? 12 : 10;

  // Достаём «№ N» из названия. Регэксп: «№ 7», «№7», «N 7» и т.п.
  const numMatch = name.match(/№\s*(\d+[А-Яа-я]?)/);
  const num = numMatch?.[1];

  // Короткий ярлык если номера нет.
  let shortLabel: string | null = null;
  if (!num) {
    if (/Управление\s+ФНС/i.test(name)) shortLabel = "УФНС";
    else if (/Межрегиональная/i.test(name)) shortLabel = "МРИ";
    else if (/Межрайонная/i.test(name)) shortLabel = "МРФНС";
  }

  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <View
        style={{
          width: dim,
          height: dim,
          borderRadius: size === "sm" ? 10 : 14,
          backgroundColor: colors.white,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Image
          source={FNS_LOGO}
          style={{
            width: dim - 8,
            height: dim - 8,
            resizeMode: "contain",
          }}
        />
        {(num || shortLabel) && (
          <View
            style={{
              position: "absolute",
              right: -4,
              bottom: -4,
              minWidth: size === "sm" ? 20 : 26,
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: 999,
              backgroundColor: colors.primary,
              borderWidth: 2,
              borderColor: colors.white,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: colors.white,
                fontWeight: "800",
                fontSize,
                lineHeight: fontSize + 2,
              }}
            >
              {num ? `№${num}` : shortLabel}
            </Text>
          </View>
        )}
      </View>
      {cityName && (
        <Text
          style={{
            fontSize: cityFontSize,
            color: colors.textSecondary,
            fontWeight: "600",
            textAlign: "center",
            maxWidth: dim + 16,
          }}
          numberOfLines={1}
        >
          {cityName}
        </Text>
      )}
    </View>
  );
}
