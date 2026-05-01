import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { View, ScrollView, Animated, Easing, Platform } from "react-native";
import IntakeProgress from "./IntakeProgress";
import IntakeNav from "./IntakeNav";
import Step1DocumentType from "./Step1DocumentType";
import Step2Date from "./Step2Date";
import Step3CityFns from "./Step3CityFns";
import Step4Description from "./Step4Description";
import {
  EMPTY_INTAKE,
  INTAKE_DRAFT_KEY,
  LEGACY_DRAFT_KEYS,
  parseDateRu,
  type IntakeData,
  type DocumentType,
} from "./types";
import type { AttachedFile } from "@/components/requests/FileUploadSection";
import { draftStorage } from "@/lib/draftStorage";

type Action =
  | { type: "SET_DOC_TYPE"; value: DocumentType }
  | { type: "SET_INCIDENT_DATE"; value: string }
  | { type: "SET_URGENCY"; value: boolean }
  | { type: "SET_CITY_FNS"; cityId: string | null; fnsId: string | null }
  | { type: "SET_DESCRIPTION"; value: string }
  | { type: "SET_DISPUTED_AMOUNT"; value: string }
  | { type: "REPLACE"; value: IntakeData };

function reducer(state: IntakeData, action: Action): IntakeData {
  switch (action.type) {
    case "SET_DOC_TYPE":
      return { ...state, documentType: action.value };
    case "SET_INCIDENT_DATE":
      return { ...state, incidentDate: action.value };
    case "SET_URGENCY":
      return { ...state, urgency: action.value };
    case "SET_CITY_FNS":
      return { ...state, cityId: action.cityId, fnsId: action.fnsId };
    case "SET_DESCRIPTION":
      return { ...state, description: action.value };
    case "SET_DISPUTED_AMOUNT":
      return { ...state, disputedAmount: action.value };
    case "REPLACE":
      return action.value;
  }
}

const TOTAL_STEPS = 4;

interface IntakeWizardProps {
  isAuthenticated: boolean;
  authToken: string | null;
  attachedFiles: AttachedFile[];
  onChangeAttachedFiles: (files: AttachedFile[]) => void;
  /** Submitting state — bound to the underlying API submit on step 4 nav. */
  submitting: boolean;
  /** Current data — read by parent to construct the API payload. */
  onDataChange: (d: IntakeData) => void;
  /** Called when user advances past the final step. Parent submits. */
  onSubmitRequested: () => void;
  /** When set, the wizard locks at this step (used during inline OTP). */
  lockToStep?: number;
}

/**
 * IntakeWizard — controller for the 4-step structured intake.
 *
 * Owns:
 *   - wizard data (useReducer)
 *   - current step index
 *   - draft persistence (load on mount, save on every change)
 *   - step transition animation (opacity fade — Reanimated avoided to keep
 *     the bundle lean & SSR-safe)
 *   - per-step validation gating the "Далее" button
 *
 * Does NOT own:
 *   - API submission (parent handles it via onSubmitRequested + onDataChange)
 *   - OTP flow (parent embeds InlineOtpFlow under the wizard)
 *   - file upload (parent owns AttachedFile[]; we pass through to step 4)
 */
