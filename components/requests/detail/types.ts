export interface FileItem {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface RequestDetailData {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSING_SOON" | "CLOSED";
  isPublic: boolean;
  createdAt: string;
  lastActivityAt: string;
  extensionsCount: number;
  maxExtensions: number;
  city: { id: string; name: string };
  fns: { id: string; name: string; code: string };
  service?: { id: string; name: string } | null;
  files: FileItem[];
  threadsCount: number;
  unreadMessages: number;
}
