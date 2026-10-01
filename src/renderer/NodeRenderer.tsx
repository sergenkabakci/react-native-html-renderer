/**
 * Node Renderer
 * Renders individual AST nodes to React Native components
 * @module renderer/NodeRenderer
 *
 * Layout model:
 * - Elements that hold a line of text (p, h1-h6, b, a, code, pre, ...) render a
 *   <Text>; their children render inside it and inherit natively.
 * - Every other element is a View container. Consecutive inline children of a
 *   container (text, b, a, br, ...) are grouped into one <Text> ("inline run"),
 *   block children (div, ul, img, table, ...) are laid out as boxes between runs.
 * - A text element that contains a block (`<p><img></p>`, `<a><img></a>`) is
 *   promoted to a View container, since boxes can't be laid out inside a line.
 * - Text styles (color, font, ...) are inherited through View containers via
 *   InheritedText, so `<div style="color: red">` colors the text inside it.
 */

import React, { memo, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import type { HtmlNode, ElementNode } from '../parser/types';
import { isElementNode, isTextNode } from '../parser/types';
import { scaleTextStyles } from '../styles/styleResolver';
import { HEADING_TAGS } from '../styles/defaultStyles';
import { useRenderContext } from './RenderContext';
import {
  INSIDE_TEXT,
  InheritedTextProvider,
  InlineRun,
  pickTextStyle,
  useInheritedText,
  type InheritedText,
} from './TextInheritance';
import { getLayoutClassifier, type LayoutClassifier } from './layout';
import { LOG_PREFIX } from './constants';
import type { FallbackProps } from './types';

// Import tag-specific components
import { BlockView } from '../components/BlockView';
import { Heading } from '../components/Heading';
import { TextWrapper } from '../components/TextWrapper';
import { List, ListItem } from '../components/List';
import { Anchor } from '../components/Anchor';
import { ImageElement } from '../components/ImageElement';
import { Table, TableRow, TableCell } from '../components/Table';
import { CodeBlock } from '../components/CodeBlock';
import { HorizontalRule } from '../components/HorizontalRule';

/**
 * Default fallback component for unsupported tags
 */
function DefaultFallback({ tagName, children }: FallbackProps): React.ReactElement {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>[{tagName}]</Text>
      {children}
    </View>
  );
}

/**
 * Line break for <br>. Declared once so React keeps the same component type
 * between renders instead of remounting it.
 */
function LineBreak(): React.ReactElement {
  return <Text>{'\n'}</Text>;
}

/**
 * View container for a text element that holds blocks (e.g. `<p><img></p>`).
 * Its text styles reach the inline runs inside it through InheritedText.
 */
function PromotedBlock({
  tagName,
  style,
  children,
}: {
  tagName: string;
  style?: ViewStyle;
  children?: ReactNode;
}): React.ReactElement {
  return (
    <View
      style={style}
      accessibilityRole={HEADING_TAGS.has(tagName) ? 'header' : undefined}
    >
      {children}
    </View>
  );
}

/**
 * Props for NodeRenderer
 */
interface NodeRendererProps {
  node: HtmlNode;
  parent?: ElementNode;
  depth?: number;
  index?: number;
}

/**
 * Tags whose component renders a <Text> around its children
 */
const TEXT_ELEMENT_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
  'abbr', 'cite', 'q', 'time', 'kbd', 'samp', 'var', 'dfn', 'font', 'label', 'bdi', 'bdo', 'data', 'big', 'tt',
  'a', 'code',
]);

/**
 * Tags without children
 */
const VOID_TAGS = new Set(['br', 'img', 'hr']);

/**
 * Get the appropriate component for a tag
 */
