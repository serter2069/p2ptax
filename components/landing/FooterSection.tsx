import { View, Text, Pressable } from "react-native";
import { colors, overlay } from "@/lib/theme";

interface FooterSectionProps {
  isDesktop: boolean;
  onHome: () => void;
  onViewCatalog: () => void;
  onCreateRequest: () => void;
  onBecomeSpecialist: () => void;
  onLegal: (target: "terms" | "privacy") => void;
}

/**
 * Three-column footer: About / For Specialists / Legal. Minimal, sits at
 * the very bottom of the landing scroll.
 */
export default function FooterSection({
  isDesktop,
  onHome,
  onViewCatalog,
  onCreateRequest,
  onBecomeSpecialist,
  onLegal,
}: FooterSectionProps) {
  return (
    <View
      style={{
        backgroundColor: colors.text,
        paddingTop: isDesktop ? 64 : 48,
        paddingBottom: isDesktop ? 48 : 40,
        paddingHorizontal: isDesktop ? 32 : 20,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1152,
          marginHorizontal: "auto",
        }}
      >
        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            gap: isDesktop ? 64 : 32,
            justifyContent: "space-between",
          }}
        >
          {/* Brand column. */}
          <View style={{ flex: isDesktop ? 1.2 : undefined, maxWidth: 320, gap: 16 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="P2PTax — главная"
              onPress={onHome}
              className="flex-row items-center"
            >
              <View
                className="rounded-lg items-center justify-center"
                style={{ width: 28, height: 28, backgroundColor: colors.primary, marginRight: 10 }}
              >
                <Text className="text-white font-extrabold" style={{ fontSize: 15 }}>P</Text>
              </View>
              <Text className="text-white font-extrabold" style={{ fontSize: 18 }}>
                P2PTax
              </Text>
            </Pressable>
            <Text style={{ color: overlay.white70, fontSize: 13, lineHeight: 20 }}>
              Маркетплейс практикующих специалистов по ФНС. Для
              клиентов и специалистов — бесплатно.
            </Text>
          </View>

          <FooterColumn title="О сервисе">
            <FooterLink label="Главная" onPress={onHome} />
            <FooterLink label="Специалисты" onPress={onViewCatalog} />
            <FooterLink label="Создать заявку" onPress={onCreateRequest} />
          </FooterColumn>

          <FooterColumn title="Для специалистов">
            <FooterLink label="Стать специалистом" onPress={onBecomeSpecialist} />
          </FooterColumn>

          <FooterColumn title="Правовое">
            <FooterLink label="Условия использования" onPress={() => onLegal("terms")} />
            <FooterLink label="Политика конфиденциальности" onPress={() => onLegal("privacy")} />
          </FooterColumn>
        </View>

        <View
          style={{
            marginTop: isDesktop ? 48 : 32,
            paddingTop: 24,
            borderTopWidth: 1,
            borderTopColor: overlay.white10,
            flexDirection: isDesktop ? "row" : "column",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Text style={{ color: overlay.white50, fontSize: 12 }}>
            © 2026 P2PTax. Все права защищены.
          </Text>
          <Text style={{ color: overlay.white30, fontSize: 12 }}>
            Сервис не оказывает юридических услуг.
          </Text>
        </View>
      </View>
    </View>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12, minWidth: 140 }}>
      <Text
        style={{
          color: overlay.white70,
          fontSize: 11,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        {title}
      </Text>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[36px] justify-center"
    >
      <Text style={{ color: colors.white, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}
