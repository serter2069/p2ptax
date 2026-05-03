import { View, Text, Pressable, Linking } from "react-native";
import {
  Phone, Mail, Send, MessageCircle, MessageSquare,
  ExternalLink, Globe, ChevronRight, MapPin, Clock, type LucideIcon,
} from "lucide-react-native";
import { colors } from "@/lib/theme";
import type { ContactMethodItem } from "./types";

interface ContactsSectionProps {
  contacts: ContactMethodItem[];
  officeAddress: string | null;
  workingHours: string | null;
  cardShadow: object;
}

function getContactUrl(type: string, value: string): string | null {
  switch (type) {
    case "phone":
      return `tel:${value}`;
    case "email":
      return `mailto:${value}`;
    case "telegram":
      return `https://t.me/${value.replace("@", "")}`;
    case "whatsapp":
      return `https://wa.me/${value.replace(/\D/g, "")}`;
    case "max":
      // Max messenger uses tel: deeplink (sticks to the user's number).
      return `tel:${value.replace(/\D/g, "")}`;
    case "vk":
      return value.startsWith("http") ? value : `https://vk.com/${value.replace(/^vk\.com\//, "")}`;
    case "website":
      return value.startsWith("http") ? value : `https://${value}`;
    default:
      return null;
  }
}

const CONTACT_TYPE_CONFIG: Record<string, { label: string; Icon: LucideIcon; bg: string; color: string }> = {
  phone: { label: "Телефон", Icon: Phone, bg: colors.accentSoft, color: colors.primary },
  email: { label: "Email", Icon: Mail, bg: colors.limeSoft, color: colors.success },
  telegram: { label: "Telegram", Icon: Send, bg: colors.accentSoft, color: colors.blue500 },
  whatsapp: { label: "WhatsApp", Icon: MessageCircle, bg: colors.limeSoft, color: colors.success },
  max: { label: "Max", Icon: MessageSquare, bg: colors.accentSoft, color: colors.primary },
  vk: { label: "ВКонтакте", Icon: ExternalLink, bg: colors.accentSoft, color: colors.blue500 },
  website: { label: "Сайт", Icon: Globe, bg: colors.surface2, color: colors.textSecondary },
};

export default function ContactsView({ contacts, officeAddress, workingHours, cardShadow }: ContactsSectionProps) {
  const hasContacts = contacts.length > 0 || officeAddress || workingHours;

  if (!hasContacts) return null;

  return (
    <View
      className="bg-white rounded-2xl border border-slate-100 p-4 mx-4 mt-4"
      style={cardShadow}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 12, letterSpacing: 3, marginBottom: 8 }}>
        КОНТАКТЫ
      </Text>

      {contacts.map((contact, index) => {
        const cfg = CONTACT_TYPE_CONFIG[contact.type] || {
          label: contact.type,
          Icon: ExternalLink,
          bg: colors.background,
          color: colors.textSecondary,
        };
        const url = getContactUrl(contact.type, contact.value);
        const isLast =
          index === contacts.length - 1 &&
          !officeAddress &&
          !workingHours;

        if (url) {
          return (
            <Pressable
              accessibilityRole="button"
              key={contact.id}
              accessibilityLabel={`${cfg.label} ${contact.value}`}
              onPress={() => Linking.openURL(url)}
              className={`flex-row items-center py-2.5 ${isLast ? "" : "border-b border-slate-100"}`}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: cfg.bg }}
              >
                <cfg.Icon size={14} color={cfg.color} />
              </View>
              <View className="flex-1">
                <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>{cfg.label}</Text>
                <Text className="text-sm font-medium" style={{ color: cfg.color }}>
                  {contact.value}
                </Text>
              </View>
              <ChevronRight size={12} color={colors.borderLight} />
            </Pressable>
          );
        }
        return (
          <View
            key={contact.id}
            className={`flex-row items-center py-2.5 ${isLast ? "" : "border-b border-slate-100"}`}
          >
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: cfg.bg }}
            >
              <cfg.Icon size={14} color={cfg.color} />
            </View>
            <View className="flex-1">
              <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>{cfg.label}</Text>
              <Text className="text-sm font-medium" style={{ color: colors.text }}>{contact.value}</Text>
            </View>
          </View>
        );
      })}

      {officeAddress && (
        <View className={`flex-row items-start py-2.5 ${workingHours ? "border-b border-slate-100" : ""}`}>
          <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.surface2 }}>
            <MapPin size={14} color={colors.textSecondary} />
          </View>
          <View className="flex-1">
            <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>Адрес офиса</Text>
            <Text className="text-sm leading-5" style={{ color: colors.text }}>
              {officeAddress}
            </Text>
          </View>
        </View>
      )}

      {workingHours && (
        <View className="flex-row items-center py-2.5">
          <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.surface2 }}>
            <Clock size={14} color={colors.textSecondary} />
          </View>
          <View className="flex-1">
            <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>Часы работы</Text>
            <Text className="text-sm" style={{ color: colors.text }}>
              {workingHours}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
