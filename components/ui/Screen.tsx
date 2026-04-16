import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

export interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: string;
}

export function Screen({ children, style, bg }: ScreenProps) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg ?? Colors.bgPrimary }, style]}>
      {children}
    </SafeAreaView>
  );
}
