import React from 'react';
import { ScrollView, View } from 'react-native';
import { Colors, Spacing } from '../constants/Colors';
import { Container, Heading, Screen, Text } from '../components/ui';
import { Header } from '../components/Header';

const SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: '1. Общие положения',
    paragraphs: [
      'Настоящие Условия использования (далее — «Условия») регулируют порядок использования платформы «Налоговик» (далее — «Платформа»), предоставляющей услуги по поиску и подбору налоговых специалистов.',
      'Используя Платформу, вы подтверждаете, что ознакомились с настоящими Условиями и принимаете их в полном объёме.',
    ],
  },
  {
    title: '2. Регистрация и учётная запись',
    paragraphs: [
      'Для использования функций Платформы необходимо пройти регистрацию, указав действующий адрес электронной почты. Авторизация осуществляется посредством одноразового кода (OTP), направляемого на указанный email.',
      'Пользователь несёт ответственность за сохранность доступа к своей электронной почте и учётной записи на Платформе.',
    ],
  },
  {
    title: '3. Роли пользователей',
    paragraphs: [
      'На Платформе предусмотрены следующие роли: Клиент и Специалист. Клиент может создавать заявки на налоговые услуги. Специалист может откликаться на заявки и оказывать услуги.',
    ],
  },
  {
    title: '4. Ограничение ответственности',
    paragraphs: [
      'Платформа является информационным посредником и не несёт ответственности за качество услуг, оказываемых специалистами. Все финансовые расчёты между клиентами и специалистами осуществляются напрямую, без участия Платформы.',
    ],
  },
  {
    title: '5. Конфиденциальность',
    paragraphs: [
      'Платформа обрабатывает персональные данные пользователей в соответствии с Политикой конфиденциальности. Данные не передаются третьим лицам без согласия пользователя, за исключением случаев, предусмотренных законодательством.',
    ],
  },
  {
    title: '6. Изменение условий',
    paragraphs: [
      'Администрация Платформы оставляет за собой право вносить изменения в настоящие Условия. Актуальная версия всегда доступна на данной странице.',
    ],
  },
];

export default function TermsPage() {
  return (
    <Screen bg={Colors.white}>
      <Header variant="guest" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.xl }}>
        <Container>
          <View style={{ gap: Spacing.lg }}>
            <Heading level={1}>Условия использования</Heading>

            {SECTIONS.map((section) => (
              <View key={section.title} style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
                <Heading level={4}>{section.title}</Heading>
                {section.paragraphs.map((p, i) => (
                  <Text key={i} variant="muted" style={{ lineHeight: 22 }}>{p}</Text>
                ))}
              </View>
            ))}

            <Text variant="caption" align="center" style={{ marginTop: Spacing.lg }}>
              Последнее обновление: 01.04.2026
            </Text>
          </View>
        </Container>
      </ScrollView>
    </Screen>
  );
}
