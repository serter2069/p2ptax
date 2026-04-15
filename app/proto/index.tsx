import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Platform, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { pageRegistry, PAGE_GROUPS } from '../../constants/pageRegistry';
import type { PageEntry } from '../../constants/pageRegistry';

const GROUP_LABELS: Record<string, string> = {
  Overview: 'Обзор',
  Brand: 'Бренд',
  Auth: 'Авторизация',
  Onboarding: 'Онбординг',
  Dashboard: 'Кабинет клиента',
  Specialist: 'Специалист',
  Public: 'Публичные',
  Admin: 'Админ',
};

const GROUP_COLORS: Record<string, string> = {
  Overview: '#6B7280',
  Brand: '#EC4899',
  Auth: '#6366F1',
  Onboarding: '#8B5CF6',
  Dashboard: '#1A5BA8',
  Specialist: '#059669',
  Public: '#D97706',
  Admin: '#DC2626',
};

const PRESET_WIDTHS = [
  { label: '375', value: 375 },
  { label: '430', value: 430 },
  { label: '768', value: 768 },
  { label: '1024', value: 1024 },
  { label: 'Full', value: 0 },
];

function getFilePath(page: PageEntry): string {
  const stateFile = page.id
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return `components/proto/states/${stateFile}States.tsx`;
}

function buildCopyText(page: PageEntry): string {
  return [
    `Page: ${page.title}`,
    `Route: ${page.route}`,
    `Proto showcase: /proto/states/${page.id}`,
    `File: ${getFilePath(page)}`,
    `States: ${page.stateCount}`,
    `Group: ${page.group}`,
    `Project: /Users/sergei/Documents/Projects/Ruslan/p2ptax`,
  ].join('\n');
}