function getTagComponent(tagName: string) {
  switch (tagName) {
    // Block elements
    case 'div':
    case 'article':
    case 'section':
    case 'header':
    case 'footer':
    case 'main':
    case 'aside':
    case 'nav':
    case 'center':
    case 'address':
    case 'hgroup':
    case 'dl':
    case 'dt':
    case 'dd':
      return BlockView;

    // Paragraphs and blockquotes
    case 'p':
    case 'blockquote':
      return BlockView;

    // Headings
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return Heading;

    // Text elements
    case 'span':
    case 'strong':
    case 'b':
    case 'em':
    case 'i':
    case 'u':
    case 's':
    case 'strike':
    case 'del':
    case 'ins':
    case 'mark':
    case 'small':
    case 'sub':
    case 'sup':
    case 'abbr':
    case 'cite':
    case 'q':
    case 'time':
    case 'kbd':
    case 'samp':
    case 'var':
    case 'dfn':
    case 'font':
    case 'label':
    case 'bdi':
    case 'bdo':
    case 'data':
    case 'big':
    case 'tt':
      return TextWrapper;

    // Lists
    case 'ul':
    case 'ol':
      return List;

    case 'li':
      return ListItem;

    // Links
    case 'a':
      return Anchor;

    // Images
    case 'img':
      return ImageElement;

    // Tables
    case 'table':
    case 'thead':
    case 'tbody':
    case 'tfoot':
      return Table;

    case 'tr':
      return TableRow;

    case 'th':
    case 'td':
    case 'caption':
      return TableCell;

    // Code
    case 'pre':
    case 'code':
      return CodeBlock;

    // Other
    case 'hr':
      return HorizontalRule;

    case 'br':
      return LineBreak;

    case 'figure':
    case 'figcaption':
    case 'details':
    case 'summary':
      return BlockView;

    default:
      return null;
  }
}

/**
 * Render a list of child nodes.
 *
 * With `groupInline`, consecutive inline nodes are wrapped in a single
 * <InlineRun>, which is what a View container needs. Without it the nodes are
 * rendered as-is (for children of a <Text>).
 */
export function renderNodeList(
  nodes: HtmlNode[],
  parent: ElementNode | undefined,
  depth: number,
  layout: LayoutClassifier,
  groupInline: boolean
): ReactNode[] {
  const rendered = nodes.map((child, idx) => (
    <NodeRenderer
      key={child.key}
      node={child}
      parent={parent}
      depth={depth}
      index={idx}
    />
  ));

  if (!groupInline) {
    return rendered;
  }

  const result: ReactNode[] = [];
  let run: React.ReactElement[] = [];

  const flush = (): void => {
    if (run.length > 0) {
      result.push(<InlineRun key={`run-${run[0].key}`}>{run}</InlineRun>);
      run = [];
    }
  };

  nodes.forEach((child, idx) => {
    if (layout.isInline(child)) {
      run.push(rendered[idx]);
    } else {
      flush();
      result.push(rendered[idx]);
    }
  });
  flush();

  return result;
}

/**
 * Render text content. Text nodes always end up inside a <Text> (an inline run
 * or a text element); the extra <Text> keeps custom renderers that place
 * children elsewhere from crashing on a bare string.
 */
function TextNodeRenderer({ content }: { content: string }) {
  const { textSelectable } = useRenderContext();

  if (!content) {
    return null;
  }

  return <Text selectable={textSelectable}>{content}</Text>;
}

/**
 * Render an element node
 */
