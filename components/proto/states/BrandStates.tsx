import React from 'react';
import { View, Text, ScrollView, Pressable, TextInput, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Colors';
import { Toggle as ToggleComponent } from '../Toggle';

// =====================================================================
// HELPERS
// =====================================================================
function isLight(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function useLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  return { isDesktop, width };
}

// =====================================================================
// BRAND STYLE SECTIONS
// =====================================================================

// -- Hero --
function HeroSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View
      className={`items-center gap-3 rounded-xl border bg-bgPrimary p-8 ${isDesktop ? 'p-10' : ''}`}
      style={{ borderColor: Colors.borderLight }}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-lg bg-brandPrimary">
          <Feather name="shield" size={isDesktop ? 28 : 22} color={Colors.white} />
        </View>
        <Text
          className={`font-bold tracking-tight text-textPrimary ${isDesktop ? 'text-3xl' : 'text-2xl'}`}
          style={{ fontSize: isDesktop ? Typography.fontSize.display : Typography.fontSize['3xl'] }}
        >
          Nalogovik
        </Text>
      </View>
      <Text
        className={`text-center font-medium text-textSecondary ${isDesktop ? 'text-xl' : 'text-lg'}`}
        style={{ marginTop: Spacing.xs }}
      >
        Система дизайна
      </Text>
      <Text className="text-center text-sm text-textMuted">
        Визуальный язык маркетплейса налоговых специалистов
      </Text>
      <View className="my-2 h-px w-10" style={{ backgroundColor: Colors.border }} />
      <View className="flex-row gap-2">
        <View className="h-[5px] w-10 rounded-full" style={{ backgroundColor: Colors.brandPrimary }} />
        <View className="h-[5px] w-10 rounded-full" style={{ backgroundColor: Colors.brandPrimaryHover }} />
        <View className="h-[5px] w-10 rounded-full" style={{ backgroundColor: Colors.brandSecondary }} />
        <View className="h-[5px] w-10 rounded-full" style={{ backgroundColor: Colors.textPrimary }} />
      </View>
    </View>
  );
}

// -- Color Palette --
const COLOR_GROUPS = [
  {
    group: 'Бренд',
    items: [
      { label: 'Primary', value: Colors.brandPrimary, token: 'brandPrimary' },
      { label: 'Hover', value: Colors.brandPrimaryHover, token: 'brandPrimaryHover' },
      { label: 'Secondary', value: Colors.brandSecondary, token: 'brandSecondary' },
    ],
  },
  {
    group: 'Фоны',
    items: [
      { label: 'Primary', value: Colors.bgPrimary, token: 'bgPrimary' },
      { label: 'Secondary', value: Colors.bgSecondary, token: 'bgSecondary' },
      { label: 'Surface', value: Colors.bgSurface, token: 'bgSurface' },
      { label: 'Card', value: Colors.bgCard, token: 'bgCard' },
    ],
  },
  {
    group: 'Текст',
    items: [
      { label: 'Primary', value: Colors.textPrimary, token: 'textPrimary' },
      { label: 'Secondary', value: Colors.textSecondary, token: 'textSecondary' },
      { label: 'Muted', value: Colors.textMuted, token: 'textMuted' },
      { label: 'Brand', value: Colors.brandPrimary, token: 'brandPrimary' },
    ],
  },
  {
    group: 'Статусы',
    items: [
      { label: 'Success', value: Colors.statusSuccess, token: 'statusSuccess' },
      { label: 'Warning', value: Colors.statusWarning, token: 'statusWarning' },
      { label: 'Error', value: Colors.statusError, token: 'statusError' },
      { label: 'Info', value: Colors.brandPrimary, token: 'brandPrimary' },
      { label: 'Neutral', value: Colors.statusNeutral, token: 'statusNeutral' },
    ],
  },
  {
    group: 'Границы',
    items: [
      { label: 'Border', value: Colors.border, token: 'border' },
      { label: 'Light', value: Colors.borderLight, token: 'borderLight' },
    ],
  },
];

function ColorPaletteSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View className="gap-4">
      <Text className="text-xl font-bold text-textPrimary">Палитра цветов</Text>
      <Text className="-mt-2 text-sm text-textMuted">Дизайн-токены из Colors.ts</Text>
      {COLOR_GROUPS.map((group) => (
        <View key={group.group} className="mt-1 gap-2">
          <Text className="text-sm font-semibold text-textSecondary">{group.group}</Text>
          <View className={`flex-row flex-wrap gap-2 ${isDesktop ? 'gap-3' : ''}`}>
            {group.items.map((c) => {
              const light = isLight(c.value);
              return (
                <View key={c.token} className="items-center gap-[3px]">
                  <View
                    className="h-11 w-[72px] items-center justify-center rounded-md"
                    style={[
                      { backgroundColor: c.value },
                      light && { borderWidth: 1, borderColor: Colors.border },
                    ]}
                  >
                    <Text
                      className="font-medium tracking-wide"
                      style={{ fontSize: 9, color: light ? Colors.textPrimary : Colors.white }}
                    >
                      {c.value}
                    </Text>
                  </View>
                  <Text className="text-xs font-medium text-textPrimary">{c.label}</Text>
                  <Text className="text-textMuted" style={{ fontSize: 9 }}>{c.token}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// -- Typography Scale --
const TYPO_SAMPLES = [
  { label: 'Jumbo', size: Typography.fontSize.jumbo, weight: Typography.fontWeight.bold, sample: '48', color: Colors.textPrimary },
  { label: 'Display', size: Typography.fontSize.display, weight: Typography.fontWeight.bold, sample: 'Заголовок Display', color: Colors.textPrimary },
  { label: '3XL', size: Typography.fontSize['3xl'], weight: Typography.fontWeight.bold, sample: 'Заголовок секции', color: Colors.textPrimary },
  { label: '2XL', size: Typography.fontSize['2xl'], weight: Typography.fontWeight.bold, sample: 'Заголовок страницы', color: Colors.textPrimary },
  { label: 'Title', size: Typography.fontSize.title, weight: Typography.fontWeight.bold, sample: 'Заголовок карточки', color: Colors.textPrimary },
  { label: 'XL', size: Typography.fontSize.xl, weight: Typography.fontWeight.semibold, sample: 'Подзаголовок', color: Colors.textPrimary },
  { label: 'LG', size: Typography.fontSize.lg, weight: Typography.fontWeight.semibold, sample: 'Метка или подзаголовок', color: Colors.textPrimary },
  { label: 'MD', size: Typography.fontSize.md, weight: Typography.fontWeight.medium, sample: 'Средний основной текст', color: Colors.textPrimary },
  { label: 'Base', size: Typography.fontSize.base, weight: Typography.fontWeight.regular, sample: 'Обычный основной текст для абзацев и описаний.', color: Colors.textSecondary },
  { label: 'SM', size: Typography.fontSize.sm, weight: Typography.fontWeight.regular, sample: 'Мелкий вспомогательный текст, подписи, мета.', color: Colors.textSecondary },
  { label: 'XS', size: Typography.fontSize.xs, weight: Typography.fontWeight.medium, sample: 'НАДПИСЬ / МЕТКА', color: Colors.textMuted },
];

function TypographySection() {
  return (
    <View className="gap-4">
      <Text className="text-xl font-bold text-textPrimary">Типографика</Text>
      <Text className="-mt-2 text-sm text-textMuted">Семейство Nunito — размеры, начертания, иерархия</Text>
      <View className="gap-3">
        {TYPO_SAMPLES.map((t) => (
          <View key={t.label} className="gap-[3px] border-b pb-3" style={{ borderBottomColor: Colors.borderLight }}>
            <View className="flex-row items-center gap-2">
              <Text className="min-w-[48px] text-xs font-bold uppercase tracking-wide text-brandPrimary">
                {t.label}
              </Text>
              <Text className="text-xs text-textMuted">{t.size}px</Text>
            </View>
            <Text
              style={{
                fontSize: t.size,
                fontWeight: t.weight as any,
                color: t.color,
                lineHeight: t.size * 1.35,
              }}
            >
              {t.sample}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// -- Buttons --
function ButtonsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View className="gap-4">
      <Text className="text-xl font-bold text-textPrimary">Кнопки</Text>
      <Text className="-mt-2 text-sm text-textMuted">Варианты, размеры и состояния</Text>

      <Text className="mt-3 text-xs font-semibold uppercase tracking-wider text-textMuted">Основная</Text>
      <View className={`flex-row flex-wrap items-center gap-2 ${isDesktop ? 'gap-3' : ''}`}>
        <Pressable className="items-center justify-center rounded-lg bg-brandPrimary px-5 py-3" onPress={() => {}}>
          <Text className="text-sm font-semibold text-white">Обычная</Text>
        </Pressable>
        <Pressable className="items-center justify-center rounded-lg px-5 py-3" style={{ backgroundColor: Colors.brandPrimaryHover }} onPress={() => {}}>
          <Text className="text-sm font-semibold text-white">Наведение</Text>
        </Pressable>
        <Pressable className="items-center justify-center rounded-lg bg-brandSecondary px-5 py-3" onPress={() => {}}>
          <Text className="text-sm font-semibold text-white">Нажатие</Text>
        </Pressable>
        <Pressable className="items-center justify-center rounded-lg bg-brandPrimary px-5 py-3 opacity-40" disabled onPress={() => {}}>
          <Text className="text-sm font-semibold text-white">Неактивная</Text>
        </Pressable>
      </View>

      <Text className="mt-3 text-xs font-semibold uppercase tracking-wider text-textMuted">Вторичная / Контурная / Призрак</Text>
      <View className={`flex-row flex-wrap items-center gap-2 ${isDesktop ? 'gap-3' : ''}`}>
        <Pressable className="items-center justify-center rounded-lg bg-bgSecondary px-5 py-3" onPress={() => {}}>
          <Text className="text-sm font-semibold text-brandPrimary">Вторичная</Text>
        </Pressable>
        <Pressable className="items-center justify-center rounded-lg border border-brandPrimary px-5 py-[11px]" onPress={() => {}}>
          <Text className="text-sm font-semibold text-brandPrimary">Контурная</Text>
        </Pressable>
        <Pressable className="items-center justify-center rounded-lg px-5 py-3" onPress={() => {}}>
          <Text className="text-sm font-semibold text-brandPrimary">Призрак</Text>
        </Pressable>
      </View>

      <Text className="mt-3 text-xs font-semibold uppercase tracking-wider text-textMuted">Семантические</Text>
      <View className={`flex-row flex-wrap items-center gap-2 ${isDesktop ? 'gap-3' : ''}`}>
        <Pressable className="flex-row items-center gap-1 rounded-lg bg-statusError px-5 py-3" onPress={() => {}}>
          <Feather name="trash-2" size={14} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Удалить</Text>
        </Pressable>
        <Pressable className="flex-row items-center gap-1 rounded-lg bg-statusSuccess px-5 py-3" onPress={() => {}}>
          <Feather name="check" size={14} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Подтвердить</Text>
        </Pressable>
        <Pressable className="flex-row items-center gap-1 rounded-lg bg-statusWarning px-5 py-3" onPress={() => {}}>
          <Feather name="alert-triangle" size={14} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Предупреждение</Text>
        </Pressable>
      </View>

      <Text className="mt-3 text-xs font-semibold uppercase tracking-wider text-textMuted">С иконками + размеры</Text>
      <View className={`flex-row flex-wrap items-center gap-2 ${isDesktop ? 'gap-3' : ''}`}>
        <Pressable className="flex-row items-center gap-2 rounded-lg bg-brandPrimary px-6 py-4" onPress={() => {}}>
          <Feather name="plus" size={18} color={Colors.white} />
          <Text className="text-base font-semibold text-white">Большая кнопка</Text>
        </Pressable>
        <Pressable className="flex-row items-center gap-2 rounded-lg bg-brandPrimary px-5 py-3" onPress={() => {}}>
          <Feather name="send" size={14} color={Colors.white} />
          <Text className="text-sm font-semibold text-white">Отправить</Text>
        </Pressable>
        <Pressable className="flex-row items-center gap-2 rounded-lg border border-brandPrimary px-5 py-[11px]" onPress={() => {}}>
          <Feather name="filter" size={14} color={Colors.brandPrimary} />
          <Text className="text-sm font-semibold text-brandPrimary">Фильтр</Text>
        </Pressable>
        <Pressable className="rounded bg-brandPrimary px-3 py-[5px]" onPress={() => {}}>
          <Text className="text-xs font-semibold text-white">Маленькая</Text>
        </Pressable>
      </View>
    </View>
  );
}

// -- Inputs --
function InputsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View className="gap-4">
      <Text className="text-xl font-bold text-textPrimary">Поля ввода</Text>
      <Text className="-mt-2 text-sm text-textMuted">Текстовые поля во всех состояниях</Text>

      <View className={`gap-4 ${isDesktop ? 'flex-row flex-wrap' : ''}`}>
        <View className={`gap-1 ${isDesktop ? 'min-w-[200px] flex-1' : 'w-full'}`}>
          <Text className="text-xs font-semibold uppercase tracking-wide text-textMuted">Пустое</Text>
          <TextInput
            className="h-11 justify-center rounded-lg bg-bgCard px-3 text-base text-textPrimary"
            style={{ borderWidth: 1, borderColor: Colors.border, outlineStyle: 'none' as any }}
            placeholder="Введите текст..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View className={`gap-1 ${isDesktop ? 'min-w-[200px] flex-1' : 'w-full'}`}>
          <Text className="text-xs font-semibold uppercase tracking-wide text-textMuted">В фокусе</Text>
          <TextInput
            className="h-11 justify-center rounded-lg bg-bgCard px-3 text-base text-textPrimary"
            style={{ borderWidth: 2, borderColor: Colors.brandPrimary, outlineStyle: 'none' as any }}
            defaultValue="Ввод текста"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View className={`gap-1 ${isDesktop ? 'min-w-[200px] flex-1' : 'w-full'}`}>
          <Text className="text-xs font-semibold uppercase tracking-wide text-textMuted">Заполненное</Text>
          <TextInput
            className="h-11 justify-center rounded-lg bg-bgCard px-3 text-base text-textPrimary"
            style={{ borderWidth: 1, borderColor: Colors.border, outlineStyle: 'none' as any }}
            defaultValue="ivan@mail.ru"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View className={`gap-1 ${isDesktop ? 'min-w-[200px] flex-1' : 'w-full'}`}>
          <Text className="text-xs font-semibold uppercase tracking-wide text-textMuted">Ошибка</Text>
          <TextInput
            className="h-11 justify-center rounded-lg bg-bgCard px-3 text-base text-textPrimary"
            style={{ borderWidth: 2, borderColor: Colors.statusError, outlineStyle: 'none' as any }}
            defaultValue="некорректное значение"
            placeholderTextColor={Colors.textMuted}
          />
          <View className="flex-row items-center gap-1">
            <Feather name="alert-circle" size={12} color={Colors.statusError} />
            <Text className="text-xs text-statusError">Неверный формат</Text>
          </View>
        </View>

        <View className={`gap-1 ${isDesktop ? 'min-w-[200px] flex-1' : 'w-full'}`}>
          <Text className="text-xs font-semibold uppercase tracking-wide text-textMuted">Неактивное</Text>
          <TextInput
            className="h-11 justify-center rounded-lg bg-bgSecondary px-3 text-base opacity-60"
            style={{ borderWidth: 1, borderColor: Colors.border, color: Colors.textMuted, outlineStyle: 'none' as any }}
            defaultValue="Неактивное поле"
            editable={false}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View className={`gap-1 ${isDesktop ? 'min-w-[200px] flex-1' : 'w-full'}`}>
          <Text className="text-xs font-semibold uppercase tracking-wide text-textMuted">С иконкой</Text>
          <View
            className="h-11 flex-row items-center gap-2 rounded-lg bg-bgCard px-3"
            style={{ borderWidth: 1, borderColor: Colors.border }}
          >
            <Feather name="search" size={16} color={Colors.textMuted} />
            <TextInput
              className="flex-1 text-base text-textPrimary"
              style={{ outlineStyle: 'none' as any, padding: 0 }}
              placeholder="Поиск..."
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// -- Badges & Tags --
function BadgesSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View className="gap-4">
      <Text className="text-xl font-bold text-textPrimary">Бейджи и теги</Text>
      <Text className="-mt-2 text-sm text-textMuted">Индикаторы статуса и категории</Text>

      <Text className="mt-3 text-xs font-semibold uppercase tracking-wider text-textMuted">Статусные бейджи</Text>
      <View className={`flex-row flex-wrap items-center gap-2 ${isDesktop ? 'gap-3' : ''}`}>
        <View className="flex-row items-center gap-1 rounded-full px-2 py-1" style={{ backgroundColor: Colors.statusBg.success }}>
          <Feather name="check-circle" size={12} color={Colors.statusSuccess} />
          <Text className="text-xs font-semibold text-statusSuccess">Подтверждён</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full px-2 py-1" style={{ backgroundColor: Colors.statusBg.info }}>
          <View className="h-1.5 w-1.5 rounded-full bg-statusSuccess" />
          <Text className="text-xs font-semibold text-brandPrimary">Онлайн</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full px-2 py-1" style={{ backgroundColor: Colors.statusBg.warning }}>
          <Feather name="clock" size={12} color={Colors.statusWarning} />
          <Text className="text-xs font-semibold text-statusWarning">Ожидание</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full px-2 py-1" style={{ backgroundColor: Colors.statusBg.error }}>
          <Text className="text-xs font-semibold text-statusError">Отклонён</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full px-2 py-1" style={{ backgroundColor: Colors.statusBg.neutral }}>
          <Text className="text-xs font-semibold" style={{ color: Colors.statusNeutral }}>Черновик</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full px-2 py-1" style={{ backgroundColor: Colors.statusBg.info }}>
          <Feather name="zap" size={12} color={Colors.brandPrimary} />
          <Text className="text-xs font-semibold text-brandPrimary">Новый</Text>
        </View>
      </View>

      <Text className="mt-3 text-xs font-semibold uppercase tracking-wider text-textMuted">Теги услуг</Text>
      <View className={`flex-row flex-wrap items-center gap-2 ${isDesktop ? 'gap-3' : ''}`}>
        <Pressable className="flex-row items-center gap-1 rounded-full border bg-bgCard px-2 py-1" style={{ borderColor: Colors.border }} onPress={() => {}}>
          <Text className="text-xs font-medium text-textSecondary">Выездная проверка</Text>
        </Pressable>
        <Pressable className="flex-row items-center gap-1 rounded-full border bg-bgCard px-2 py-1" style={{ borderColor: Colors.border }} onPress={() => {}}>
          <Text className="text-xs font-medium text-textSecondary">Отдел оперативного контроля</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center gap-1 rounded-full border border-brandPrimary px-2 py-1"
          style={{ backgroundColor: Colors.statusBg.info }}
          onPress={() => {}}
        >
          <Feather name="check" size={11} color={Colors.brandPrimary} />
          <Text className="text-xs font-medium text-brandPrimary">Камеральная проверка</Text>
        </Pressable>
        <Pressable className="flex-row items-center gap-1 rounded-full border bg-bgCard px-2 py-1" style={{ borderColor: Colors.border }} onPress={() => {}}>
          <Text className="text-xs font-medium text-textSecondary">Не знаю</Text>
        </Pressable>
      </View>
    </View>
  );
}

// -- Spacing Tokens --
const SPACING_ITEMS: { label: string; value: number }[] = [
  { label: 'xxs', value: Spacing.xxs },
  { label: 'xs', value: Spacing.xs },
  { label: 'sm', value: Spacing.sm },
  { label: 'md', value: Spacing.md },
  { label: 'lg', value: Spacing.lg },
  { label: 'xl', value: Spacing.xl },
  { label: '2xl', value: Spacing['2xl'] },
  { label: '3xl', value: Spacing['3xl'] },
  { label: '4xl', value: Spacing['4xl'] },
];

function SpacingSection() {
  return (
    <View className="gap-4">
      <Text className="text-xl font-bold text-textPrimary">Токены отступов</Text>
      <Text className="-mt-2 text-sm text-textMuted">Единая шкала отступов</Text>
      <View
        className="gap-2 rounded-lg border bg-bgPrimary p-4"
        style={{ borderColor: Colors.borderLight }}
      >
        {SPACING_ITEMS.map((sp) => (
          <View key={sp.label} className="flex-row items-center gap-2">
            <Text className="w-8 text-xs font-semibold text-textSecondary">{sp.label}</Text>
            <Text className="w-9 text-right text-xs text-textMuted">{sp.value}px</Text>
            <View className="flex-1 h-2.5 overflow-hidden rounded-sm bg-bgSecondary">
              <View
                className="h-full rounded-sm bg-brandPrimary"
                style={{ width: Math.min(sp.value * 4, 200), minWidth: 4 }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// -- Border Radius --
function RadiusSection({ isDesktop }: { isDesktop: boolean }) {
  const radii = [
    { label: 'sm', value: BorderRadius.sm },
    { label: 'md', value: BorderRadius.md },
    { label: 'lg', value: BorderRadius.lg },
    { label: 'xl', value: BorderRadius.xl },
    { label: 'xxl', value: BorderRadius.xxl },
    { label: 'btn', value: BorderRadius.btn },
    { label: 'card', value: BorderRadius.card },
    { label: 'input', value: BorderRadius.input },
    { label: 'full', value: 32 },
  ];

  return (
    <View className="gap-4">
      <Text className="text-xl font-bold text-textPrimary">Скругления</Text>
      <Text className="-mt-2 text-sm text-textMuted">Токены скруглений</Text>
      <View className={`flex-row flex-wrap items-center ${isDesktop ? 'gap-4' : 'gap-2'}`} style={{ gap: Spacing.lg }}>
        {radii.map((r) => (
          <View key={r.label} className="items-center gap-1">
            <View
              className="h-12 w-12 border bg-bgSecondary"
              style={{ borderRadius: r.value, borderColor: Colors.border }}
            />
            <Text className="text-xs font-semibold text-textPrimary">{r.label}</Text>
            <Text className="text-textMuted" style={{ fontSize: 9 }}>{r.value}px</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// -- Shadows --
function ShadowsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View className="gap-4">
      <Text className="text-xl font-bold text-textPrimary">Тени</Text>
      <Text className="-mt-2 text-sm text-textMuted">Уровни подъёма</Text>
      <View className={`flex-row flex-wrap items-center ${isDesktop ? 'gap-5' : 'gap-2'}`} style={{ gap: Spacing.xl }}>
        <View className="items-center gap-2">
          <View className="h-14 w-20 rounded-lg bg-bgCard" style={Shadows.sm} />
          <Text className="text-xs font-semibold text-textSecondary">sm</Text>
        </View>
        <View className="items-center gap-2">
          <View className="h-14 w-20 rounded-lg bg-bgCard" style={Shadows.md} />
          <Text className="text-xs font-semibold text-textSecondary">md</Text>
        </View>
        <View className="items-center gap-2">
          <View className="h-14 w-20 rounded-lg bg-bgCard" style={Shadows.lg} />
          <Text className="text-xs font-semibold text-textSecondary">lg</Text>
        </View>
      </View>
    </View>
  );
}

// -- Toggle --
function ToggleSection() {
  const [a, setA] = React.useState(true);
  const [b, setB] = React.useState(false);
  const [c, setC] = React.useState(true);

  return (
    <View className="gap-4">
      <Text className="text-xl font-bold text-textPrimary">Тумблеры</Text>
      <Text className="-mt-2 text-sm text-textMuted">Кастомный Toggle — единый компонент для всех страниц</Text>
      <View className="gap-4 rounded-xl border border-borderLight p-4">
        <ToggleComponent label="Email-уведомления" value={a} onValueChange={setA} />
        <ToggleComponent label="Push-уведомления" sublabel="Уведомления на телефон" value={b} onValueChange={setB} />
        <ToggleComponent label="Публичный профиль" value={c} onValueChange={setC} />
        <ToggleComponent label="Неактивный" value={false} onValueChange={() => {}} disabled />
      </View>
    </View>
  );
}

// =====================================================================
// NAV COMPONENT SECTIONS
// =====================================================================

// -- Shared small components --
function LogoBlock() {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-7 w-7 items-center justify-center rounded-md bg-brandPrimary">
        <Feather name="shield" size={16} color={Colors.white} />
      </View>
      <Text className="text-lg font-bold text-textPrimary">Nalogovik</Text>
    </View>
  );
}

function NotifBell({ hasNotif = false }: { hasNotif?: boolean }) {
  return (
    <Pressable onPress={() => {}}>
      <Feather name="bell" size={20} color={Colors.textSecondary} />
      {hasNotif && (
        <View className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-statusError" />
      )}
    </Pressable>
  );
}

function AvatarCircle({ initials }: { initials: string }) {
  return (
    <View
      className="h-8 w-8 items-center justify-center rounded-full border bg-bgSecondary"
      style={{ borderColor: Colors.border }}
    >
      <Text className="text-xs font-bold text-brandPrimary">{initials}</Text>
    </View>
  );
}

// -- Public Header (responsive: desktop + mobile in one component) --
const PUBLIC_NAV_LINKS = ['Главная', 'Специалисты', 'Заявки', 'Тарифы'];

function PublicHeader() {
  const { isDesktop } = useLayout();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <View className="gap-3">
      <Text className="text-xl font-bold text-textPrimary">Шапка (гость)</Text>
      <Text className="-mt-1 text-sm text-textMuted">Навигация для неавторизованного пользователя</Text>

      {isDesktop ? (
        <View
          className="h-14 flex-row items-center rounded-lg border bg-bgCard px-4"
          style={{ borderColor: Colors.borderLight, ...Shadows.sm }}
        >
          <LogoBlock />
          <View className="ml-8 flex-1 flex-row gap-5">
            {PUBLIC_NAV_LINKS.map((link, i) => (
              <Pressable key={link} onPress={() => {}}>
                <Text className={`text-sm font-medium ${i === 0 ? 'font-semibold text-brandPrimary' : 'text-textSecondary'}`}>
                  {link}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="rounded-lg border border-brandPrimary px-4 py-2">
              <Text className="text-sm font-semibold text-brandPrimary">Войти</Text>
            </Pressable>
            <Pressable className="rounded-lg bg-brandPrimary px-4 py-2">
              <Text className="text-sm font-semibold text-white">Разместить заявку</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View
            className="h-14 flex-row items-center justify-between rounded-lg border bg-bgCard px-4"
            style={{ borderColor: Colors.borderLight, ...Shadows.sm }}
          >
            <LogoBlock />
            <Pressable onPress={() => setMenuOpen(!menuOpen)}>
              <Feather name={menuOpen ? 'x' : 'menu'} size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>
          {menuOpen && (
            <View className="w-[280px] gap-4 bg-bgCard p-5">
              <View className="gap-4">
                {PUBLIC_NAV_LINKS.map((link, i) => (
                  <Pressable key={link} onPress={() => {}}>
                    <Text className={`text-base font-medium ${i === 0 ? 'font-semibold text-brandPrimary' : 'text-textSecondary'}`}>
                      {link}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View className="h-px" style={{ backgroundColor: Colors.borderLight }} />
              <View className="gap-2">
                <Pressable className="items-center rounded-lg border border-brandPrimary py-3">
                  <Text className="text-sm font-semibold text-brandPrimary">Войти</Text>
                </Pressable>
                <Pressable className="items-center rounded-lg bg-brandPrimary py-3">
                  <Text className="text-sm font-semibold text-white">Разместить заявку</Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// -- Auth Header (responsive: desktop + mobile in one component) --
const AUTH_TABS: Array<{ id: string; icon: any; label: string; badge?: boolean }> = [
  { id: 'home', icon: 'home', label: 'Главная' },
  { id: 'requests', icon: 'file-text', label: 'Заявки' },
  { id: 'messages', icon: 'message-circle', label: 'Сообщения', badge: true },
  { id: 'profile', icon: 'user', label: 'Профиль' },
];

function BottomTabBar({ tabs, activeId }: {
  tabs: Array<{ id: string; icon: string; label: string; badge?: boolean }>;
  activeId: string;
}) {
  const { width } = useWindowDimensions();
  if (width >= 640) return null;

  return (
    <View
      className="h-[60px] flex-row items-center rounded-lg border bg-bgCard"
      style={{ borderColor: Colors.borderLight, ...Shadows.sm }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Pressable key={tab.id} className="flex-1 items-center justify-center gap-[2px]" onPress={() => {}}>
            <View>
              <Feather
                name={tab.icon as any}
                size={20}
                color={active ? Colors.brandPrimary : Colors.textMuted}
              />
              {tab.badge && (
                <View className="absolute -right-1.5 -top-[3px] h-2 w-2 rounded-full bg-statusError" />
              )}
            </View>
            <Text
              className={`font-medium ${active ? 'font-bold text-brandPrimary' : 'text-textMuted'}`}
              style={{ fontSize: 10 }}
            >
              {tab.label}
            </Text>
            {active && (
              <View className="absolute bottom-0 h-0.5 w-5 rounded-sm bg-brandPrimary" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function AuthHeader() {
  const { isDesktop } = useLayout();

  return (
    <View className="gap-3">
      <Text className="text-xl font-bold text-textPrimary">Шапка (авторизован)</Text>
      <Text className="-mt-1 text-sm text-textMuted">Навигация для авторизованного пользователя</Text>

      {isDesktop ? (
        <View
          className="h-14 flex-row items-center rounded-lg border bg-bgCard px-4"
          style={{ borderColor: Colors.borderLight, ...Shadows.sm }}
        >
          <LogoBlock />
          <View className="ml-8 flex-1 flex-row gap-5">
            <Pressable onPress={() => {}}><Text className="text-sm font-semibold text-brandPrimary">Главная</Text></Pressable>
            <Pressable onPress={() => {}}><Text className="text-sm font-medium text-textSecondary">Заявки</Text></Pressable>
            <Pressable onPress={() => {}}><Text className="text-sm font-medium text-textSecondary">Сообщения</Text></Pressable>
            <Pressable onPress={() => {}}><Text className="text-sm font-medium text-textSecondary">Профиль</Text></Pressable>
          </View>
          <View className="flex-row items-center gap-3">
            <NotifBell hasNotif />
            <AvatarCircle initials="ИВ" />
          </View>
        </View>
      ) : (
        <>
          <View
            className="h-14 flex-row items-center justify-between rounded-lg border bg-bgCard px-4"
            style={{ borderColor: Colors.borderLight, ...Shadows.sm }}
          >
            <LogoBlock />
            <View className="flex-row items-center gap-3">
              <NotifBell hasNotif />
              <AvatarCircle initials="ИВ" />
            </View>
          </View>
          <BottomTabBar tabs={AUTH_TABS} activeId="home" />
        </>
      )}
    </View>
  );
}

// =====================================================================
// MAIN EXPORT
// =====================================================================
export function BrandStates() {
  const { isDesktop } = useLayout();

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={[
        { padding: Spacing.xl, gap: Spacing['3xl'], paddingBottom: 100 },
        isDesktop && { maxWidth: 960, alignSelf: 'center' as const, paddingHorizontal: 48 },
      ]}
    >
      {/* Brand & Style sections */}
      <HeroSection isDesktop={isDesktop} />
      <ColorPaletteSection isDesktop={isDesktop} />
      <TypographySection />
      <ButtonsSection isDesktop={isDesktop} />
      <InputsSection isDesktop={isDesktop} />
      <BadgesSection isDesktop={isDesktop} />
      <SpacingSection />
      <RadiusSection isDesktop={isDesktop} />
      <ShadowsSection isDesktop={isDesktop} />
      <ToggleSection />

      <View className="my-5 h-px" style={{ backgroundColor: Colors.border }} />

      <PublicHeader />
      <AuthHeader />
    </ScrollView>
  );
}
