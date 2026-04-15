import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/Header';
import { MOCK_RESPONSES } from '../../constants/protoMockData';

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row" style={{ gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= Math.round(rating) ? Colors.statusWarning : Colors.border} />
      ))}
    </View>
  );
}

function ResponseItem({ name, price, message, rating, reviews, onAccept, onDecline }: {
  name: string; price: string; message: string; rating: number; reviews: number;
  onAccept: () => void; onDecline: () => void;
}) {
  return (
    <View className="gap-2 rounded-lg border border-border bg-bgCard p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-bgSecondary">
          <Text className="text-base font-bold text-brandPrimary">{name[0]}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-textPrimary">{name}</Text>
          <View className="flex-row items-center gap-1">
            <Stars rating={rating} />
            <Text className="text-xs text-textMuted">{rating} ({reviews})</Text>
          </View>
        </View>
        <Text className="text-base font-bold text-brandPrimary">{price}</Text>
      </View>
      <Text className="text-sm text-textSecondary" numberOfLines={2}>{message}</Text>
      <View className="mt-1 flex-row gap-2">
        <Pressable onPress={onAccept} className="h-9 flex-1 items-center justify-center rounded-lg bg-brandPrimary">
          <Text className="text-sm font-semibold text-white">Принять</Text>
        </Pressable>
        <Pressable onPress={onDecline} className="h-9 flex-1 items-center justify-center rounded-lg border border-border">
          <Text className="text-sm text-textMuted">Отклонить</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Popup({ type, name, onConfirm, onCancel }: { type: 'accept' | 'decline'; name: string; onConfirm: () => void; onCancel: () => void }) {
  const isAccept = type === 'accept';
  return (
    <View className="absolute bottom-0 left-0 right-0 top-0 z-10 items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <View className="w-full items-center gap-3 rounded-xl bg-bgCard p-6" style={{ maxWidth: 340 }}>
        <Feather name={isAccept ? 'check' : 'x'} size={40} color={isAccept ? Colors.brandPrimary : Colors.statusError} />
        <Text className="text-lg font-bold text-textPrimary">{isAccept ? 'Принять отклик?' : 'Отклонить отклик?'}</Text>
        <Text className="text-center text-sm text-textMuted">
          {isAccept
            ? `Специалист ${name} будет назначен исполнителем вашей заявки`
            : `Отклик от ${name} будет отклонён`}
        </Text>
        <View className="w-full gap-2">
          <Pressable
            onPress={onConfirm}
            className="h-11 items-center justify-center rounded-lg"
            style={{ backgroundColor: isAccept ? Colors.brandPrimary : Colors.statusError }}
          >
            <Text className="text-sm font-semibold text-white">{isAccept ? 'Подтвердить' : 'Отклонить'}</Text>
          </Pressable>
          <Pressable onPress={onCancel} className="h-11 items-center justify-center rounded-lg border border-border">
            <Text className="text-sm text-textMuted">Отмена</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function ResponsesPage() {
  const [popupState, setPopupState] = useState<{ type: 'accept' | 'decline'; name: string } | null>(null);

  return (
    <View className="flex-1">
      <Header variant="back" backTitle="Отклики" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, position: 'relative' }}>
        <Text className="text-lg font-bold text-textPrimary">Отклики ({MOCK_RESPONSES.length})</Text>
        {MOCK_RESPONSES.map((r) => (
          <ResponseItem
            key={r.id}
            name={r.specialistName}
            price={r.price}
            message={r.message}
            rating={r.rating}
            reviews={r.reviewCount}
            onAccept={() => setPopupState({ type: 'accept', name: r.specialistName })}
            onDecline={() => setPopupState({ type: 'decline', name: r.specialistName })}
          />
        ))}
        {popupState && (
          <Popup
            type={popupState.type}
            name={popupState.name}
            onConfirm={() => setPopupState(null)}
            onCancel={() => setPopupState(null)}
          />
        )}
      </ScrollView>
    </View>
  );
}
