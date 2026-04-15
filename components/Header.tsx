import React from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBreakpoints } from '../hooks/useBreakpoints';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onBackPress?: () => void;
  breadcrumbs?: BreadcrumbItem[];
}

export function Header({ title, showBack = false, rightAction, onBackPress, breadcrumbs }: HeaderProps) {
  const router = useRouter();
  const { isMobile } = useBreakpoints();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center h-14 px-5 bg-bgSecondary border-b border-border">
      {isMobile ? (
        <>
          <View className="w-12 items-start">
            {showBack && (
              <Pressable onPress={handleBack} className="p-1" hitSlop={{top:12,bottom:12,left:12,right:12}}>
                <Text className="text-xl text-textPrimary">{'←'}</Text>
              </Pressable>
            )}
          </View>

          <Text className="flex-1 text-center text-[16px] font-semibold text-textPrimary" numberOfLines={1}>
            {title}
          </Text>

          <View className="w-12 items-end">
            {rightAction ?? null}
          </View>
        </>
      ) : (
        <>
          {showBack && (
            <Pressable onPress={handleBack} className="p-1" hitSlop={{top:12,bottom:12,left:12,right:12}}>
              <Text className="text-xl text-textPrimary">{'←'}</Text>
            </Pressable>
          )}

          <View className="flex-1">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <View className="flex-row items-center mb-[2px] ml-2">
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={i}>
                    {i > 0 ? (
                      <Text className="text-[11px] text-textMuted">{' / '}</Text>
                    ) : null}
                    {crumb.route ? (
                      <Pressable onPress={() => router.push(crumb.route as any)}>
                        <Text className="text-[11px] text-textAccent font-medium">{crumb.label}</Text>
                      </Pressable>
                    ) : (
                      <Text className="text-[11px] text-textMuted font-medium">{crumb.label}</Text>
                    )}
                  </React.Fragment>
                ))}
              </View>
            ) : null}
            <Text className="text-left text-lg font-semibold text-textPrimary ml-2" numberOfLines={1}>
              {title}
            </Text>
          </View>

          <View className="ml-auto items-end">
            {rightAction ?? null}
          </View>
        </>
      )}
    </View>
  );
}
