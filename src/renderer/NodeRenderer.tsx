/**
 * Node Renderer
 * Renders individual AST nodes to React Native components
 * @module renderer/NodeRenderer
 */

import React, { memo, useMemo, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TextStyle, ViewStyle, ImageStyle } from 'react-native';
import type { HtmlNode, ElementNode } from '../parser/types';
import { NodeType, isElementNode, isTextNode, isBlockTag } from '../parser/types';
import { useRenderContext } from './RenderContext';
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
 * Props for NodeRenderer
 */
interface NodeRendererProps {
  node: HtmlNode;
  parent?: ElementNode;
  depth?: number;
  index?: number;
}

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
      return () => <Text>{'\n'}</Text>;
    
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
 * Render text content
 */
function TextNodeRenderer({ content, style }: { content: string; style?: TextStyle }) {
  const { textSelectable } = useRenderContext();
  
  if (!content.trim()) {
    return null;
  }
  
  return (
    <Text selectable={textSelectable} style={style}>
      {content}
    </Text>
  );
}

/**
 * Render an element node
 */
function ElementNodeRenderer({
  node,
  parent,
  depth = 0,
  index = 0,
}: {
  node: ElementNode;
  parent?: ElementNode;
  depth?: number;
  index?: number;
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
  
  // Apply plugin transforms
  const { node: transformedNode } = pluginRegistry.applyTransforms(node, parent);
  if (!transformedNode || !isElementNode(transformedNode)) {
    return null;
  }
  
  const { tagName, children } = transformedNode;
  
  // Resolve styles
  const { style } = resolveStyle(transformedNode);
  
  // Apply plugin style modifiers
  const modifiedStyle = pluginRegistry.applyStyleModifier(tagName, style as ViewStyle);
  
  // Check for custom renderer from props
  const customRenderer = renderers[tagName];
  if (customRenderer) {
    const renderChildren = () => (
      <>
        {children.map((child, idx) => (
          <NodeRenderer
            key={child.key}
            node={child}
            parent={transformedNode}
            depth={depth + 1}
            index={idx}
          />
        ))}
      </>
    );
    
    return (
      <>
        {customRenderer({
          node: transformedNode,
          parent,
          style: modifiedStyle,
          children,
          renderChildren,
          depth,
          index,
          onLinkPress,
          onImagePress,
          textScale,
          defaultRenderer: (n) => (
            <ElementNodeRenderer node={n} parent={parent} depth={depth} index={index} />
          ),
        })}
      </>
    );
  }
  
  // Check for plugin renderer
  const pluginRenderer = pluginRegistry.getRenderer(tagName);
  if (pluginRenderer) {
    const renderChildren = () => (
      <>
        {children.map((child, idx) => (
          <NodeRenderer
            key={child.key}
            node={child}
            parent={transformedNode}
            depth={depth + 1}
            index={idx}
          />
        ))}
      </>
    );
    
    return (
      <>
        {pluginRenderer({
          node: transformedNode,
          parent,
          style: modifiedStyle,
          children,
          renderChildren,
          depth,
          index,
          onLinkPress,
          onImagePress,
          textScale,
          defaultRenderer: (n) => (
            <ElementNodeRenderer node={n} parent={parent} depth={depth} index={index} />
          ),
        })}
      </>
    );
  }
  
  // Get built-in component
  const Component = getTagComponent(tagName);
  
  if (Component) {
    return (
      <Component
        node={transformedNode}
        style={modifiedStyle}
        parent={parent}
        depth={depth}
        index={index}
      >
        {children.map((child, idx) => (
          <NodeRenderer
            key={child.key}
            node={child}
            parent={transformedNode}
            depth={depth + 1}
            index={idx}
          />
        ))}
      </Component>
    );
  }
  
  // Fallback for unsupported tags
  const Fallback = FallbackComponent || DefaultFallback;
  
  if (debug) {
    console.warn(`[react-native-html-viewer] Unsupported tag: ${tagName}`);
  }
  
  return (
    <Fallback tagName={tagName} node={transformedNode}>
      {children.map((child, idx) => (
        <NodeRenderer
          key={child.key}
          node={child}
          parent={transformedNode}
          depth={depth + 1}
          index={idx}
        />
      ))}
    </Fallback>
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
 * Render multiple nodes
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
  return (
    <>
      {nodes.map((node, index) => (
        <NodeRenderer
          key={node.key}
          node={node}
          parent={parent}
          depth={depth}
          index={index}
        />
      ))}
    </>
  );
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

