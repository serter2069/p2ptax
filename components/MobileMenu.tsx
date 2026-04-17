import { View, Text, Pressable, Modal } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useAuth } from "@/contexts/AuthContext";

const MENU_ITEMS: { label: string; route: string; icon: React.ComponentProps<typeof FontAwesome>["name"] }[] = [
  { label: "Home", route: "/(tabs)", icon: "home" },
  { label: "Search", route: "/(tabs)/search", icon: "search" },
  { label: "Create", route: "/(tabs)/create", icon: "plus-square" },
  { label: "Messages", route: "/(tabs)/messages", icon: "comments" },
  { label: "Profile", route: "/(tabs)/profile", icon: "user" },
  { label: "Settings", route: "/settings", icon: "cog" },
  { label: "Help", route: "/settings", icon: "question-circle-o" },
];

interface MobileMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function MobileMenu({ visible, onClose }: MobileMenuProps) {
  const { isAuthenticated, user, signOut } = useAuth();
  const router = useRouter();

  const handleNavigate = (route: string) => {
    onClose();
    router.push(route as never);
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
    router.replace("/(auth)/email" as never);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 flex-row bg-black/50">
        {/* Menu panel */}
        <Pressable className="w-72 bg-white h-full" onPress={() => {}}>
          {/* User info */}
          <View className="pt-14 pb-6 px-5 bg-blue-600">
            {isAuthenticated ? (
              <>
                <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mb-3">
                  <Text className="text-2xl font-bold text-white">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </Text>
                </View>
                <Text className="text-lg font-bold text-white">
                  {user?.name || "User"}
                </Text>
                <Text className="text-sm text-blue-100 mt-0.5">{user?.email}</Text>
              </>
            ) : (
              <>
                <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mb-3">
                  <FontAwesome name="user" size={24} color="#ffffff" />
                </View>
                <Text className="text-lg font-bold text-white">Guest</Text>
                <Text className="text-sm text-blue-100 mt-0.5">Sign in to continue</Text>
              </>
            )}
          </View>

          {/* Close button */}
          <Pressable onPress={onClose} className="absolute top-12 right-3 w-8 h-8 items-center justify-center">
            <FontAwesome name="times" size={20} color="#ffffff" />
          </Pressable>

          {/* Menu items */}
          <View className="flex-1 pt-2">
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => handleNavigate(item.route)}
                className="flex-row items-center px-5 py-3.5 active:bg-gray-50"
              >
                <View className="w-8 items-center">
                  <FontAwesome name={item.icon} size={18} color="#6b7280" />
                </View>
                <Text className="text-base text-gray-800 ml-3">{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Bottom actions */}
          <View className="border-t border-gray-100 px-5 py-4 pb-8">
            {isAuthenticated ? (
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center py-3"
              >
                <FontAwesome name="sign-out" size={18} color="#ef4444" />
                <Text className="text-base font-medium text-red-500 ml-3">Log out</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => handleNavigate("/(auth)/email")}
                className="h-12 rounded-xl bg-blue-600 items-center justify-center"
              >
                <Text className="text-base font-semibold text-white">Sign In</Text>
              </Pressable>
            )}
          </View>
        </Pressable>

        {/* Tap outside area */}
        <Pressable onPress={onClose} className="flex-1" />
      </Pressable>
    </Modal>
  );
}
