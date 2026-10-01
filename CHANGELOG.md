# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-10-01

### Changed (layout)
- New layout model: consecutive inline content of a block (text, `b`, `a`, `code`, `br`, ...)
  is rendered as one flowing `<Text>`, block elements are laid out as boxes between those lines.
  Previously every text node of a `div` became its own line, and lists, tables and blockquotes
  wrapped all their content (including nested lists and images) in a single `<Text>`
- Paragraphs, headings and links that contain blocks (`<p><img></p>`, `<a><img></a>`) are laid
  out as boxes; such links are pressable
- Text styles are inherited through block elements like in CSS
  (`<div style="color: red"><p>...</p></div>` is red)
- `baseTextStyle` applies to all text and no longer resets nested elements
  (a `<span>` inside `<h1>` keeps the heading size)
- Body text defaults to `defaultTextStyle` (16/24, `#1a1a1a`) instead of React Native's 14px
- Table cell and caption text styles moved to the default `td` / `th` / `caption` tag styles,
  so they can be overridden with `tagsStyles`
- `<pre>` uses a light theme matching the default tag styles (it rendered light text on a light
  background before)

### Added
- Whitespace is collapsed like in browsers: spaces between inline elements are kept
  (`<b>a</b> <i>b</i>` rendered as "ab" before), `&nbsp;` is preserved
- `<pre>` keeps its indentation and line breaks
- Inline tags `abbr`, `cite`, `q` (with quotes), `time`, `kbd`, `samp`, `var`, `dfn`, `font`
  (`color` / `size` / `face`), `label`, `bdi`, `bdo`, `data`, `big`, `tt`, and block tags
  `dl`, `dt`, `dd`, `center`, `address`, `hgroup` (they showed the "unsupported tag" box before)
- `baseTextStyle` option for `useHtmlRenderer`

### Changed
- Tested against React 19.2, React Native 0.86 and Expo SDK 57 (New Architecture)
- Build with `react-native-builder-bob`: ESM output in `lib/module`, types in `lib/typescript`
- Added an `exports` map; deep imports into the package are no longer possible
- `htmlparser2` updated to 10.1
- Images follow `useWindowDimensions()` and adapt to rotation, split screen and foldables
  (`DEFAULT_MAX_WIDTH` is deprecated)
- Log messages use the `[react-native-html-renderer]` prefix
- Example app moved to Expo SDK 57
- Tooling: Jest 30, React Native Testing Library 14, TypeScript 6, ESLint 10 (flat config)

### Fixed
- Bare React Native (non-Expo) apps failed to bundle because Metro picked htmlparser2's
  ESM entry, which `@react-native/babel-preset` cannot compile
- `enableVirtualization`, `virtualizationThreshold` and `estimatedRowHeight` had no effect
- `errorBoundaryFallback` / `onError` did not catch errors thrown while rendering
- `textScale` was not applied (headings were overridden by default styles, other tags ignored it)
- Default `{}` / `[]` props and equal inline style objects rebuilt the plugin registry and
  re-rendered the whole tree on every parent render (plugins' `setup` ran each time)
- `<br>` was remounted on every render
- `thead` / `tbody` / `tfoot` each got their own horizontal ScrollView, misaligning columns
- Virtualized lists used estimated heights in `getItemLayout`, causing scroll jumps
- Inline CSS: multi-value `margin` / `padding`, `border` shorthand, unitless `line-height`,
  font family lists and `!important` are handled; unsupported values (`display: block`,
  `position: fixed`, `calc()`, percentage font sizes, ...) are dropped instead of being passed
  to native; `box-shadow` maps to React Native's `boxShadow`
- `findById` returned the last match instead of the first for duplicated IDs
- `defaultRenderer` in a custom renderer recursed into the same custom renderer
- `<code>` inside `<pre>` rendered a second code block inside the first one
- `<kbd>`, `<samp>` and `<tt>` use the platform monospace font
- `useHtmlParser` / `useLazyHtmlParser` re-created callbacks for equal options

## [1.0.0] - 2026-01-13

### Added
- Initial release of react-native-html-viewer
- HTML parser using htmlparser2
- AST generation and manipulation
- Full tag support: div, p, h1-h6, lists, tables, images, links, code blocks
- Inline CSS parsing and style resolution
- Custom tag styles and class styles
- Plugin system for custom renderers
- Hook-based APIs: useHtmlParser, useHtmlRenderer
- Link and image press handlers
- Text selection support
- Text scaling accessibility
- Performance optimizations: virtualization, memoization
- Full TypeScript support
- Unit test suite
- Example Expo app
