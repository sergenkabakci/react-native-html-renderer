/**
 * Code Block Component
 * Renders pre and code elements
 * @module components/CodeBlock
 */

import React, { memo, type ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { ElementNode } from '../parser/types';
import { useRenderContext } from '../renderer/RenderContext';

/**
 * Props for CodeBlock
 */
export interface CodeBlockProps {
  node: ElementNode;
  style?: ViewStyle | TextStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * Get monospace font family based on platform
 */
function getMonospaceFont(): string {
  return Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) as string;
}

/**
 * Check if this is an inline code element
 */
function isInlineCode(node: ElementNode, parent?: ElementNode): boolean {
  if (node.tagName !== 'code') return false;
  // Inline if parent is not pre
  return parent?.tagName !== 'pre';
}

/**
 * Code Block component for pre and code elements
 */
function CodeBlockComponent({
  node,
  style,
  parent,
  children,
}: CodeBlockProps): React.ReactElement {
  const { textSelectable, customFonts } = useRenderContext();
  
  const fontFamily = customFonts?.['monospace'] || getMonospaceFont();
  
  // Handle inline code
  if (isInlineCode(node, parent)) {
    return (
      <Text
        style={[
          styles.inlineCode,
          { fontFamily },
          style as TextStyle,
        ]}
        selectable={textSelectable}
      >
        {children}
      </Text>
    );
  }
  
  // Handle pre element or code inside pre
  return (
    <View style={[styles.preContainer, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={styles.scrollView}
      >
        <Text
          style={[styles.preText, { fontFamily }]}
          selectable={textSelectable}
        >
          {children}
        </Text>
      </ScrollView>
    </View>
  );
}

/**
 * Memoized CodeBlock
 */
export const CodeBlock = memo(CodeBlockComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.style === next.style
  );
});

CodeBlock.displayName = 'CodeBlock';

const styles = StyleSheet.create({
  preContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
    overflow: 'hidden',
  },
  scrollView: {
    flexGrow: 0,
  },
  preText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#d4d4d4',
  },
  inlineCode: {
    fontSize: 14,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#e91e63',
  },
});

export { getMonospaceFont, isInlineCode };

