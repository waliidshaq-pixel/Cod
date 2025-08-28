// ==== Tilføj/ret i electron/epic.ts ====

/** Returnér login-status (stub – udbyg hvis du bygger rigtig OAuth) */
export async function status(): Promise<{ loggedIn: boolean; user?: string }> {
  // behold din eksisterende implementering hvis du har en – ellers bare denne:
  return { loggedIn: true, user: "Epic User" };
}

/** Log ind i Epic (stub) */
export async function login(): Promise<boolean> {
  // TODO: åbn Epic launcher / OAuth flow hvis du vil
  return true;
}

/** Log ud af Epic (stub) */
export async function logout(): Promise<boolean> {
  return true;
}

/** List alle Epic-spil i bibliotek (installeret + ikke installeret) */
export async function listLibrary(): Promise<{ title: string; appName: string; installed: boolean }[]> {
  // behold din egen implementering – her er en tom som fallback
  return [];
}

/** List kun installerede Epic-spil lokalt */
export async function listInstalled(): Promise<{ title: string; appName: string; installed: boolean }[]> {
  // behold din egen implementering – tom fallback:
  return [];
}

/** Launch et Epic-spil via appName */
export async function launch(appName: string): Promise<boolean> {
  // Start Epic + launch appName (f.eks. via com.epicgames.launcher://apps/<appName>?action=launch)
  try {
    const { exec } = await import("node:child_process");
    exec(`start "" "com.epicgames.launcher://apps/${appName}?action=launch"`);
    return true;
  } catch {
    return false;
  }
}

/** Installér et Epic-spil via appName */
export async function install(appName: string): Promise<boolean> {
  try {
    const { exec } = await import("node:child_process");
    exec(`start "" "com.epicgames.launcher://apps/${appName}?action=install"`);
    return true;
  } catch {
    return false;
  }
}

/** Afinstallér et Epic-spil via appName */
export async function uninstall(appName: string): Promise<boolean> {
  try {
    const { exec } = await import("node:child_process");
    exec(`start "" "com.epicgames.launcher://apps/${appName}?action=uninstall"`);
    return true;
  } catch {
    return false;
  }
}
