import { View, Text, Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface PageTitleProps {
  title: string;
  subtitle?: string;
  /** Кликабельная стрелка «Назад» слева от заголовка. Когда передан —
   *  рендерится строка-заголовок: [back] [title]. Без стрелки —
   *  обычный заголовок без «Назад». */
  onBack?: () => void;
  /** Дополнительный элемент справа от заголовка (например
   *  AutosaveIndicator на /profile). Растягивает строку заголовка
   *  до flex-row с justify-between. */
  rightSlot?: React.ReactNode;
  /** Максимальная ширина обёртки заголовка — должна совпадать с
   *  maxWidth контентной зоны страницы, чтобы заголовок и список
   *  визуально жили в одной колонке. По умолчанию 960 (как у
   *  каталога/листинга). */
  maxWidth?: number;
}

/**
 * Унифицированный заголовок страницы. Используется на всех
 * листинг-/детальных-/настроечных страницах: «Запросы», «Мои запросы»,
 * «Специалисты», «Избранные», «Профиль», «Новый запрос», и т.д.
 *
 * Поведение:
 *   — Заголовок ОТЦЕНТРОВАН по `maxWidth` (по умолчанию 960). Список
 *     ниже должен иметь такой же maxWidth + alignSelf:center, чтобы
 *     заголовок и контент жили в одной колонке.
 *   — Стрелка «Назад» (если есть) слева в той же строке — НЕ толкает
 *     контент вниз отдельной строкой.
 *   — rightSlot правее заголовка через flex justify-between.
 *
 * Рит хм: 16px вертикальные отступы — это canonical gap до следующей
 * секции. Не добавляйте свой pt- на следующий элемент.
 */
export default function PageTitle({
  title,
  subtitle,
  onBack,
  rightSlot,
  maxWidth = 960,
}: PageTitleProps) {
  return (
    <View
      style={{
        width: "100%",
        maxWidth,
        alignSelf: "center",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        {onBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Назад"
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => [
              {
                width: 32,
                height: 32,
                marginLeft: -6, // оптически выравниваем с заголовком
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
              },
              pressed && { backgroundColor: colors.surface2 ?? colors.border },
            ]}
          >
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
        )}
        <Text
          className="text-xl font-bold text-text-base"
          style={{ flex: 1 }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {rightSlot ? <View>{rightSlot}</View> : null}
      </View>
      {subtitle ? (
        <Text
          className="text-sm text-text-mute"
          style={{ marginTop: 4, marginLeft: onBack ? 34 : 0 }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
