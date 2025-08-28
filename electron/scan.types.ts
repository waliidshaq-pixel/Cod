export type PostKind = "steam" | "epic" | "app" | "browser";
export type Post = {
  id: string;
  title: string;
  kind: PostKind;
  cover?: string;
  installed?: boolean;
  platform?: "Steam" | "Epic" | "Local";
  appid?: number;     // Steam
  appName?: string;   // Epic
  exePath?: string;   // Local
};
