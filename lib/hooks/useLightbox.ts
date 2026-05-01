import { useState, useCallback } from "react";
import { API_URL } from "@/lib/api";

export interface LightboxItem {
  url: string;
  filename: string;
  mimeType: string;
}

interface FileAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface UseLightboxResult {
  lightbox: LightboxItem | null;
  handleFilePress: (file: FileAttachment) => void;
  handleImagePress: (url: string, filename: string) => void;
  closeLightbox: () => void;
}

export function useLightbox(): UseLightboxResult {
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  const handleFilePress = useCallback((file: FileAttachment) => {
    const fullUrl = file.url.startsWith("http") ? file.url : `${API_URL}${file.url}`;
    setLightbox({ url: fullUrl, filename: file.filename, mimeType: file.mimeType });
  }, []);

  const handleImagePress = useCallback((url: string, filename: string) => {
    const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
    setLightbox({ url: fullUrl, filename, mimeType: "image/jpeg" });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
  }, []);

  return { lightbox, handleFilePress, handleImagePress, closeLightbox };
}
