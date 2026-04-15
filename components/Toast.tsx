import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors, BorderRadius, Typography } from '../constants/Colors';
import { toast, ToastMessage } from '../lib/toast';

const AUTO_DISMISS_MS = 3000;

const TYPE_STYLES: Record<ToastMessage['type'], { bg: string; text: string }> = {
  success: { bg: Colors.statusBg.success, text: Colors.statusSuccess },
  error: { bg: Colors.statusBg.error, text: Colors.statusError },
  info: { bg: Colors.statusBg.info, text: Colors.statusInfo },
};

function ToastItem({ item, onDismiss }: { item: ToastMessage; onDismiss: (id: string) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    timerRef.current = setTimeout(() => {
      fadeOut();
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const fadeOut = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => onDismiss(item.id));
  }, [item.id, onDismiss, opacity]);

  const colors = TYPE_STYLES[item.type];

  return (
    <Animated.View style={[styles.item, { backgroundColor: colors.bg, opacity }]}>
      <Pressable onPress={fadeOut} style={styles.itemInner}>
        <Text style={[styles.text, { color: colors.text }]}>{item.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * ToastContainer — renders active toasts.
 * Place once at app root, above all other content.
 */
export function ToastContainer() {
  const [items, setItems] = useState<ToastMessage[]>([]);

  const handleDismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubShow = toast.onShow((msg) => {
      setItems((prev) => [...prev, msg]);
    });
    const unsubDismiss = toast.onDismiss((id) => {
      handleDismiss(id);
    });
    return () => {
      unsubShow();
      unsubDismiss();
    };
  }, [handleDismiss]);

  if (items.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {items.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={handleDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 56,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  item: {
    marginBottom: 8,
    borderRadius: BorderRadius.lg,
    maxWidth: 480,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  itemInner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
});
