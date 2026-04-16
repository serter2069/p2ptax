import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/Colors';
import {
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  Heading,
  Input,
  Modal,
  Rating,
  Screen,
  Text,
} from '../../components/ui';

/**
 * /_dev/ui — temporary demo of the components/ui/ primitive library.
 * Not linked from navigation; for visual QA during Phase 3 migration.
 * Remove after migration is complete.
 */
export default function UiDevPage() {
  const [text, setText] = useState('');
  const [textErr, setTextErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingVertical: Spacing['2xl'] }}>
        <Container>
          <View style={{ gap: Spacing['2xl'] }}>
            <Heading level={1}>UI primitives</Heading>
            <Text variant="muted">
              Demo page for the components/ui library. Not linked anywhere — accessible only
              via /_dev/ui. Used for visual QA during Phase 3 screen migration.
            </Text>

            <Section title="Headings">
              <Heading level={1}>Heading level 1 (display)</Heading>
              <Heading level={2}>Heading level 2 (2xl)</Heading>
              <Heading level={3}>Heading level 3 (xl)</Heading>
              <Heading level={4}>Heading level 4 (lg)</Heading>
            </Section>

            <Section title="Text variants">
              <Text variant="body">Body — default text, base 15, textPrimary.</Text>
              <Text variant="muted">Muted — base 15, textSecondary.</Text>
              <Text variant="caption">Caption — sm 13, textSecondary.</Text>
              <Text variant="label">Label — sm 13, medium, textPrimary.</Text>
              <Text weight="bold">Bold weight.</Text>
              <Text weight="semibold">Semibold weight.</Text>
              <Text weight="medium">Medium weight.</Text>
              <Text weight="regular">Regular weight.</Text>
            </Section>

            <Section title="Buttons — variants (size md)">
              <Row>
                <Button onPress={() => { /* noop */ }}>Primary</Button>
                <Button variant="secondary" onPress={() => { /* noop */ }}>Secondary</Button>
                <Button variant="ghost" onPress={() => { /* noop */ }}>Ghost</Button>
                <Button variant="danger" onPress={() => { /* noop */ }}>Danger</Button>
              </Row>
            </Section>

            <Section title="Buttons — size lg">
              <Row>
                <Button size="lg" onPress={() => { /* noop */ }}>Primary lg</Button>
                <Button size="lg" variant="secondary" onPress={() => { /* noop */ }}>Secondary lg</Button>
              </Row>
            </Section>

            <Section title="Buttons — states">
              <Row>
                <Button loading onPress={() => { /* noop */ }}>Loading</Button>
                <Button disabled onPress={() => { /* noop */ }}>Disabled</Button>
                <Button
                  icon={<Feather name="send" size={16} color={Colors.white} />}
                  onPress={() => { /* noop */ }}
                >
                  With icon
                </Button>
                <Button fullWidth onPress={() => { /* noop */ }}>Full width</Button>
              </Row>
            </Section>

            <Section title="Input">
              <Input
                label="Обычное поле"
                value={text}
                onChangeText={setText}
                placeholder="Введите текст..."
              />
              <Input
                label="С ошибкой"
                value={textErr}
                onChangeText={setTextErr}
                placeholder="Ошибочное поле"
                error="Это поле обязательно для заполнения"
              />
              <Input
                label="С иконкой"
                value={text}
                onChangeText={setText}
                placeholder="Поиск..."
                icon={<Feather name="search" size={16} color={Colors.textMuted} />}
              />
              <Input
                label="Отключено"
                value="readonly value"
                onChangeText={() => { /* noop */ }}
                editable={false}
              />
              <Input
                label="Многострочное"
                value={text}
                onChangeText={setText}
                placeholder="Напишите длинный текст..."
                multiline
                numberOfLines={4}
              />
            </Section>

            <Section title="Cards">
              <Card>
                <Heading level={4}>Elevated card</Heading>
                <Text variant="muted">Default variant, shadow md.</Text>
              </Card>
              <Card variant="outlined">
                <Heading level={4}>Outlined card</Heading>
                <Text variant="muted">1px border, no shadow.</Text>
              </Card>
              <Card onPress={() => { /* noop */ }}>
                <Heading level={4}>Pressable card</Heading>
                <Text variant="muted">Click/tap me — scales 0.98 on press.</Text>
              </Card>
              <Card padding="sm">
                <Text>Padding sm</Text>
              </Card>
              <Card padding="lg">
                <Text>Padding lg</Text>
              </Card>
            </Section>

            <Section title="Badges">
              <Row>
                <Badge>default</Badge>
                <Badge variant="success">success</Badge>
                <Badge variant="warning">warning</Badge>
                <Badge variant="danger">danger</Badge>
                <Badge variant="info">info</Badge>
              </Row>
            </Section>

            <Section title="Rating">
              <Rating value={4.5} reviewCount={127} />
              <Rating value={3.2} reviewCount={12} size="sm" />
              <Rating value={5} />
              <Rating value={0} showNumeric={false} />
            </Section>

            <Section title="EmptyState">
              <Card variant="outlined" padding="sm">
                <EmptyState
                  icon={<Feather name="inbox" size={40} color={Colors.textMuted} />}
                  title="Ничего не найдено"
                  description="Попробуйте изменить параметры поиска или сбросить фильтры."
                  action={<Button variant="secondary" onPress={() => { /* noop */ }}>Сбросить</Button>}
                />
              </Card>
            </Section>

            <Section title="Modal">
              <Button onPress={() => setModalOpen(true)}>Open modal</Button>
            </Section>

            <View style={{ height: Spacing['4xl'] }} />
          </View>
        </Container>
      </ScrollView>

      <Modal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Заголовок модалки"
        primaryAction={{
          label: 'Подтвердить',
          onPress: () => setModalOpen(false),
        }}
        secondaryAction={{
          label: 'Отмена',
          onPress: () => setModalOpen(false),
        }}
      >
        <Text>
          Это содержимое модалки. Здесь может быть форма, текст, что угодно. Backdrop tap
          закрывает.
        </Text>
        <Input
          label="Поле внутри модалки"
          value={text}
          onChangeText={setText}
          placeholder="Напишите что-нибудь"
        />
      </Modal>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: Spacing.md }}>
      <Heading level={2}>{title}</Heading>
      <View style={{ gap: Spacing.md }}>{children}</View>
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
      {children}
    </View>
  );
}
