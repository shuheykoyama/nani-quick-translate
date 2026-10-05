import { closeMainWindow, getSelectedText, open, showHUD } from "@raycast/api";

const NANI_URL = "https://nani.now/ja";

export default async function Command() {
  let sourceText: string;

  try {
    sourceText = await getSelectedText();
  } catch {
    await showHUD("Select some text first");
    return;
  }

  if (!sourceText.trim()) {
    await showHUD("Select some text first");
    return;
  }

  const params = new URLSearchParams({
    raycast: sourceText,
  });

  const naniUrl = `${NANI_URL}#${params.toString()}`;

  try {
    await closeMainWindow();
    await open(naniUrl, "Arc");

    console.log("[nani-quick-translate] Opened Nani Translate in Little Arc");
  } catch (cause) {
    console.error("[nani-quick-translate] Failed to open Nani Translate:", cause);

    await showHUD("Failed to open Nani Translate");
  }
}
