import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StateSection } from '../StateSection';
import { Colors } from '../../../constants/Colors';

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View className="flex-1 items-center gap-1 rounded-xl border border-borderLight bg-white p-3">
      <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: color + '15' }}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text className="text-lg font-bold" style={{ color }}>{value}</Text>
      <Text className="text-xs text-textMuted">{label}</Text>
    </View>
  );
}

function RequestCard({ title, service, fns, city, date, messageCount, status, statusColor }: {
  title: string; service: string; fns: string; city: string; date: string;
  messageCount: number; status: string; statusColor: string;
}) {
  return (
    <Pressable className="gap-2 rounded-xl border border-borderLight bg-white p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-textPrimary" numberOfLines={2}>{title}</Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: statusColor + '18' }}>
          <Text className="text-xs font-semibold" style={{ color: statusColor }}>{status}</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <View className="flex-row items-center gap-1">
          <Feather name="briefcase" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{service}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="home" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{fns}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{city}</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Feather name="calendar" size={12} color={Colors.textMuted} />
          <Text className="text-xs text-textMuted">{date}</Text>
        </View>
        {messageCount > 0 && (
          <View className="flex-row items-center gap-1">
            <Feather name="message-circle" size={12} color={Colors.brandPrimary} />
            <Text className="text-xs font-medium text-brandPrimary">{messageCount} сообщ.</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function MessagePreview({ initials, name, snippet, time, unread }: {
  initials: string; name: string; snippet: string; time: string; unread?: boolean;
}) {
  return (
    <Pressable className="flex-row items-center gap-3 rounded-xl border border-borderLight bg-white p-3">
      <View className="h-10 w-10 items-center justify-center rounded-full border border-borderLight bg-bgSurface">
        <Text className="text-sm font-bold text-brandPrimary">{initials}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className={`text-sm ${unread ? 'font-bold text-textPrimary' : 'font-medium text-textPrimary'}`}>{name}</Text>
          <Text className="text-xs text-textMuted">{time}</Text>
        </View>
        <Text className={`text-xs ${unread ? 'font-medium text-textSecondary' : 'text-textMuted'}`} numberOfLines={1}>{snippet}</Text>
      </View>
      {unread && (
        <View className="h-2.5 w-2.5 rounded-full bg-brandPrimary" />
      )}
    </Pressable>
  );
}

function QuickActions() {
  return (
    <View className="flex-row gap-2">
      <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brandPrimary">
        <Feather name="plus" size={16} color={Colors.white} />
        <Text className="text-sm font-semibold text-white">Новая заявка</Text>
      </Pressable>
      <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-borderLight bg-white">
        <Feather name="list" size={16} color={Colors.brandPrimary} />
        <Text className="text-sm font-medium text-brandPrimary">Мои заявки</Text>
      </Pressable>
      <Pressable className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-borderLight bg-white">
        <Feather name="message-circle" size={16} color={Colors.brandPrimary} />
        <Text className="text-sm font-medium text-brandPrimary">Сообщения</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// STATE 1: DEFAULT — active requests + recent messages
// ---------------------------------------------------------------------------

function DefaultDashboard() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Greeting */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-textPrimary">{getGreeting()}, Елена!</Text>
          <Text className="text-sm text-textMuted">Ваши заявки и сообщения</Text>
        </View>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-bgSurface">
          <Feather name="bell" size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Stats */}
      <View className="flex-row gap-2">
        <StatCard icon="file-text" label="Активные" value="3" color={Colors.brandPrimary} />
        <StatCard icon="message-circle" label="Сообщения" value="5" color={Colors.statusSuccess} />
        <StatCard icon="check-circle" label="Завершены" value="12" color={Colors.textMuted} />
      </View>

      {/* Quick actions */}
      <QuickActions />

      {/* Active requests */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Активные заявки</Text>
          <Pressable><Text className="text-sm font-medium text-brandPrimary">Все заявки</Text></Pressable>
        </View>
        <RequestCard
          title="Камеральная проверка декларации по НДС"
          service="Камеральная проверка"
          fns="ФНС №46 по г. Москве"
          city="Москва"
          date="08.04.2026"
          messageCount={2}
          status="Новая"
          statusColor={Colors.brandPrimary}
        />
        <RequestCard
          title="Отдел оперативного контроля — требование"
          service="Отдел оперативного контроля"
          fns="ФНС №12 по г. Новосибирску"
          city="Новосибирск"
          date="07.04.2026"
          messageCount={4}
          status="В работе"
          statusColor={Colors.statusWarning}
        />
        <RequestCard
          title="Выездная проверка ООО «Ромашка»"
          service="Выездная проверка"
          fns="ФНС №15 по г. Москве"
          city="Москва"
          date="05.04.2026"
          messageCount={0}
          status="Новая"
          statusColor={Colors.brandPrimary}
        />
      </View>

      {/* Recent messages */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Новые сообщения</Text>
          <Pressable><Text className="text-sm font-medium text-brandPrimary">Все сообщения</Text></Pressable>
        </View>
        <MessagePreview
          initials="АП"
          name="Алексей Петров"
          snippet="Здравствуйте! Готов помочь с камеральной проверкой. Опыт 8 лет."
          time="14:32"
          unread
        />
        <MessagePreview
          initials="ОС"
          name="Ольга Смирнова"
          snippet="Специализируюсь на сопровождении проверок. Помогу подготовиться."
          time="12:15"
          unread
        />
        <MessagePreview
          initials="ИК"
          name="Игорь Козлов"
          snippet="Добрый день! По вашей заявке на оперативный контроль..."
          time="вчера"
        />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// STATE 2: EMPTY — no requests yet
// ---------------------------------------------------------------------------

function EmptyDashboard() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xl font-bold text-textPrimary">{getGreeting()}, Елена!</Text>
        <Text className="text-sm text-textMuted">Добро пожаловать в Налоговик</Text>
      </View>

      <View className="items-center gap-3 py-10">
        <View className="h-[72px] w-[72px] items-center justify-center rounded-full border border-borderLight bg-bgSurface">
          <Feather name="file-text" size={36} color={Colors.brandPrimary} />
        </View>
        <Text className="text-lg font-semibold text-textPrimary">Пока нет заявок</Text>
        <Text className="max-w-[280px] text-center text-sm text-textMuted">
          Создайте первую заявку, чтобы найти налогового специалиста для решения вашей задачи
        </Text>
        <Pressable className="mt-2 h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-brandPrimary">
          <Feather name="plus" size={18} color={Colors.white} />
          <Text className="text-base font-semibold text-white">Создать первую заявку</Text>
        </Pressable>
      </View>

      {/* How it works */}
      <View className="gap-3">
        <Text className="text-base font-semibold text-textPrimary">Как это работает</Text>
        {[
          { num: '1', title: 'Опишите задачу', desc: 'Укажите тип услуги, город и ФНС' },
          { num: '2', title: 'Получите сообщения', desc: 'Специалисты напишут вам в чат' },
          { num: '3', title: 'Выберите лучшего', desc: 'Общайтесь, сравните и договоритесь' },
        ].map((h) => (
          <View key={h.num} className="flex-row items-start gap-3 rounded-xl border border-borderLight bg-white p-3">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-brandPrimary">
              <Text className="text-sm font-bold text-white">{h.num}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-textPrimary">{h.title}</Text>
              <Text className="text-xs text-textMuted">{h.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// STATE 3: UNREAD — dashboard with unread message badges
// ---------------------------------------------------------------------------

function UnreadDashboard() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Greeting with notification badge */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-textPrimary">{getGreeting()}, Елена!</Text>
          <Text className="text-sm text-textMuted">У вас 3 непрочитанных сообщения</Text>
        </View>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-bgSurface">
          <Feather name="bell" size={20} color={Colors.textPrimary} />
          <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-statusError" />
        </Pressable>
      </View>

      {/* Stats with unread emphasis */}
      <View className="flex-row gap-2">
        <StatCard icon="file-text" label="Активные" value="3" color={Colors.brandPrimary} />
        <StatCard icon="message-circle" label="Непрочитано" value="3" color={Colors.statusError} />
        <StatCard icon="check-circle" label="Завершены" value="12" color={Colors.textMuted} />
      </View>

      <QuickActions />

      {/* Unread messages banner */}
      <Pressable className="flex-row items-center gap-3 rounded-xl bg-bgSurface p-4">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brandPrimary">
          <Feather name="message-circle" size={20} color={Colors.white} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-textPrimary">3 новых сообщения</Text>
          <Text className="text-xs text-textMuted">Специалисты ответили на ваши заявки</Text>
        </View>
        <Feather name="chevron-right" size={18} color={Colors.textMuted} />
      </Pressable>

      {/* Active requests */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Активные заявки</Text>
          <Pressable><Text className="text-sm font-medium text-brandPrimary">Все заявки</Text></Pressable>
        </View>
        <RequestCard
          title="Камеральная проверка декларации по НДС"
          service="Камеральная проверка"
          fns="ФНС №46 по г. Москве"
          city="Москва"
          date="08.04.2026"
          messageCount={2}
          status="Новая"
          statusColor={Colors.brandPrimary}
        />
        <RequestCard
          title="Отдел оперативного контроля — требование"
          service="Отдел оперативного контроля"
          fns="ФНС №12 по г. Новосибирску"
          city="Новосибирск"
          date="07.04.2026"
          messageCount={1}
          status="В работе"
          statusColor={Colors.statusWarning}
        />
      </View>

      {/* Recent messages */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Новые сообщения</Text>
          <Pressable><Text className="text-sm font-medium text-brandPrimary">Все сообщения</Text></Pressable>
        </View>
        <MessagePreview
          initials="АП"
          name="Алексей Петров"
          snippet="Могу начать работу прямо сегодня, если вам удобно."
          time="5 мин"
          unread
        />
        <MessagePreview
          initials="ОС"
          name="Ольга Смирнова"
          snippet="Отправила вам список необходимых документов."
          time="1 час"
          unread
        />
        <MessagePreview
          initials="ИК"
          name="Игорь Козлов"
          snippet="Уточните, пожалуйста, период проверки."
          time="2 часа"
          unread
        />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// STATE 4: STATUS CHANGE — request closed/completed notification
// ---------------------------------------------------------------------------

function StatusChangeDashboard() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-textPrimary">{getGreeting()}, Елена!</Text>
          <Text className="text-sm text-textMuted">Ваши заявки и сообщения</Text>
        </View>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-bgSurface">
          <Feather name="bell" size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Status change notification */}
      <View className="gap-2 rounded-xl border border-borderLight bg-bgSurface p-4">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: Colors.statusSuccess + '18' }}>
            <Feather name="check-circle" size={18} color={Colors.statusSuccess} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-textPrimary">Заявка завершена</Text>
            <Text className="text-xs text-textMuted">Отдел оперативного контроля — требование</Text>
          </View>
          <Pressable>
            <Feather name="x" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>
        <Pressable className="h-9 flex-row items-center justify-center gap-1.5 rounded-lg border border-borderLight bg-white">
          <Feather name="star" size={14} color={Colors.statusWarning} />
          <Text className="text-sm font-medium text-textPrimary">Оставить отзыв</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View className="flex-row gap-2">
        <StatCard icon="file-text" label="Активные" value="2" color={Colors.brandPrimary} />
        <StatCard icon="message-circle" label="Сообщения" value="1" color={Colors.statusSuccess} />
        <StatCard icon="check-circle" label="Завершены" value="13" color={Colors.textMuted} />
      </View>

      <QuickActions />

      {/* Active requests */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Активные заявки</Text>
          <Pressable><Text className="text-sm font-medium text-brandPrimary">Все заявки</Text></Pressable>
        </View>
        <RequestCard
          title="Камеральная проверка декларации по НДС"
          service="Камеральная проверка"
          fns="ФНС №46 по г. Москве"
          city="Москва"
          date="08.04.2026"
          messageCount={2}
          status="В работе"
          statusColor={Colors.statusWarning}
        />
        <RequestCard
          title="Выездная проверка ООО «Ромашка»"
          service="Выездная проверка"
          fns="ФНС №15 по г. Москве"
          city="Москва"
          date="05.04.2026"
          messageCount={0}
          status="Новая"
          statusColor={Colors.brandPrimary}
        />
      </View>

      {/* Recent messages */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-textPrimary">Новые сообщения</Text>
          <Pressable><Text className="text-sm font-medium text-brandPrimary">Все сообщения</Text></Pressable>
        </View>
        <MessagePreview
          initials="АП"
          name="Алексей Петров"
          snippet="Подготовка к проверке почти завершена, осталось проверить документы."
          time="10:45"
        />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// STATE 5: LOADING
// ---------------------------------------------------------------------------

function LoadingDashboard() {
  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 24 }}>
      {/* Greeting skeleton */}
      <View className="gap-2">
        <View className="h-6 w-3/5 rounded-md bg-bgSurface" />
        <View className="h-4 w-2/5 rounded-md bg-bgSurface" />
      </View>

      {/* Stats skeleton */}
      <View className="flex-row gap-2">
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-1 items-center gap-2 rounded-xl border border-borderLight p-3">
            <View className="h-9 w-9 rounded-full bg-bgSurface" />
            <View className="h-5 w-8 rounded bg-bgSurface" />
            <View className="h-3 w-12 rounded bg-bgSurface" />
          </View>
        ))}
      </View>

      {/* Actions skeleton */}
      <View className="h-10 w-full rounded-xl bg-bgSurface" />

      {/* Request cards skeleton */}
      <View className="gap-3">
        <View className="h-5 w-2/5 rounded bg-bgSurface" />
        {[1, 2].map((i) => (
          <View key={i} className="gap-2 rounded-xl border border-borderLight p-4">
            <View className="h-4 w-4/5 rounded bg-bgSurface" />
            <View className="h-3 w-3/5 rounded bg-bgSurface" />
            <View className="h-3 w-2/5 rounded bg-bgSurface" />
          </View>
        ))}
      </View>

      <View className="items-center pt-2">
        <ActivityIndicator size="small" color={Colors.brandPrimary} />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function DashboardStates() {
  return (
    <>
      <StateSection title="DEFAULT">
        <DefaultDashboard />
      </StateSection>
      <StateSection title="EMPTY">
        <EmptyDashboard />
      </StateSection>
      <StateSection title="UNREAD_MESSAGES">
        <UnreadDashboard />
      </StateSection>
      <StateSection title="STATUS_CHANGE">
        <StatusChangeDashboard />
      </StateSection>
      <StateSection title="LOADING">
        <LoadingDashboard />
      </StateSection>
    </>
  );
}