export default function IntakeWizard({
  isAuthenticated,
  authToken,
  attachedFiles,
  onChangeAttachedFiles,
  submitting,
  onDataChange,
  onSubmitRequested,
  lockToStep,
}: IntakeWizardProps) {
  const [data, dispatch] = useReducer(reducer, EMPTY_INTAKE);
  const [step, setStep] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Hydrate from draft on first mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Drop any legacy free-text drafts so they don't shadow this key.
        for (const k of LEGACY_DRAFT_KEYS) {
          await draftStorage.del(k).catch(() => {});
        }
        const raw = await draftStorage.get(INTAKE_DRAFT_KEY);
        if (!raw || cancelled) return;
        const parsed = JSON.parse(raw) as Partial<IntakeData> & {
          step?: number;
        };
        const merged: IntakeData = {
          documentType: parsed.documentType ?? null,
          incidentDate: parsed.incidentDate ?? "",
          urgency: !!parsed.urgency,
          cityId: parsed.cityId ?? null,
          fnsId: parsed.fnsId ?? null,
          description: parsed.description ?? "",
          disputedAmount: parsed.disputedAmount ?? "",
        };
        dispatch({ type: "REPLACE", value: merged });
        if (typeof parsed.step === "number" && parsed.step >= 1 && parsed.step <= TOTAL_STEPS) {
          setStep(parsed.step);
        }
      } catch {
        /* ignore corrupt draft */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Bubble data up.
  useEffect(() => {
    onDataChange(data);
  }, [data, onDataChange]);

  // Persist draft on every change after hydration.
  useEffect(() => {
    if (!hydrated) return;
    const isEmpty =
      !data.documentType &&
      !data.incidentDate &&
      !data.cityId &&
      !data.fnsId &&
      !data.description &&
      !data.disputedAmount;
    if (isEmpty) return;
    const payload = JSON.stringify({ ...data, step });
    draftStorage.set(INTAKE_DRAFT_KEY, payload).catch(() => {});
  }, [hydrated, data, step]);

  const isStepValid = useMemo(() => {
    if (step === 1) return !!data.documentType;
    if (step === 2) {
      // For TREBOVANIE / RESHENIE / VYEZDNAYA the date is required so the
      // deadline / visit-date math has meaning; OTHER also requires it so
      // the specialist sees a timeline.
      return !!data.incidentDate && !!parseDateRu(_formatBack(data.incidentDate));
    }
    if (step === 3) return !!data.cityId && !!data.fnsId;
    if (step === 4) {
      const len = data.description.trim().length;
      return len >= 10 && len <= 2000;
    }
    return false;
  }, [step, data]);

  const goNext = () => {
    if (lockToStep !== undefined) return;
    if (!isStepValid) return;
    if (step >= TOTAL_STEPS) {
      onSubmitRequested();
      return;
    }
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goBack = () => {
    if (lockToStep !== undefined) return;
    if (step <= 1) return;
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
    setStep((s) => Math.max(1, s - 1));
  };

  const visibleStep = lockToStep ?? step;

  return (
    <View className="flex-1">
      <IntakeProgress step={visibleStep} total={TOTAL_STEPS} />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {visibleStep === 1 && (
              <Step1DocumentType
                value={data.documentType}
                onChange={(v) => dispatch({ type: "SET_DOC_TYPE", value: v })}
              />
            )}
            {visibleStep === 2 && (
              <Step2Date
                documentType={data.documentType}
                incidentDate={data.incidentDate}
                urgency={data.urgency}
                onChangeIncidentDate={(v) =>
                  dispatch({ type: "SET_INCIDENT_DATE", value: v })
                }
                onChangeUrgency={(v) =>
                  dispatch({ type: "SET_URGENCY", value: v })
                }
              />
            )}
            {visibleStep === 3 && (
              <Step3CityFns
                cityId={data.cityId}
                fnsId={data.fnsId}
                onChange={(cityId, fnsId) =>
                  dispatch({ type: "SET_CITY_FNS", cityId, fnsId })
                }
              />
            )}
            {visibleStep === 4 && (
              <Step4Description
                documentType={data.documentType}
                description={data.description}
                disputedAmount={data.disputedAmount}
                files={attachedFiles}
                authToken={authToken}
                isAuthenticated={isAuthenticated}
                submitting={submitting}
                onChangeDescription={(v) =>
                  dispatch({ type: "SET_DESCRIPTION", value: v })
                }
                onChangeDisputedAmount={(v) =>
                  dispatch({ type: "SET_DISPUTED_AMOUNT", value: v })
                }
                onChangeFiles={onChangeAttachedFiles}
              />
            )}
          </Animated.View>
        </View>
      </ScrollView>
      {lockToStep === undefined && (
        <IntakeNav
          step={step}
          total={TOTAL_STEPS}
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!isStepValid}
          submitting={submitting}
        />
      )}
    </View>
  );
}

/**
 * Step 2 stores ISO; this rebuilds the dd.mm.yyyy string and re-parses to
 * confirm validity. Avoids re-implementing format detection in two places.
 */
function _formatBack(iso: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[3]}.${m[2]}.${m[1]}`;
}
