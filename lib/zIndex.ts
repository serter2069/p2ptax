export const Z = {
  BASE: 0,
  CARD: 1,
  BADGE: 2,
  STICKY: 10,
  POPOVER: 100,
  DRAG: 200,
  MODAL: 1000,
  TOAST: 2000,
} as const;

export const ELEV = {
  CARD: 1,
  RAISED: 4,
  STICKY: 4,
  POPOVER: 8,
  MODAL: 16,
} as const;

export type LayerName = keyof typeof Z;

const PAIRED_ELEV: Record<LayerName, number> = {
  BASE: 0,
  CARD: ELEV.CARD,
  BADGE: ELEV.CARD,
  STICKY: ELEV.STICKY,
  POPOVER: ELEV.POPOVER,
  DRAG: ELEV.POPOVER,
  MODAL: ELEV.MODAL,
  TOAST: ELEV.MODAL,
};

export function layer(name: LayerName): { zIndex: number; elevation: number } {
  return { zIndex: Z[name], elevation: PAIRED_ELEV[name] };
}
