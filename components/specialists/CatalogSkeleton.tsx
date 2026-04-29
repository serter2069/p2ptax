import { View } from "react-native";
import LoadingState from "@/components/ui/LoadingState";

interface Props {
  count?: number;
}

export default function CatalogSkeleton({ count = 5 }: Props) {
  return (
    <View className="py-4 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="mb-3 bg-white rounded-2xl overflow-hidden border border-border"
        >
          <LoadingState variant="skeleton" lines={4} />
        </View>
      ))}
    </View>
  );
}
