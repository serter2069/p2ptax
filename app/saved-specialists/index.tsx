import SpecialistFeed from "@/components/specialists/SpecialistFeed";
import { useNoIndex } from "@/components/seo/NoIndex";

export default function SavedSpecialistsScreen() {
  useNoIndex();
  return <SpecialistFeed mode="favorites" title="Мои специалисты" />;
}
