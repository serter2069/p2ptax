import { ContactMethodItem } from "@/components/settings/ContactMethodsList";
import AboutSection from "@/components/settings/specialist/AboutSection";
import FnsServicesSection, {
  FnsServiceItem,
} from "@/components/settings/specialist/FnsServicesSection";
import ContactsEditor from "@/components/settings/specialist/ContactsEditor";
import OfficeSection from "@/components/settings/specialist/OfficeSection";
import DisabledNotice from "@/components/settings/specialist/DisabledNotice";

interface SpecialistProfileData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAvailable: boolean;
  profile: {
    description: string | null;
    phone: string | null;
    telegram: string | null;
    whatsapp: string | null;
    officeAddress: string | null;
    workingHours: string | null;
  } | null;
  fnsServices: FnsServiceItem[];
}

interface SpecialistTabProps {
  isSpecialistUser: boolean;
  specLoading: boolean;
  specData: SpecialistProfileData | null;
  description: string;
  officeAddress: string;
  workingHours: string;
  contacts: ContactMethodItem[];
  addingContact: boolean;
  newContactType: string;
  newContactValue: string;
  contactSaving: boolean;
  showTypePicker: boolean;
  onDescriptionChange: (v: string) => void;
  onOfficeAddressChange: (v: string) => void;
  onWorkingHoursChange: (v: string) => void;
  onContactsChange: (items: ContactMethodItem[]) => void;
  onAddingContactChange: (v: boolean) => void;
  onNewContactTypeChange: (v: string) => void;
  onNewContactValueChange: (v: string) => void;
  onContactSavingChange: (v: boolean) => void;
  onShowTypePickerChange: (v: boolean) => void;
  onGoToProfileTab: () => void;
  onGoToWorkArea: () => void;
  /** Fires when an About / Office input loses focus — used by autosave. */
  onSpecialistBlur?: () => void;
}

export default function SpecialistTab({
  isSpecialistUser,
  specLoading,
  specData,
  description,
  officeAddress,
  workingHours,
  contacts,
  addingContact,
  newContactType,
  newContactValue,
  contactSaving,
  showTypePicker,
  onDescriptionChange,
  onOfficeAddressChange,
  onWorkingHoursChange,
  onContactsChange,
  onAddingContactChange,
  onNewContactTypeChange,
  onNewContactValueChange,
  onContactSavingChange,
  onShowTypePickerChange,
  onGoToProfileTab,
  onGoToWorkArea,
  onSpecialistBlur,
}: SpecialistTabProps) {
  if (!isSpecialistUser) {
    return <DisabledNotice onGoToProfileTab={onGoToProfileTab} />;
  }

  return (
    <>
      <FnsServicesSection
        specLoading={specLoading}
        fnsServices={specData?.fnsServices}
        onGoToWorkArea={onGoToWorkArea}
      />
      <AboutSection
        description={description}
        onChange={onDescriptionChange}
        onBlur={onSpecialistBlur}
      />
      <ContactsEditor
        contacts={contacts}
        addingContact={addingContact}
        newContactType={newContactType}
        newContactValue={newContactValue}
        contactSaving={contactSaving}
        showTypePicker={showTypePicker}
        onContactsChange={onContactsChange}
        onAddingContactChange={onAddingContactChange}
        onNewContactTypeChange={onNewContactTypeChange}
        onNewContactValueChange={onNewContactValueChange}
        onContactSavingChange={onContactSavingChange}
        onShowTypePickerChange={onShowTypePickerChange}
      />
      <OfficeSection
        officeAddress={officeAddress}
        workingHours={workingHours}
        onOfficeAddressChange={onOfficeAddressChange}
        onWorkingHoursChange={onWorkingHoursChange}
        onBlur={onSpecialistBlur}
      />
    </>
  );
}

export type { SpecialistProfileData, FnsServiceItem };
