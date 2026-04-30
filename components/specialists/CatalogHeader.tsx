import { View, Text } from "react-native";
import { colors } from "@/lib/theme";
import { pluralizeRu } from "@/lib/ru";
import PageTitle from "@/components/layout/PageTitle";

interface Props {
  isDesktop: boolean;
  count: number | null;
}

export default function CatalogHeader({ isDesktop, count }: Props) {
  const subtitle =
    count !== null && count > 0
      ? `${count} ${pluralizeRu(count, ["специалист", "специалиста", "специалистов"])}`
      : undefined;
  return (
    <PageTitle title="Специалисты" subtitle={subtitle} />
  );
}
