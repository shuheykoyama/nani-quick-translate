// ==UserScript==
// @name         Nani Quick Translate
// @namespace    nani-quick-translate
// @version      2.1.1
// @description  Insert selected text from Raycast into Nani Translate and start translation
// @match        https://nani.now/*
// @inject-into  page
// @run-at       document-start
// @noframes
// ==/UserScript==

(() => {
  const TIMEOUT_MS = 30_000;

  const params = new URLSearchParams(location.hash.slice(1));

  const sourceText = params.get("raycast");

  if (!sourceText) {
    return;
  }

  // The fragment contains the selected text, so remove it as soon as
  // the userscript has captured the value.
  history.replaceState(history.state, "", `${location.pathname}${location.search}`);

  const startedAt = performance.now();

  const timedOut = () => performance.now() - startedAt > TIMEOUT_MS;

  const getTextarea = () => document.querySelector('textarea[data-main-input="true"]');

  const getTranslateButton = () =>
    [...document.querySelectorAll("button")].find((button) => button.textContent.trim() === "翻訳する");

  const isNaniInputHydrated = (textarea) => {
    /*
     * Current Nani Translate installs an own `value` accessor after its
     * React-controlled input is ready. Inserting text before this
     * point does not reliably update Nani Translate's internal state.
     */
    const descriptor = Object.getOwnPropertyDescriptor(textarea, "value");

    return typeof descriptor?.get === "function" && typeof descriptor?.set === "function";
  };

  const submitWhenReady = () => {
    if (timedOut()) {
      console.error("[nani-quick-translate] Timed out waiting for translate button");
      return;
    }

    const button = getTranslateButton();

    if (!(button instanceof HTMLButtonElement) || button.disabled) {
      requestAnimationFrame(submitWhenReady);
      return;
    }

    console.log("[nani-quick-translate] Starting translation");

    button.click();
  };

  const insertWhenReady = () => {
    if (timedOut()) {
      console.error("[nani-quick-translate] Timed out waiting for textarea");
      return;
    }

    const textarea = getTextarea();

    if (!(textarea instanceof HTMLTextAreaElement) || !isNaniInputHydrated(textarea)) {
      requestAnimationFrame(insertWhenReady);
      return;
    }

    textarea.focus();

    textarea.setSelectionRange(0, textarea.value.length);

    /*
     * Setting `textarea.value` and dispatching an input event did
     * not update Nani Translate's React state in testing. `insertText` is the
     * compatibility path verified to work with the current Nani Translate UI.
     */
    const success = document.execCommand("insertText", false, sourceText);

    if (!success || textarea.value !== sourceText) {
      console.error("[nani-quick-translate] Failed to insert text");
      return;
    }

    console.log("[nani-quick-translate] Source text inserted");

    submitWhenReady();
  };

  requestAnimationFrame(insertWhenReady);
})();
