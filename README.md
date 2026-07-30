# NovelForge

NovelForge is a Chrome extension that turns web novels into downloadable EPUB
3 books. It provides a single workflow for inspecting a novel, choosing its
content, editing its metadata, and creating an offline ebook.

The extension uses a site-adapter architecture so support for new sources can
be added without coupling the user interface or EPUB generator to a particular
website.

## Features

- Reads novel metadata, volumes, and chapters from Hako/docln, UU看書 (`uukanshu.cc`), and Novel543.
- Joins chapters split across multiple Novel543 pages before packaging them.
- Lets you edit the title, author, description, tags, and cover.
- Supports selecting complete volumes or individual chapters.
- Preserves the original reading order.
- Uses a configurable delay between chapter requests.
- Handles source-specific protected content through site adapters.
- Downloads chapter images for offline reading.
- Packages metadata, navigation, cover art, chapters, and images into one EPUB
  3 file.
- Continues producing a usable ebook when a non-essential remote image cannot
  be downloaded.

## Requirements

- Node.js
- pnpm
- Google Chrome or another Chromium-based browser

## Development

Install the dependencies:

```bash
pnpm install
```

Start the development build:

```bash
pnpm dev
```

Open `chrome://extensions`, enable **Developer mode**, select
**Load unpacked**, and choose the generated `dist` directory. CRXJS updates the
extension while the development server is running.

## Usage

1. Open a novel page from a supported source.
2. Select the NovelForge icon from the browser toolbar.
3. Review and edit the detected book information.
4. Choose the volumes and chapters to include.
5. Adjust the delay between chapter requests if needed.
6. Generate and download the EPUB.

NovelForge performs the crawl from its configuration tab. You may switch to
another tab during the process, but keep the configuration tab open until the
download is complete.

## Validation and production build

Run the complete validation pipeline:

```bash
pnpm check
```

This command runs:

1. The Node test suite.
2. Oxlint.
3. The TypeScript type-check.
4. The production build.

Each stage can also be run separately:

```bash
pnpm test
pnpm lint
pnpm build
```

After a successful production build, load the `dist` directory as an unpacked
extension.

The repository uses UTF-8, LF line endings, two-space indentation, and final
newlines as configured in `.editorconfig`.

## Architecture

NovelForge separates generic application behavior from source-specific parsing.

```text
Browser action
    ↓
Configuration UI
    ↓
Workflow hooks
    ↓
Browser and crawl services
    ├── Site adapter registry → Source-specific adapters
    └── EPUB builder
```

- **Components** render the interface and bind user actions.
- **Hooks** manage state and workflow transitions.
- **Services** coordinate browser APIs and chapter crawling.
- **Site adapters** recognize URLs, read book metadata, enumerate chapters, and
  parse chapter content.
- **The EPUB module** builds standards-based book documents and packages their
  assets.

Source-specific selectors, URL rules, decoding, and HTML cleanup belong inside
the relevant adapter. Generic hooks, components, and crawl services must not
branch on website domains.

## Adding a source

The adapter contract is defined in `src/sites/types.ts`, and available adapters
are registered in `src/sites/registry.ts`.

To add another source:

1. Create a source module that implements `SiteAdapter`.
2. Implement URL recognition and normalization.
3. Implement book metadata and chapter-list extraction.
4. Implement chapter fetching and content parsing.
5. Register the adapter in `src/sites/registry.ts`.
6. Add the required origins to `host_permissions` in `manifest.config.ts`.
7. Add tests for URL validation, metadata, chapter ordering, and content
   parsing.

Keep all source-specific behavior inside the adapter module. Shared behavior
should only be promoted to a generic module when it has the same semantics for
multiple sources.

## Project structure

```text
.
├── public/
│   └── icons/         Product logo and browser extension icons
├── src/
│   ├── components/    Feature-based user interface
│   ├── hooks/         Application state and workflows
│   ├── services/      Browser integration and crawl orchestration
│   ├── sites/         Adapter contract and registry
│   ├── epub/          EPUB documents, assets, and ZIP packaging
│   ├── App.tsx        Configuration page
│   ├── background.ts  Browser action entry point
│   ├── config.ts      Shared configuration and defaults
│   └── types.ts       Shared application types
└── tests/             Framework-independent module tests
```

Internal imports use the `~/` alias. The Node test runner registers the same
alias through `tests/register-alias.mjs`.

## Technology

- React
- TypeScript
- Vite
- CRXJS
- JSZip
- Chrome Manifest V3

## License

Copyright (C) 2026 Trịnh Ngọc Sơn.

NovelForge is free software licensed under the GNU General Public License,
version 3 or later. See [LICENSE](LICENSE).
