import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, Platform } from "react-native";
import { colors } from "@/lib/theme";

/**
 * AvatarCropModal — web-only modal that shows the picked image inside
 * a 320×320 square viewport with a circular mask, lets the user drag
 * and zoom the image, then crops to a 512×512 JPEG blob on confirm.
 *
 * Native (iOS/Android) doesn't render this — the document picker
 * already returns a finalized image, no in-app crop UX. Native callers
 * pass the file straight to upload.
 */

interface Props {
  /** Source image — File from <input type=file> */
  file: File | null;
  visible: boolean;
  onCancel: () => void;
  onConfirm: (cropped: Blob) => void;
}

const VIEWPORT = 320;
const OUTPUT = 512;

export default function AvatarCropModal({ file, visible, onCancel, onConfirm }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  // base = minimal scale to cover the viewport (image fills the square at zoom=1)
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Read file → base64 → image dimensions
  useEffect(() => {
    if (!file) {
      setImgSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!imgSrc) return;
    const im = new window.Image();
    im.onload = () => {
      setImgSize({ w: im.naturalWidth, h: im.naturalHeight });
      // Cover the viewport with the smaller side, so the whole square
      // is filled regardless of orientation.
      const scale = VIEWPORT / Math.min(im.naturalWidth, im.naturalHeight);
      setBaseScale(scale);
    };
    im.src = imgSrc;
  }, [imgSrc]);

  const effectiveScale = baseScale * zoom;
  const renderedW = imgSize.w * effectiveScale;
  const renderedH = imgSize.h * effectiveScale;
  // Clamp offset so the image never leaves the viewport (no transparent
  // edges showing — the circular mask must always sit on the image).
  const maxOffsetX = Math.max(0, (renderedW - VIEWPORT) / 2);
  const maxOffsetY = Math.max(0, (renderedH - VIEWPORT) / 2);
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({
      x: clamp(dragRef.current.baseX + dx, -maxOffsetX, maxOffsetX),
      y: clamp(dragRef.current.baseY + dy, -maxOffsetY, maxOffsetY),
    });
  };
  const handlePointerUp = () => {
    dragRef.current = null;
  };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setZoom((z) => clamp(z + delta, 1, 4));
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !imgSize.w) return;
    // We want a 512×512 output. Compute the crop region in the source
    // image's natural pixel space.
    // Centre of viewport in image-space:
    //   cx = (imgSize.w / 2) - (offset.x / effectiveScale)
    //   cy = (imgSize.h / 2) - (offset.y / effectiveScale)
    // Half-side of the source crop in image-space:
    //   half = (VIEWPORT / 2) / effectiveScale
    const half = VIEWPORT / 2 / effectiveScale;
    const cx = imgSize.w / 2 - offset.x / effectiveScale;
    const cy = imgSize.h / 2 - offset.y / effectiveScale;
    const sx = Math.max(0, cx - half);
    const sy = Math.max(0, cy - half);
    const sSide = Math.min(half * 2, imgSize.w - sx, imgSize.h - sy);

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imgRef.current, sx, sy, sSide, sSide, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.9
    );
  };

  if (Platform.OS !== "web") return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(15, 23, 42, 0.55)",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 20,
            padding: 24,
            maxWidth: 400,
            width: "100%",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 4,
            }}
          >
            Кадрирование фото
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            Перетащите фото или используйте колесо мыши для масштабирования.
          </Text>

          {/* Crop viewport — circular mask via overlay; the image is a
              child <img> positioned absolutely and dragged/zoomed via
              pointer events. */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            style={{
              width: VIEWPORT,
              height: VIEWPORT,
              position: "relative",
              overflow: "hidden",
              borderRadius: VIEWPORT / 2,
              backgroundColor: colors.surface2,
              border: `1px solid ${colors.border}`,
              cursor: dragRef.current ? "grabbing" : "grab",
              touchAction: "none",
              userSelect: "none",
            }}
          >
            {imgSrc && (
              <img
                ref={imgRef}
                src={imgSrc}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  width: renderedW,
                  height: renderedH,
                  left: (VIEWPORT - renderedW) / 2 + offset.x,
                  top: (VIEWPORT - renderedH) / 2 + offset.y,
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          {/* Zoom slider */}
          <input
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{
              width: VIEWPORT,
              marginTop: 16,
              accentColor: colors.primary,
            }}
          />

          <View style={{ flexDirection: "row", gap: 8, marginTop: 20, width: "100%" }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Отмена"
              onPress={onCancel}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: "500" }}>
                Отмена
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Сохранить"
              onPress={handleConfirm}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 15, color: colors.white, fontWeight: "600" }}>
                Сохранить
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