function ElementNodeRenderer({
  node,
  parent,
  depth = 0,
  index = 0,
  skipCustomRenderer = false,
}: {
  node: ElementNode;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  /** Used by `defaultRenderer` so a custom renderer can fall back to the built-in one */
  skipCustomRenderer?: boolean;
}): React.ReactElement | null {
  const {
    resolveStyle,
    renderers,
    pluginRegistry,
    onLinkPress,
    onImagePress,
    textScale,
    FallbackComponent,
    debug,
  } = useRenderContext();
  const inherited = useInheritedText();

  // Apply plugin transforms
  const { node: transformedNode } = pluginRegistry.applyTransforms(node, parent);
  if (!transformedNode || !isElementNode(transformedNode)) {
    return null;
  }

  const { tagName, children } = transformedNode;
  const layout = getLayoutClassifier(renderers);

  // Resolve styles
  const { style } = resolveStyle(transformedNode);

  // Apply text scaling (fontSize, lineHeight, letterSpacing)
  const scaledStyle = textScale !== 1
    ? scaleTextStyles(style as TextStyle, textScale)
    : style;

  // Apply plugin style modifiers
  const modifiedStyle = pluginRegistry.applyStyleModifier(tagName, scaledStyle as ViewStyle);

  // Children laid out in a View inherit this element's text styles
  const viewChildrenText: InheritedText = {
    style: { ...inherited.style, ...pickTextStyle(modifiedStyle) },
    insideText: false,
  };
  const renderBlockChildren = () => (
    <InheritedTextProvider value={viewChildrenText}>
      {renderNodeList(children, transformedNode, depth + 1, layout, true)}
    </InheritedTextProvider>
  );
  const renderTextChildren = () => (
    <InheritedTextProvider value={INSIDE_TEXT}>
      {renderNodeList(children, transformedNode, depth + 1, layout, false)}
    </InheritedTextProvider>
  );

  // Custom renderer from props or plugins
  const customRenderer = skipCustomRenderer
    ? undefined
    : renderers[tagName] ?? pluginRegistry.getRenderer(tagName);
  if (customRenderer) {
    return (
      <InheritedTextProvider value={viewChildrenText}>
        {customRenderer({
          node: transformedNode,
          parent,
          style: modifiedStyle,
          children,
          renderChildren: renderBlockChildren,
          depth,
          index,
          onLinkPress,
          onImagePress,
          textScale,
          defaultRenderer: (n) => (
            <ElementNodeRenderer
              node={n}
              parent={parent}
              depth={depth}
              index={index}
              skipCustomRenderer={n.tagName === tagName}
            />
          ),
        })}
      </InheritedTextProvider>
    );
  }

  // Get built-in component
  const Component = getTagComponent(tagName);

  if (!Component) {
    // Fallback for unsupported tags
    const Fallback = FallbackComponent || DefaultFallback;

    if (debug) {
      console.warn(`${LOG_PREFIX} Unsupported tag: ${tagName}`);
    }

    return (
      <Fallback tagName={tagName} node={transformedNode}>
        {renderBlockChildren()}
      </Fallback>
    );
  }

  if (VOID_TAGS.has(tagName)) {
    return (
      <Component
        node={transformedNode}
        style={modifiedStyle}
        parent={parent}
        depth={depth}
        index={index}
      />
    );
  }

  const isTextElement = tagName === 'pre' || TEXT_ELEMENT_TAGS.has(tagName);

  if (isTextElement && (tagName === 'pre' || !layout.containsBlock(transformedNode))) {
    // A text element outside of a <Text> starts a new text tree, so it has to
    // pick up the inherited text style explicitly
    const textStyle = inherited.insideText
      ? modifiedStyle
      : { ...inherited.style, ...modifiedStyle };

    return (
      <Component
        node={transformedNode}
        style={textStyle as ViewStyle}
        parent={parent}
        depth={depth}
        index={index}
      >
        {renderTextChildren()}
      </Component>
    );
  }

  if (isTextElement) {
    // Text element holding blocks: lay it out as a View container
    if (tagName === 'a') {
      return (
        <Anchor node={transformedNode} style={modifiedStyle as TextStyle} parent={parent} block>
          {renderBlockChildren()}
        </Anchor>
      );
    }
    return (
      <PromotedBlock tagName={tagName} style={modifiedStyle}>
        {renderBlockChildren()}
      </PromotedBlock>
    );
  }

  return (
    <Component
      node={transformedNode}
      style={modifiedStyle}
      parent={parent}
      depth={depth}
      index={index}
    >
      {renderBlockChildren()}
    </Component>
  );
}

/**
 * Main node renderer component
 * Recursively renders AST nodes to React Native components
 */
function NodeRendererComponent({
  node,
  parent,
  depth = 0,
  index = 0,
}: NodeRendererProps): React.ReactElement | null {
  if (isTextNode(node)) {
    return <TextNodeRenderer content={node.content} />;
  }

  if (isElementNode(node)) {
    return (
      <ElementNodeRenderer
        node={node}
        parent={parent}
        depth={depth}
        index={index}
      />
    );
  }

  // Comment nodes and other types are not rendered
  return null;
}

/**
 * Memoized NodeRenderer
 * Only re-renders when node changes
 */
export const NodeRenderer = memo(NodeRendererComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.depth === next.depth &&
    prev.index === next.index
  );
});

NodeRenderer.displayName = 'NodeRenderer';

/**
 * Render multiple nodes laid out like the content of a block element:
 * inline content is grouped into flowing text, blocks are stacked.
 */
export function NodesRenderer({
  nodes,
  parent,
  depth = 0,
}: {
  nodes: HtmlNode[];
  parent?: ElementNode;
  depth?: number;
}): React.ReactElement {
  const { renderers } = useRenderContext();
  const layout = getLayoutClassifier(renderers);

  return <>{renderNodeList(nodes, parent, depth, layout, true)}</>;
}

const styles = StyleSheet.create({
  fallback: {
    borderWidth: 1,
    borderColor: '#ff9800',
    borderStyle: 'dashed',
    padding: 4,
    borderRadius: 4,
    marginVertical: 2,
  },
  fallbackText: {
    fontSize: 10,
    color: '#ff9800',
    fontFamily: 'monospace',
  },
});

export { DefaultFallback };
