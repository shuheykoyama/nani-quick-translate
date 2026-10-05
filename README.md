# Nani Quick Translate

A small Raycast extension that sends selected text to Nani Translate and opens the translation in Little Arc.

## What it does

1. Select text in the frontmost application.
2. Open Raycast with `⌘ Space`.
3. Run `Translate with Nani Translate`.
4. Raycast closes and Nani Translate opens in Little Arc.
5. The selected text is inserted automatically and translation starts.

The translation stays in Nani Translate. The extension does not render or copy the result back into Raycast.

## Requirements

- macOS
- Raycast
- Arc for macOS
- Little Arc configured for links opened from other applications
- Violentmonkey installed in Arc
- Bun

This project uses the Nani Translate web interface. As of October 2026, Nani Translate does not provide a public API for external services.

## Installation

Nani Quick Translate is currently installed from source rather than through the Raycast Store.

### 1. Clone the repository

Clone the repository and enter the project directory.

### 2. Install dependencies

```sh
bun install
```

### 3. Install the Raycast extension

Run:

```sh
bun run dev
```

This imports the local extension into Raycast in development mode.

Once the extension has been imported, `Translate with Nani Translate` is available from Raycast. Run `bun run dev` again when developing or updating the extension locally.

### 4. Install the userscript

Open Violentmonkey in Arc and create a new userscript.

Replace its contents with:

```text
userscript/nani-bridge.user.js
```

Save and enable the script.

### 5. Configure Little Arc

Make sure links opened from other applications are routed to Little Arc in Arc's link settings.

If Arc is configured to route external links directly to a Space, Nani Translate will follow that routing instead.

## Usage

Select text in the frontmost application, then run:

```text
⌘ Space → Translate with Nani Translate
```

Raycast retrieves the selected text, closes its window, and opens Nani Translate in Arc. The userscript then inserts the text into Nani Translate and starts the translation automatically.

If no text is selected, Raycast shows:

```text
Select some text first
```

## How it works

The integration has two small parts.

### Raycast command

The Raycast command lives at:

```text
src/translate-selected-text.ts
```

It:

- gets the selected text from the frontmost application
- preserves the original selected text
- encodes the text into the URL fragment of `https://nani.now/ja`
- closes Raycast
- opens the URL in Arc

Whitespace is trimmed only when checking whether the selection is empty. The text sent to Nani Translate is otherwise left unchanged.

### Violentmonkey userscript

The userscript lives at:

```text
userscript/nani-bridge.user.js
```

It:

- reads the selected text from the URL fragment
- immediately removes the fragment from the current URL
- waits until Nani Translate's controlled text input is ready
- inserts the selected text
- waits until the translate button is enabled
- starts the translation

The URL fragment is used only as a bridge between the Raycast command and the userscript. URI fragments are handled by the browser and are not included in the HTTP request used to fetch the page.

There is no local callback server, custom backend, or translation-result parser.

## Known limitations

This integration depends on Nani Translate's current web UI rather than a public API. Changes to Nani Translate's DOM structure or translation controls may require updates to the userscript.

The userscript currently depends on:

```text
textarea[data-main-input="true"]
```

and the translate button whose visible text is:

```text
翻訳する
```

Text insertion uses:

```js
document.execCommand("insertText", false, sourceText);
```

`execCommand` is deprecated, but it is intentionally used here. During development, assigning `textarea.value` and dispatching an `input` event did not reliably update Nani Translate's controlled input state, while `insertText` did.

The userscript intentionally uses:

```text
@inject-into page
```

Running it with `@inject-into content` was tested and did not successfully interact with Nani Translate's controlled input.

No `@grant` directive is required.

Little Arc behavior depends on Arc's external-link routing configuration.

## Development

Install dependencies:

```sh
bun install
```

Run the extension in Raycast development mode:

```sh
bun run dev
```

Run static checks:

```sh
bun run lint
```

Build the extension:

```sh
bun run build
```

`bun.lock` is committed to the repository so that dependency resolution is reproducible. Do not commit `node_modules`.

After making changes, smoke-test the complete integration rather than only the individual pieces.

### Smoke test

- Select a short English sentence and run `Translate with Nani Translate`.
- Confirm that Little Arc opens.
- Confirm that the entire selected text is inserted.
- Confirm that translation starts automatically.
- Repeat with multiline text.
- Repeat with Japanese text.
- Run the command with no selection and confirm that `Select some text first` is shown.

Because the integration crosses Raycast, Arc, Violentmonkey, and Nani Translate's web UI, this end-to-end workflow is the most important regression check.

## License

Nani Quick Translate is licensed under the MIT License. See [`LICENSE`](LICENSE).
