import { View, Text, Image } from "react-native";
import { colors } from "@/lib/theme";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FNS_LOGO = require("@/assets/fns/fns-logo.webp");

interface FnsLogoProps {
  /** Полное название ИФНС — из него вытаскиваем «№ N», если есть. */
  name: string;
  /** Город — печатается лентой по нижнему краю логотипа. */
  cityName?: string | null;
  /** sm = 56px, md = 72px, lg = 104px квадрат под иконку. */
  size?: "sm" | "md" | "lg";
}

// Карта спец-сокращений длинных городов. Регистрозависимо: совпадение
// должно быть точным (мы получаем из БД канонические названия).
const CITY_SHORT: Record<string, string> = {
  "Санкт-Петербург": "СПб",
  "Нижний Новгород": "Н.Новгород",
  "Великий Новгород": "В.Новгород",
  "Набережные Челны": "Н.Челны",
  "Ростов-на-Дону": "Ростов",
  "Йошкар-Ола": "Й.Ола",
  "Каменск-Уральский": "Каменск",
  "Великие Луки": "В.Луки",
  "Старый Оскол": "С.Оскол",
  "Петропавловск-Камчатский": "Петропавл.",
  "Комсомольск-на-Амуре": "Комсомольск",
  "Усть-Каменогорск": "Усть-К.",
  "Южно-Сахалинск": "Ю.Сахалинск",
  "Ханты-Мансийск": "Х-Мансийск",
};

function shortenCity(name: string, maxLen: number): string {
  if (CITY_SHORT[name]) return CITY_SHORT[name];
  if (name.length <= maxLen) return name;
  // Дефис посередине → берём первую часть.
  const dashIdx = name.indexOf("-");
  if (dashIdx > 2 && dashIdx < name.length - 2) {
    const head = name.slice(0, dashIdx);
    if (head.length <= maxLen) return head;
  }
  // Пробел → "F.Lastname" сокращение.
  const spaceIdx = name.indexOf(" ");
  if (spaceIdx > 0) {
    const compact = `${name[0]}.${name.slice(spaceIdx + 1)}`;
    if (compact.length <= maxLen) return compact;
  }
  // Финал — обрезаем по длине.
  return name.slice(0, maxLen - 1) + ".";
}

/**
 * «Герб» ИФНС: официальный логотип ФНС России на белом фоне с
 * бейджем номера справа сверху и лентой города по нижнему краю.
 *
 * Длинные названия городов сокращаются по картe + дефис/пробел
 * правилам, чтобы влезть в ленту без переноса.
 */
export default function FnsLogo({ name, cityName, size = "md" }: FnsLogoProps) {
  const dim = size === "sm" ? 56 : size === "lg" ? 104 : 72;
  const ribbonHeight = size === "sm" ? 14 : size === "lg" ? 22 : 18;
  const cityFontSize = size === "sm" ? 9 : size === "lg" ? 13 : 11;
  const numFontSize = size === "sm" ? 9 : size === "lg" ? 13 : 11;
  const numMin = size === "sm" ? 22 : size === "lg" ? 32 : 26;
  // Под ленту режем по примерной плотности: ~1.6 чар на px при текущем шрифте.
  const cityMaxLen = size === "sm" ? 8 : size === "lg" ? 14 : 11;

  // Достаём «№ N» из названия. Регэксп: «№ 7», «№7», «N 7» и т.п.
  const numMatch = name.match(/№\s*(\d+[А-Яа-я]?)/);
  const num = numMatch?.[1];

  // Короткий ярлык если номера нет.
  let shortLabel: string | null = null;
  if (!num) {
    if (/Управление\s+ФНС/i.test(name)) shortLabel = "УФНС";
    else if (/Межрегиональная/i.test(name)) shortLabel = "МРИ";
    else if (/Межрайонная/i.test(name)) shortLabel = "МРИ";
  }

  const cityLabel = cityName ? shortenCity(cityName, cityMaxLen) : null;

  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: size === "sm" ? 10 : 14,
        backgroundColor: colors.white,
        position: "relative",
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {/* Логотип (центрируется в зоне над лентой). */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 6,
          paddingBottom: cityLabel ? 4 : 6,
        }}
      >
        <Image
          source={FNS_LOGO}
          style={{
            width: dim - 18,
            height: dim - ribbonHeight - 14,
            resizeMode: "contain",
          }}
        />
      </View>

      {/* Лента города. */}
      {cityLabel && (
        <View
          style={{
            height: ribbonHeight,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text
            style={{
              color: colors.white,
              fontWeight: "800",
              fontSize: cityFontSize,
              letterSpacing: 0.3,
            }}
            numberOfLines={1}
          >
            {cityLabel.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Бейдж номера/типа в правом верхнем углу. */}
      {(num || shortLabel) && (
        <View
          style={{
            position: "absolute",
            right: -3,
            top: -3,
            minWidth: numMin,
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
              fontSize: numFontSize,
              lineHeight: numFontSize + 2,
            }}
          >
            {num ? `№${num}` : shortLabel}
          </Text>
        </View>
      )}
    </View>
  );
}
