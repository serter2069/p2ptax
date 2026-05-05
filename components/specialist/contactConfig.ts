import {
  Phone, Mail, Send, MessageCircle, MessageSquare,
  ExternalLink, Globe, type LucideIcon,
} from "lucide-react-native";
import { colors } from "@/lib/theme";

export interface ContactTypeConfig {
  label: string;
  Icon: LucideIcon;
  bg: string;
  color: string;
}

// Single source of truth for contact-channel presentation. Used by
// ContactsView (the revealed list) and SpecialistGuestLockedContacts /
// the preview chips on /profile/:id, so the icon + label stays
// consistent whether the viewer has clicked "Показать контакты" or not.
export const CONTACT_TYPE_CONFIG: Record<string, ContactTypeConfig> = {
  phone:    { label: "Телефон",   Icon: Phone,         bg: colors.accentSoft, color: colors.primary },
  email:    { label: "Email",     Icon: Mail,          bg: colors.limeSoft,   color: colors.success },
  telegram: { label: "Telegram",  Icon: Send,          bg: colors.accentSoft, color: colors.blue500 },
  whatsapp: { label: "WhatsApp",  Icon: MessageCircle, bg: colors.limeSoft,   color: colors.success },
  max:      { label: "Max",       Icon: MessageSquare, bg: colors.accentSoft, color: colors.primary },
  vk:       { label: "ВКонтакте", Icon: ExternalLink,  bg: colors.accentSoft, color: colors.blue500 },
  website:  { label: "Сайт",      Icon: Globe,         bg: colors.surface2,   color: colors.textSecondary },
};

export const DEFAULT_CONTACT_CONFIG: ContactTypeConfig = {
  label: "Контакт",
  Icon: ExternalLink,
  bg: colors.background,
  color: colors.textSecondary,
};

export function getContactConfig(type: string): ContactTypeConfig {
  return CONTACT_TYPE_CONFIG[type] ?? { ...DEFAULT_CONTACT_CONFIG, label: type };
}
