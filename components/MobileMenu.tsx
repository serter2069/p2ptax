import { View, Text, Pressable, Modal } from "react-native";
import { useTypedRouter } from "@/lib/navigation";
import { User, X, Settings, LogOut } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/lib/theme";
import { buildUserItems } from "@/lib/nav-items";

interface MobileMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function MobileMenu({ visible, onClose }: MobileMenuProps) {
  const { isAuthenticated, user, isSpecialistUser, signOut } = useAuth();
  const nav = useTypedRouter();

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "Профиль";
  const initials = user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  // Role-aware nav: authenticated users get items per their role.
  // Unauthenticated users see only Settings and no role-specific items.
  const navItems = isAuthenticated ? buildUserItems(isSpecialistUser) : [];

  const handleNavigate = (route: string) => {
    onClose();
    nav.any(route);
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
    nav.replaceRoutes.login();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="Закрыть меню" onPress={onClose} className="flex-1 flex-row bg-black/50">
        <Pressable accessibilityRole="button" accessibilityLabel="Панель меню" className="w-72 bg-white h-full" onPress={() => {}}>
          {/* User info */}
          <View className="pt-14 pb-6 px-5 bg-accent">
            {isAuthenticated ? (
              <>
                <View className="w-14 h-14 rounded-full bg-surface2 items-center justify-center mb-3">
                  <Text className="text-2xl font-bold text-accent">{initials}</Text>
                </View>
                <Text className="text-lg font-bold text-white">{displayName}</Text>
                <Text className="text-sm text-accent-soft mt-0.5">{user?.email}</Text>
              </>
            ) : (
              <>
                <View className="w-14 h-14 rounded-full bg-surface2 items-center justify-center mb-3">
                  <User size={24} color={colors.primary} />
                </View>
                <Text className="text-lg font-bold text-white">Гость</Text>
                <Text className="text-sm text-accent-soft mt-0.5">Войдите для продолжения</Text>
              </>
            )}
          </View>

          {/* Close button */}
          <Pressable accessibilityRole="button" accessibilityLabel="Закрыть меню" onPress={onClose} className="absolute top-12 right-3 w-11 h-11 items-center justify-center">
            <X size={20} color={colors.surface} />
          </Pressable>

          {/* Menu items — role-aware via buildUserItems */}
          <View className="flex-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={item.href}
                  accessibilityLabel={item.label}
                  onPress={() => handleNavigate(item.href)}
                  className="flex-row items-center px-5 py-3.5 active:bg-surface2"
                >
                  <View className="w-8 items-center">
                    <Icon size={18} color={colors.textSecondary} />
                  </View>
                  <Text className="text-base text-text-base ml-3">{item.label}</Text>
                </Pressable>
              );
            })}
            {/* Settings always present */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Настройки"
              onPress={() => handleNavigate("/settings")}
              className="flex-row items-center px-5 py-3.5 active:bg-surface2"
            >
              <View className="w-8 items-center">
                <Settings size={18} color={colors.textSecondary} />
              </View>
              <Text className="text-base text-text-base ml-3">Настройки</Text>
            </Pressable>
          </View>

          {/* Bottom actions */}
          <View className="border-t border-border px-5 py-4 pb-8">
            {isAuthenticated ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Выйти" onPress={handleLogout} className="flex-row items-center py-3">
                <LogOut size={18} color={colors.error} />
                <Text className="text-base font-medium text-danger ml-3">Выйти</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Войти"
                onPress={() => handleNavigate("/login")}
                className="h-12 rounded-xl bg-accent items-center justify-center"
              >
                <Text className="text-base font-semibold text-white">Войти</Text>
              </Pressable>
            )}
          </View>
        </Pressable>

        <Pressable accessibilityRole="button" accessibilityLabel="Закрыть меню" onPress={onClose} className="flex-1" />
      </Pressable>
    </Modal>
  );
}