export default function ProtoIndex() {
  const [search, setSearch] = useState('');
  const [selectedPage, setSelectedPage] = useState<PageEntry | null>(null);
  const [previewWidth, setPreviewWidth] = useState(430); // default mobile
  const [copied, setCopied] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<View>(null);
  const previewAreaRef = useRef<View>(null);

  const totalStates = pageRegistry.reduce((s, p) => s + p.stateCount, 0);

  // Landing always first, then grouped
  const landingPage = pageRegistry.find((p) => p.id === 'landing');
  const otherPages = pageRegistry.filter((p) => p.id !== 'landing');

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return pageRegistry.filter(
      (p) => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.route.toLowerCase().includes(q)
    );
  }, [search]);

  const displayPages = filtered || undefined;

  const handleCopy = useCallback((page: PageEntry) => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(buildCopyText(page)).then(() => {
        setCopied(page.id);
        setTimeout(() => setCopied(null), 1500);
      });
    }
  }, []);

  const handleOpenNewTab = useCallback((page: PageEntry) => {
    if (Platform.OS === 'web') {
      window.open(`/proto/states/${page.id}`, '_blank');
    }
  }, []);

  // Drag to resize — offset-based, accounts for centered layout (delta * 2)
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);

  const handleDragStart = useCallback((e: any) => {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    setIsDragging(true);

    // Remember where mouse started and what width was at that moment
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = previewWidth || 800;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const delta = e.clientX - dragStartXRef.current;
      // Multiply by 2: container is centered, so width change moves each edge by half
      const newWidth = Math.round(Math.max(280, dragStartWidthRef.current + delta * 2));
      setPreviewWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', onMouseUp, true);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((f) => { (f as HTMLElement).style.pointerEvents = ''; });
    };

    // Disable pointer events on iframe during drag
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((f) => { (f as HTMLElement).style.pointerEvents = 'none'; });

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove, true);
    window.addEventListener('mouseup', onMouseUp, true);
  }, [previewWidth]);

  // Sidebar item renderer
  const renderSidebarItem = (page: PageEntry, isLanding = false) => {
    const isActive = selectedPage?.id === page.id;
    const groupColor = GROUP_COLORS[page.group] || Colors.brandPrimary;

    return (
      <View key={page.id} style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}>
        <View style={[styles.sidebarAccent, { backgroundColor: groupColor }]} />
        <Pressable
          onPress={() => setSelectedPage(page)}
          style={styles.sidebarItemContent}
        >
          <Text style={[styles.sidebarTitle, isActive && styles.sidebarTitleActive, isLanding && styles.sidebarTitleLanding]} numberOfLines={1}>
            {page.title}
          </Text>
          <Text style={styles.sidebarRoute} numberOfLines={1}>{page.route}</Text>
        </Pressable>
        <Text style={styles.sidebarStates}>{page.stateCount}</Text>
        <Pressable
          onPress={() => handleCopy(page)}
          style={styles.sidebarIconBtn}
        >
          <Feather name={copied === page.id ? 'check' : 'copy'} size={16} color={copied === page.id ? '#16a34a' : Colors.brandPrimary} />
        </Pressable>
        <Pressable
          onPress={() => handleOpenNewTab(page)}
          style={[styles.sidebarIconBtn, { marginRight: Spacing.xs }]}
        >
          <Feather name="external-link" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.logoText}>P2PTax Proto</Text>
          <Text style={styles.statsText}>{pageRegistry.length} стр / {totalStates} сост</Text>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
          {displayPages ? (
            <>
              <Text style={styles.sidebarGroupLabel}>Результаты ({displayPages.length})</Text>
              {displayPages.map((p) => renderSidebarItem(p))}
            </>
          ) : (
            <>
              {/* Landing first */}
              {landingPage && (
                <>
                  <Text style={styles.sidebarGroupLabel}>Лендинг</Text>
                  {renderSidebarItem(landingPage, true)}
                </>
              )}

              {/* Grouped pages */}
              {PAGE_GROUPS.map((group) => {
                const pages = otherPages.filter((p) => p.group === group);
                if (pages.length === 0) return null;
                return (
                  <React.Fragment key={group}>
                    <Text style={styles.sidebarGroupLabel}>{GROUP_LABELS[group]} ({pages.length})</Text>
                    {pages.map((p) => renderSidebarItem(p))}
                  </React.Fragment>
                );
              })}
            </>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>

      {/* Preview area */}
      <View style={styles.previewContainer} ref={previewAreaRef}>
        {selectedPage ? (
          <>
            {/* Toolbar */}
            <View style={styles.toolbar}>
              <Text style={styles.toolbarTitle}>{selectedPage.title}</Text>
              <Text style={styles.toolbarRoute}>{selectedPage.route}</Text>
              <View style={styles.toolbarSpacer} />
              {/* Width presets */}
              <View style={styles.presetRow}>
                {PRESET_WIDTHS.map((p) => (
                  <Pressable
                    key={p.label}
                    onPress={() => setPreviewWidth(p.value)}
                    style={[
                      styles.presetBtn,
                      previewWidth === p.value && styles.presetBtnActive,
                    ]}
                  >
                    <Text style={[styles.presetText, previewWidth === p.value && styles.presetTextActive]}>
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.widthLabel}>
                {previewWidth === 0 ? '100%' : `${previewWidth}px`}
              </Text>
            </View>

            {/* Iframe + resize handle */}
            {Platform.OS === 'web' && (
              <View style={styles.previewFrame} nativeID="proto-preview-area">
                <View style={[
                  styles.iframeWrap,
                  previewWidth > 0 ? { width: previewWidth, alignSelf: 'center' } : { width: '100%' },
                ]}>
                  <iframe
                    src={`/proto/states/${selectedPage.id}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      backgroundColor: '#fff',
                    }}
                    title={selectedPage.title}
                  />
                  {/* Resize bar — full height, wide grab area */}
                  <div
                    onMouseDown={handleDragStart}
                    style={{
                      position: 'absolute',
                      right: -14,
                      top: 0,
                      bottom: 0,
                      width: 28,
                      cursor: 'col-resize',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}
                  >
                    <div style={{
                      width: 6,
                      height: '100%',
                      maxHeight: 120,
                      borderRadius: 3,
                      backgroundColor: isDragging ? Colors.brandPrimary : '#C0C8D0',
                      boxShadow: isDragging ? '0 0 0 4px rgba(26,91,168,0.15)' : 'none',
                      transition: 'background-color 0.15s, box-shadow 0.15s',
                    }} />
                  </div>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyIcon}>&#9776;</Text>
            <Text style={styles.emptyTitle}>Выбери страницу слева</Text>
            <Text style={styles.emptySubtitle}>Прототип отобразится здесь с возможностью менять ширину</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const SIDEBAR_WIDTH = 320;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F0F2F5',
  },

  // Sidebar
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.bgCard,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  sidebarHeader: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  logoText: {
    fontSize: 18,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  statsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  searchWrap: {
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    height: 36,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarGroupLabel: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
    marginVertical: 2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    height: 48,
  },
  sidebarItemActive: {
    backgroundColor: Colors.bgSecondary,
  },
  sidebarAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  sidebarItemContent: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
  },
  sidebarTitle: {
    fontSize: 13,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  sidebarTitleActive: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
  },
  sidebarTitleLanding: {
    fontWeight: Typography.fontWeight.bold,
  },
  sidebarRoute: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    lineHeight: 14,
  },
  sidebarStates: {
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.brandPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  sidebarIconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  // Preview
  previewContainer: {
    flex: 1,
    backgroundColor: '#E8EAED',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  toolbarTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  toolbarRoute: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  toolbarSpacer: {
    flex: 1,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 4,
  },
  presetBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgSecondary,
  },
  presetBtnActive: {
    backgroundColor: Colors.brandPrimary,
  },
  presetText: {
    fontSize: 12,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textMuted,
  },
  presetTextActive: {
    color: '#fff',
  },
  widthLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    minWidth: 50,
    textAlign: 'right',
  },
  previewFrame: {
    flex: 1,
    padding: Spacing.md,
  },
  iframeWrap: {
    flex: 1,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  // Empty state
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
    color: Colors.textMuted,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    opacity: 0.7,
  },
});
