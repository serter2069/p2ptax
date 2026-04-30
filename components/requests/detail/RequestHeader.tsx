import { View, Text } from "react-native";
import StatusBadge from "@/components/StatusBadge";
import { RequestDetailData } from "./types";

interface Props {
  request: RequestDetailData;
  createdDate: string;
  serviceName: string | null;
  isDesktop?: boolean;
}

export default function RequestHeader({ request, createdDate, serviceName, isDesktop }: Props) {
  return (
    <View>
      {/* Status + date */}
      <View className={`flex-row items-center mb-3 ${isDesktop ? "gap-3" : ""}`}>
        <StatusBadge status={request.status} />
        <Text className={`text-sm text-text-mute ${isDesktop ? "" : "ml-3"}`}>{createdDate}</Text>
      </View>

      {/* Title */}
      <Text className={`font-${isDesktop ? "extrabold text-2xl" : "bold text-xl"} text-text-base ${isDesktop ? "mb-4" : "mb-3"}`}>
        {request.title}
      </Text>

      {/* Unified FNS · service chip — issue #1578.
          City already lives inside FNS name (e.g. "ИФНС №1 по г. Москве"),
          so we never include it separately. Service is appended only
          when it is actually selected. */}
      <View className={`flex-row flex-wrap gap-2 ${isDesktop ? "mb-5" : "mb-4"}`}>
        <View className="bg-white border border-border rounded-lg px-2.5 py-1">
          <Text className={`text-xs ${isDesktop ? "font-medium" : ""} text-text-base`}>
            {request.fns.name}
            {serviceName ? ` · ${serviceName}` : ""}
          </Text>
        </View>
      </View>
    </View>
  );
}
