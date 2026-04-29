import { View, Text } from "react-native";
import { colors, textStyle } from "@/lib/theme";

interface Props {
  catalogError: string | null;
}

export default function WorkAreaIntro({ catalogError }: Props) {
  return (
    <>
      <Text
        style={{
          ...textStyle.h1,
          color: colors.text,
          fontSize: 32,
          lineHeight: 38,
          marginTop: 16,
          marginBottom: 12,
        }}
      >
        Где вы работаете?
      </Text>
      <Text
        style={{
          ...textStyle.body,
          color: colors.textSecondary,
          fontSize: 16,
          lineHeight: 24,
          marginBottom: 20,
        }}
      >
        Добавьте инспекции ФНС, в которых ведёте дела, и услуги по
        каждой. По этим данным клиенты вас найдут.
      </Text>

      {catalogError && (
        <View
          className="mb-4 px-4 py-3 rounded-xl"
          style={{ backgroundColor: colors.errorBg }}
        >
          <Text className="text-sm text-danger leading-5">
            {catalogError}
          </Text>
        </View>
      )}
    </>
  );
}
