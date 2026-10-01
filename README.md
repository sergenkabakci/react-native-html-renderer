# @sergenkabakci/react-native-html-renderer

A performant HTML rendering library for React Native using native components instead of WebView.

[![npm version](https://img.shields.io/npm/v/@sergenkabakci/react-native-html-renderer.svg)](https://www.npmjs.com/package/@sergenkabakci/react-native-html-renderer)
[![license](https://img.shields.io/npm/l/@sergenkabakci/react-native-html-renderer.svg)](https://github.com/sergenkabakci/react-native-html-renderer/blob/main/LICENSE)

## Features

- ✅ **Native Rendering** - Pure React Native components, no WebView
- ✅ **Full Tag Support** - div, p, h1-h6, lists, tables, images, links, code blocks
- ✅ **Custom Styling** - Tag styles, class styles, inline CSS parsing
- ✅ **Plugin System** - Extensible with custom tag handlers
- ✅ **Performance** - Virtualization, memoization, minimal re-renders
- ✅ **TypeScript** - Full type definitions included
- ✅ **React 19** - Tested with React 19.2, React Native 0.86 and Expo SDK 57 (New Architecture)
- ✅ **Cross-Platform** - iOS and Android support

## Installation

```bash
npm install @sergenkabakci/react-native-html-renderer
# or
yarn add @sergenkabakci/react-native-html-renderer
```

### Dependencies

This library requires `htmlparser2` which is included as a dependency.

## Quick Start

```tsx
import { HTMLRenderer } from '@sergenkabakci/react-native-html-renderer';

function MyComponent() {
  return (
    <HTMLRenderer
      html="<p>Hello <strong>World</strong>!</p>"
    />
  );
}
```

## API Reference

### HTMLRenderer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `html` | `string` | required | HTML content to render |
| `tagsStyles` | `Record<string, Style>` | `{}` | Custom styles for HTML tags |
| `classesStyles` | `Record<string, Style>` | `{}` | Custom styles for CSS classes |
| `renderers` | `RenderersMap` | `{}` | Custom component renderers |
| `onLinkPress` | `(url, node) => void` | - | Link press handler |
| `onImagePress` | `(src, node) => void` | - | Image press handler |
| `baseTextStyle` | `TextStyle` | - | Base style for text elements |
| `textScale` | `number` | `1` | Multiplies resolved `fontSize`, `lineHeight` and `letterSpacing` |
| `textSelectable` | `boolean` | `false` | Enable text selection |
| `plugins` | `HtmlPlugin[]` | `[]` | Plugins to use |
| `containerStyle` | `ViewStyle` | - | Container style |
| `parserOptions` | `Partial<ParserOptions>` | `{}` | Options passed to the HTML parser |
| `fallbackComponent` | `ComponentType<FallbackProps>` | - | Rendered for unsupported tags |
| `enableVirtualization` | `boolean` | `false` | Render large content through a `FlatList` |
| `virtualizationThreshold` | `number` | `500` | Minimum node count before virtualization kicks in |
| `errorBoundaryFallback` | `ReactNode` | built-in message | Shown when parsing fails or a renderer throws |
| `onError` | `(error) => void` | - | Called for parse and render errors |
| `onRenderComplete` | `(nodeCount) => void` | - | Called after the content is parsed |
| `debug` | `boolean` | `false` | Enable debug mode |

> **Tip:** `HTMLRenderer` is memoized. Equal inline style objects are detected automatically, but
> keep `plugins`, `renderers` and handlers stable (module scope, `useMemo`, `useCallback`) so the
> tree isn't rebuilt on every parent render.

## Custom Styles

Style specific HTML tags or CSS classes:

```tsx
<HTMLRenderer
  html={content}
  tagsStyles={{
    p: { color: '#333', marginBottom: 12 },
    h1: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e' },
    a: { color: '#6366f1', textDecorationLine: 'underline' },
    blockquote: { 
      borderLeftWidth: 4, 
      borderLeftColor: '#e0e0e0',
      paddingLeft: 16,
      fontStyle: 'italic' 
    },
  }}
  classesStyles={{
    highlight: { backgroundColor: '#fff3cd', padding: 8 },
    container: { padding: 16, borderRadius: 8 },
  }}
/>
```

## Link & Image Handling

Handle link clicks and image presses:

```tsx
<HTMLRenderer
  html={content}
  onLinkPress={(url, node) => {
    console.log('Link pressed:', url);
    // Navigate or open URL
    Linking.openURL(url);
  }}
  onImagePress={(src, node) => {
    console.log('Image pressed:', src);
    // Show fullscreen image viewer
  }}
/>
```

## Layout & Text Inheritance

The renderer follows the browser's layout model:

- Inline content (text, `strong`, `a`, `code`, `br`, ...) flows as one wrapping `<Text>`.
- Block elements (`div`, `p`, `ul`, `table`, `img`, ...) are laid out as boxes.
- Text styles are inherited through blocks, so `<div style="color: red">` colors everything
  inside it. `baseTextStyle` is the style every text starts from.
- Whitespace collapses like in HTML; `&nbsp;` and `<pre>` content are kept as written.

```tsx
<HTMLRenderer
  html={content}
  baseTextStyle={{ fontSize: 17, lineHeight: 26, color: '#222' }}
/>
```

## Custom Renderers

Create custom renderers for specific tags:

```tsx
<HTMLRenderer
  html="<custom-card>Custom Content</custom-card>"
  renderers={{
    'custom-card': ({ node, children, style, renderChildren }) => (
      <View style={[{ padding: 16, backgroundColor: '#f0f0f0' }, style]}>
        {renderChildren()}
      </View>
    ),
  }}
/>
```

## Plugin System

Extend functionality with plugins:

```tsx
import { HTMLRenderer, type HtmlPlugin } from '@sergenkabakci/react-native-html-renderer';

const badgePlugin: HtmlPlugin = {
  name: 'badge',
  tagRenderers: {
    badge: ({ node, style }) => (
      <View style={[styles.badge, style]}>
        <Text style={styles.badgeText}>
          {node.children.map(c => c.type === 'text' ? c.content : '').join('')}
        </Text>
      </View>
    ),
  },
};

<HTMLRenderer
  html="<badge>New</badge>"
  plugins={[badgePlugin]}
/>
```

## Hooks API

Use hooks for more control:

```tsx
import { useHtmlParser, useHtmlRenderer } from '@sergenkabakci/react-native-html-renderer';

// Parse HTML to AST
const { nodes, errors, isSuccess } = useHtmlParser(htmlString);

// Render with hooks
const { render, renderNodes } = useHtmlRenderer({
  tagsStyles: { p: { color: 'blue' } },
});

return <View>{render('<p>Hello</p>')}</View>;
```

## Supported HTML Tags

### Block Elements
`div`, `p`, `blockquote`, `article`, `section`, `header`, `footer`, `main`, `aside`, `nav`,
`figure`, `figcaption`, `details`, `summary`, `center`, `address`, `hgroup`

### Headings
`h1`, `h2`, `h3`, `h4`, `h5`, `h6`

### Text Formatting
`span`, `strong`, `b`, `em`, `i`, `u`, `s`, `strike`, `del`, `ins`, `mark`, `small`, `sub`, `sup`,
`abbr`, `cite`, `q`, `time`, `kbd`, `samp`, `var`, `dfn`, `font`, `label`, `bdi`, `bdo`, `data`, `big`, `tt`

### Lists
`ul`, `ol`, `li` (with nested list support), `dl`, `dt`, `dd`

### Links & Media
`a`, `img`, `br`, `hr`

### Tables
`table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `caption`

### Code
`pre`, `code` (inline and block)

## Performance

For large HTML content, the library includes:

- **Memoization** - Components are memoized to prevent unnecessary re-renders
- **Virtualization** - Large content can be virtualized for smooth scrolling
- **Lazy Parsing** - HTML is parsed only when needed

```tsx
<HTMLRenderer
  html={largeContent}
  enableVirtualization
  virtualizationThreshold={500}
  containerStyle={{ flex: 1 }}
/>
```

When virtualization is active the renderer scrolls by itself (it renders a `FlatList`), so don't
place it inside a `ScrollView`.

## Error Handling

Errors thrown while rendering (for example by a custom renderer) are caught, reported through
`onError` and replaced by `errorBoundaryFallback`. The boundary resets when `html` changes.

```tsx
<HTMLRenderer
  html={content}
  errorBoundaryFallback={<Text>Content could not be displayed.</Text>}
  onError={(error) => reportError(error)}
/>
```

## TypeScript

Full type definitions are included:

```tsx
import type {
  HTMLRendererProps,
  HtmlNode,
  ElementNode,
  TextNode,
  HtmlPlugin,
  TagsStyles,
  ClassesStyles,
  LinkPressHandler,
  ImagePressHandler,
} from '@sergenkabakci/react-native-html-renderer';
```

## Example App

The repository includes a full example app demonstrating all features:

```bash
cd example
npm install
npx expo start
```

## Compatibility

| Package | Version |
|---------|---------|
| React | >= 18.2.0 |
| React Native | >= 0.73.0 (tested with 0.86, New Architecture) |
| Expo SDK | 50+ (tested with SDK 57) |

Works in Expo and bare React Native projects; no native code or config plugin is required.

## Development

Requires Node.js 20.19 or newer.

```bash
npm install
npm run typecheck   # TypeScript
npm run lint        # ESLint (flat config)
npm test            # Jest + React Native Testing Library
npm run build       # react-native-builder-bob -> lib/module + lib/typescript
```

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.



