import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/Colors';

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
    <View style={[bs.heroWrap, isDesktop && bs.heroWrapDesktop]}>
      <View style={bs.heroLogoRow}>
        <View style={bs.heroLogoIcon}>
          <Feather name="shield" size={isDesktop ? 28 : 22} color={Colors.white} />
        </View>
        <Text style={[bs.heroLogoText, isDesktop && bs.heroLogoTextDesktop]}>
          Nalogovik
        </Text>
      </View>
      <Text style={[bs.heroTagline, isDesktop && bs.heroTaglineDesktop]}>
        Система дизайна
      </Text>
      <Text style={bs.heroSub}>
        Визуальный язык маркетплейса налоговых специалистов
      </Text>
      <View style={bs.heroDivider} />
      <View style={bs.heroBrandStrip}>
        <View style={[bs.heroBrandBlock, { backgroundColor: Colors.brandPrimary }]} />
        <View style={[bs.heroBrandBlock, { backgroundColor: Colors.brandPrimaryHover }]} />
        <View style={[bs.heroBrandBlock, { backgroundColor: Colors.brandSecondary }]} />
        <View style={[bs.heroBrandBlock, { backgroundColor: Colors.textPrimary }]} />
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
      { label: 'Accent', value: Colors.textAccent, token: 'textAccent' },
    ],
  },
  {
    group: 'Статусы',
    items: [
      { label: 'Success', value: Colors.statusSuccess, token: 'statusSuccess' },
      { label: 'Warning', value: Colors.statusWarning, token: 'statusWarning' },
      { label: 'Error', value: Colors.statusError, token: 'statusError' },
      { label: 'Info', value: Colors.statusInfo, token: 'statusInfo' },
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
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Палитра цветов</Text>
      <Text style={bs.sectionDesc}>Дизайн-токены из Colors.ts</Text>
      {COLOR_GROUPS.map((group) => (
        <View key={group.group} style={bs.colorGroup}>
          <Text style={bs.colorGroupLabel}>{group.group}</Text>
          <View style={[bs.colorGrid, isDesktop && bs.colorGridDesktop]}>
            {group.items.map((c) => {
              const light = isLight(c.value);
              return (
                <View key={c.token} style={bs.colorCard}>
                  <View style={[bs.colorSwatch, { backgroundColor: c.value }, light && bs.swatchBorder]}>
                    <Text style={[bs.colorHex, { color: light ? Colors.textPrimary : Colors.white }]}>
                      {c.value}
                    </Text>
                  </View>
                  <Text style={bs.colorName}>{c.label}</Text>
                  <Text style={bs.colorToken}>{c.token}</Text>
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
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Типографика</Text>
      <Text style={bs.sectionDesc}>Семейство Nunito — размеры, начертания, иерархия</Text>
      <View style={bs.typoList}>
        {TYPO_SAMPLES.map((t) => (
          <View key={t.label} style={bs.typoRow}>
            <View style={bs.typoMeta}>
              <Text style={bs.typoLabel}>{t.label}</Text>
              <Text style={bs.typoSize}>{t.size}px</Text>
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
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Кнопки</Text>
      <Text style={bs.sectionDesc}>Варианты, размеры и состояния</Text>

      <Text style={bs.subLabel}>Основная</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <Pressable style={bs.btnPrimary} onPress={() => {}}>
          <Text style={bs.btnPrimaryText}>Обычная</Text>
        </Pressable>
        <Pressable style={[bs.btnPrimary, { backgroundColor: Colors.brandPrimaryHover }]} onPress={() => {}}>
          <Text style={bs.btnPrimaryText}>Наведение</Text>
        </Pressable>
        <Pressable style={[bs.btnPrimary, { backgroundColor: Colors.brandSecondary }]} onPress={() => {}}>
          <Text style={bs.btnPrimaryText}>Нажатие</Text>
        </Pressable>
        <Pressable style={[bs.btnPrimary, bs.btnDisabled]} disabled onPress={() => {}}>
          <Text style={bs.btnPrimaryText}>Неактивная</Text>
        </Pressable>
      </View>

      <Text style={bs.subLabel}>Вторичная / Контурная / Призрак</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <Pressable style={bs.btnSecondary} onPress={() => {}}>
          <Text style={bs.btnSecondaryText}>Вторичная</Text>
        </Pressable>
        <Pressable style={bs.btnOutline} onPress={() => {}}>
          <Text style={bs.btnOutlineText}>Контурная</Text>
        </Pressable>
        <Pressable style={bs.btnGhost} onPress={() => {}}>
          <Text style={bs.btnGhostText}>Призрак</Text>
        </Pressable>
      </View>

      <Text style={bs.subLabel}>Семантические</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <Pressable style={bs.btnDestructive} onPress={() => {}}>
          <Feather name="trash-2" size={14} color={Colors.white} />
          <Text style={bs.btnPrimaryText}>Удалить</Text>
        </Pressable>
        <Pressable style={bs.btnSuccess} onPress={() => {}}>
          <Feather name="check" size={14} color={Colors.white} />
          <Text style={bs.btnPrimaryText}>Подтвердить</Text>
        </Pressable>
        <Pressable style={bs.btnWarning} onPress={() => {}}>
          <Feather name="alert-triangle" size={14} color={Colors.white} />
          <Text style={bs.btnPrimaryText}>Предупреждение</Text>
        </Pressable>
      </View>

      <Text style={bs.subLabel}>С иконками + размеры</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <Pressable style={bs.btnLarge} onPress={() => {}}>
          <Feather name="plus" size={18} color={Colors.white} />
          <Text style={bs.btnLargeText}>Большая кнопка</Text>
        </Pressable>
        <Pressable style={bs.btnIconPrimary} onPress={() => {}}>
          <Feather name="send" size={14} color={Colors.white} />
          <Text style={bs.btnPrimaryText}>Отправить</Text>
        </Pressable>
        <Pressable style={bs.btnIconOutline} onPress={() => {}}>
          <Feather name="filter" size={14} color={Colors.brandPrimary} />
          <Text style={bs.btnOutlineText}>Фильтр</Text>
        </Pressable>
        <Pressable style={bs.btnSmall} onPress={() => {}}>
          <Text style={bs.btnSmallText}>Маленькая</Text>
        </Pressable>
      </View>
    </View>
  );
}

// -- Inputs --
function InputsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Поля ввода</Text>
      <Text style={bs.sectionDesc}>Текстовые поля во всех состояниях</Text>

      <View style={[bs.inputGrid, isDesktop && bs.inputGridDesktop]}>
        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>Пустое</Text>
          <TextInput
            style={[bs.inputWrap, bs.textInput]}
            placeholder="Введите текст..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>В фокусе</Text>
          <TextInput
            style={[bs.inputWrap, bs.inputFocused, bs.textInput]}
            defaultValue="Ввод текста"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>Заполненное</Text>
          <TextInput
            style={[bs.inputWrap, bs.textInput]}
            defaultValue="ivan@mail.ru"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>Ошибка</Text>
          <TextInput
            style={[bs.inputWrap, bs.inputError, bs.textInput]}
            defaultValue="некорректное значение"
            placeholderTextColor={Colors.textMuted}
          />
          <View style={bs.errorRow}>
            <Feather name="alert-circle" size={12} color={Colors.statusError} />
            <Text style={bs.inputErrorText}>Неверный формат</Text>
          </View>
        </View>

        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>Неактивное</Text>
          <TextInput
            style={[bs.inputWrap, bs.inputDisabledWrap, bs.textInput, { color: Colors.textMuted }]}
            defaultValue="Неактивное поле"
            editable={false}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={bs.inputGroup}>
          <Text style={bs.inputStateLabel}>С иконкой</Text>
          <View style={[bs.inputWrap, bs.inputWithIconWrap]}>
            <Feather name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={[bs.textInput, { flex: 1 }]}
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
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Бейджи и теги</Text>
      <Text style={bs.sectionDesc}>Индикаторы статуса и категории</Text>

      <Text style={bs.subLabel}>Статусные бейджи</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.success }]}>
          <Feather name="check-circle" size={12} color={Colors.statusSuccess} />
          <Text style={[bs.badgeText, { color: Colors.statusSuccess }]}>Подтверждён</Text>
        </View>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.info }]}>
          <View style={bs.onlineDot} />
          <Text style={[bs.badgeText, { color: Colors.brandPrimary }]}>Онлайн</Text>
        </View>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.warning }]}>
          <Feather name="clock" size={12} color={Colors.statusWarning} />
          <Text style={[bs.badgeText, { color: Colors.statusWarning }]}>Ожидание</Text>
        </View>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.error }]}>
          <Text style={[bs.badgeText, { color: Colors.statusError }]}>Отклонён</Text>
        </View>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.neutral }]}>
          <Text style={[bs.badgeText, { color: Colors.statusNeutral }]}>Черновик</Text>
        </View>
        <View style={[bs.badge, { backgroundColor: Colors.statusBg.accent }]}>
          <Feather name="zap" size={12} color={Colors.brandPrimary} />
          <Text style={[bs.badgeText, { color: Colors.brandPrimary }]}>Новый</Text>
        </View>
      </View>

      <Text style={bs.subLabel}>Теги услуг</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop]}>
        <Pressable style={bs.tag} onPress={() => {}}>
          <Text style={bs.tagText}>3-НДФЛ</Text>
        </Pressable>
        <Pressable style={bs.tag} onPress={() => {}}>
          <Text style={bs.tagText}>Регистрация ИП</Text>
        </Pressable>
        <Pressable style={[bs.tag, bs.tagActive]} onPress={() => {}}>
          <Feather name="check" size={11} color={Colors.brandPrimary} />
          <Text style={[bs.tagText, { color: Colors.brandPrimary }]}>Налоговая проверка</Text>
        </Pressable>
        <Pressable style={bs.tag} onPress={() => {}}>
          <Text style={bs.tagText}>Консультация</Text>
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
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Токены отступов</Text>
      <Text style={bs.sectionDesc}>Единая шкала отступов</Text>
      <View style={bs.spacingList}>
        {SPACING_ITEMS.map((sp) => (
          <View key={sp.label} style={bs.spacingRow}>
            <Text style={bs.spacingLabel}>{sp.label}</Text>
            <Text style={bs.spacingValue}>{sp.value}px</Text>
            <View style={bs.spacingBarWrap}>
              <View style={[bs.spacingBar, { width: Math.min(sp.value * 4, 200) }]} />
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
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Скругления</Text>
      <Text style={bs.sectionDesc}>Токены скруглений</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop, { gap: Spacing.lg }]}>
        {radii.map((r) => (
          <View key={r.label} style={bs.radiusItem}>
            <View style={[bs.radiusBox, { borderRadius: r.value }]} />
            <Text style={bs.radiusLabel}>{r.label}</Text>
            <Text style={bs.radiusValue}>{r.value}px</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// -- Shadows --
function ShadowsSection({ isDesktop }: { isDesktop: boolean }) {
  return (
    <View style={bs.section}>
      <Text style={bs.sectionTitle}>Тени</Text>
      <Text style={bs.sectionDesc}>Уровни подъёма</Text>
      <View style={[bs.row, isDesktop && bs.rowDesktop, { gap: Spacing.xl }]}>
        <View style={bs.shadowItem}>
          <View style={[bs.shadowBox, Shadows.sm]} />
          <Text style={bs.shadowLabel}>sm</Text>
        </View>
        <View style={bs.shadowItem}>
          <View style={[bs.shadowBox, Shadows.md]} />
          <Text style={bs.shadowLabel}>md</Text>
        </View>
        <View style={bs.shadowItem}>
          <View style={[bs.shadowBox, Shadows.lg]} />
          <Text style={bs.shadowLabel}>lg</Text>
        </View>
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
    <View style={ns.logoRow}>
      <View style={ns.logoIcon}>
        <Feather name="shield" size={16} color={Colors.white} />
      </View>
      <Text style={ns.logoText}>Nalogovik</Text>
    </View>
  );
}

function NotifBell({ hasNotif = false }: { hasNotif?: boolean }) {
  return (
    <Pressable onPress={() => {}}>
      <Feather name="bell" size={20} color={Colors.textSecondary} />
      {hasNotif && <View style={ns.redDot} />}
    </Pressable>
  );
}

function AvatarCircle({ initials }: { initials: string }) {
  return (
    <View style={ns.avatarCircle}>
      <Text style={ns.avatarText}>{initials}</Text>
    </View>
  );
}

// -- Public Header (responsive: desktop + mobile in one component) --
const PUBLIC_NAV_LINKS = ['Главная', 'Специалисты', 'Заявки', 'Тарифы'];

function PublicHeader() {
  const { isDesktop } = useLayout();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <View style={ns.section}>
      <Text style={ns.sectionTitle}>Шапка (гость)</Text>
      <Text style={ns.sectionDesc}>Навигация для неавторизованного пользователя</Text>

      {isDesktop ? (
        <View style={ns.headerBar}>
          <LogoBlock />
          <View style={ns.navLinks}>
            {PUBLIC_NAV_LINKS.map((link, i) => (
              <Pressable key={link} onPress={() => {}}>
                <Text style={[ns.navLink, i === 0 && ns.navLinkActive]}>{link}</Text>
              </Pressable>
            ))}
          </View>
          <View style={ns.headerRight}>
            <Pressable style={ns.navBtnOutline}>
              <Text style={ns.navBtnOutlineText}>Войти</Text>
            </Pressable>
            <Pressable style={ns.navBtnPrimary}>
              <Text style={ns.navBtnPrimaryText}>Разместить заявку</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View style={ns.mobileHeaderBar}>
            <LogoBlock />
            <Pressable onPress={() => setMenuOpen(!menuOpen)}>
              <Feather name={menuOpen ? 'x' : 'menu'} size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>
          {menuOpen && (
            <View style={ns.drawerPanel}>
              <View style={ns.drawerLinks}>
                {PUBLIC_NAV_LINKS.map((link, i) => (
                  <Pressable key={link} onPress={() => {}}>
                    <Text style={[ns.drawerLink, i === 0 && ns.drawerLinkActive]}>{link}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={ns.drawerDivider} />
              <View style={ns.drawerButtons}>
                <Pressable style={ns.navBtnOutlineFull}>
                  <Text style={ns.navBtnOutlineText}>Войти</Text>
                </Pressable>
                <Pressable style={ns.navBtnPrimaryFull}>
                  <Text style={ns.navBtnPrimaryText}>Разместить заявку</Text>
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
    <View style={ns.tabBar}>
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Pressable key={tab.id} style={ns.tabItem} onPress={() => {}}>
            <View>
              <Feather
                name={tab.icon as any}
                size={20}
                color={active ? Colors.brandPrimary : Colors.textMuted}
              />
              {tab.badge && <View style={ns.tabBadge} />}
            </View>
            <Text style={[ns.tabLabel, active && ns.tabLabelActive]}>{tab.label}</Text>
            {active && <View style={ns.tabIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function AuthHeader() {
  const { isDesktop } = useLayout();

  return (
    <View style={ns.section}>
      <Text style={ns.sectionTitle}>Шапка (авторизован)</Text>
      <Text style={ns.sectionDesc}>Навигация для авторизованного пользователя</Text>

      {isDesktop ? (
        <View style={ns.headerBar}>
          <LogoBlock />
          <View style={ns.navLinks}>
            <Pressable onPress={() => {}}><Text style={[ns.navLink, ns.navLinkActive]}>Главная</Text></Pressable>
            <Pressable onPress={() => {}}><Text style={ns.navLink}>Заявки</Text></Pressable>
            <Pressable onPress={() => {}}><Text style={ns.navLink}>Сообщения</Text></Pressable>
            <Pressable onPress={() => {}}><Text style={ns.navLink}>Профиль</Text></Pressable>
          </View>
          <View style={ns.headerRight}>
            <NotifBell hasNotif />
            <AvatarCircle initials="ИВ" />
          </View>
        </View>
      ) : (
        <>
          <View style={ns.mobileHeaderBar}>
            <LogoBlock />
            <View style={ns.headerRight}>
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
      style={{ flex: 1, backgroundColor: Colors.white }}
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

      <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xl }} />

      <PublicHeader />
      <AuthHeader />
    </ScrollView>
  );
}

// =====================================================================
// BRAND STYLE STYLES (bs)
// =====================================================================
const bs = StyleSheet.create({
  // Sections
  section: { gap: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.sm,
  },
  subLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: Spacing.md,
  },

  // Hero
  heroWrap: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.xl,
    padding: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  heroWrapDesktop: { padding: Spacing['4xl'] },
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroLogoIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoText: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  heroLogoTextDesktop: { fontSize: Typography.fontSize.display },
  heroTagline: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  heroTaglineDesktop: { fontSize: Typography.fontSize.xl },
  heroSub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  heroDivider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  heroBrandStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroBrandBlock: {
    width: 40,
    height: 5,
    borderRadius: BorderRadius.full,
  },

  // Colors
  colorGroup: { gap: Spacing.sm, marginTop: Spacing.xs },
  colorGroupLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorGridDesktop: { gap: Spacing.md },
  colorCard: { alignItems: 'center', gap: 3 },
  colorSwatch: {
    width: 72,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchBorder: { borderWidth: 1, borderColor: Colors.border },
  colorHex: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: 0.3,
  },
  colorName: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  colorToken: { fontSize: 9, color: Colors.textMuted },

  // Typography
  typoList: { gap: Spacing.md },
  typoRow: {
    gap: Spacing.xxs,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  typoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typoLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: 48,
  },
  typoSize: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Buttons
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  rowDesktop: { gap: Spacing.md },
  btnPrimary: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnSecondary: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 1,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnGhost: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnDestructive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.statusError,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
  },
  btnSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.statusSuccess,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
  },
  btnWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.statusWarning,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
  },
  btnDisabled: { opacity: 0.4 },
  btnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.btn,
  },
  btnLargeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  btnIconPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
  },
  btnIconOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 1,
    borderRadius: BorderRadius.btn,
  },
  btnSmall: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  btnSmallText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Inputs
  inputGrid: { gap: Spacing.lg },
  inputGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  inputGroup: { gap: Spacing.xs, minWidth: 200, flex: 1 },
  inputStateLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
  },
  inputFocused: {
    borderColor: Colors.brandPrimary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.statusError,
    borderWidth: 2,
  },
  inputDisabledWrap: {
    backgroundColor: Colors.bgSecondary,
    opacity: 0.6,
  },
  inputWithIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  textInput: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    outlineStyle: 'none' as any,
    padding: 0,
  },
  inputPlaceholder: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  inputValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  inputDisabledText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputErrorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.statusError,
  },

  // Badges
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.statusSuccess,
  },

  // Tags
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  tagActive: {
    borderColor: Colors.brandPrimary,
    backgroundColor: Colors.statusBg.info,
  },

  // Spacing
  spacingList: {
    gap: Spacing.sm,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  spacingLabel: {
    width: 32,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  spacingValue: {
    width: 36,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  spacingBarWrap: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  spacingBar: {
    height: '100%',
    backgroundColor: Colors.brandPrimary,
    borderRadius: BorderRadius.sm,
    minWidth: 4,
  },

  // Border Radius
  radiusItem: { alignItems: 'center', gap: 4 },
  radiusBox: {
    width: 48,
    height: 48,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  radiusValue: {
    fontSize: 9,
    color: Colors.textMuted,
  },

  // Shadows
  shadowItem: { alignItems: 'center', gap: Spacing.sm },
  shadowBox: {
    width: 80,
    height: 56,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
  },
  shadowLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
});

// =====================================================================
// NAV COMPONENT STYLES (ns)
// =====================================================================
const ns = StyleSheet.create({
  // Sections
  section: { gap: Spacing.md },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: -Spacing.xs,
  },
  variantLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginTop: Spacing.xs,
  },
  spacer: { height: Spacing.md },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },

  // Notification dot
  redDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.statusError,
  },

  // Avatar
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },

  // Desktop header bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  navLinks: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginLeft: Spacing['3xl'],
    flex: 1,
  },
  navLink: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  navLinkActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },

  // Nav Buttons (prefixed to avoid clash with brand button styles)
  navBtnOutline: {
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
  },
  navBtnOutlineText: {
    color: Colors.brandPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  navBtnPrimary: {
    backgroundColor: Colors.brandPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.btn,
  },
  navBtnPrimaryText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  navBtnOutlineFull: {
    borderWidth: 1,
    borderColor: Colors.brandPrimary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
  },
  navBtnPrimaryFull: {
    backgroundColor: Colors.brandPrimary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.btn,
    alignItems: 'center',
  },

  // Mobile header bar
  mobileHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },

  // Drawer
  drawerPanel: {
    width: 280,
    backgroundColor: Colors.bgCard,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  drawerLinks: { gap: Spacing.lg },
  drawerLink: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  drawerLinkActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  drawerButtons: { gap: Spacing.sm },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    ...Shadows.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: Colors.brandPrimary,
    fontWeight: Typography.fontWeight.bold,
  },
  tabBadge: {
    position: 'absolute',
    top: -3,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.statusError,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.brandPrimary,
  },
});
