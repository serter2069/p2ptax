import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/(tabs)/my-requests" as never);
  }, []);
  return null;
}
