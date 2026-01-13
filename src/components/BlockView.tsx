/**
 * Block View Component
 * Renders block-level HTML elements (div, p, blockquote, etc.)
 * @module components/BlockView
 */

import React, { memo, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { ElementNode } from '../parser/types';
import { useRenderContext } from '../renderer/RenderContext';

/**
 * Props for BlockView
 */
export interface BlockViewProps {
  node: ElementNode;
  style?: ViewStyle | TextStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * Block View component for div, p, blockquote, etc.
 */
function BlockViewComponent({
  node,
  style,
  children,
}: BlockViewProps): React.ReactElement {
  const { textSelectable } = useRenderContext();
  
  // Handle blockquote specifically
  if (node.tagName === 'blockquote') {
    return (
      <View
        style={[styles.blockquote, style]}
        accessibilityRole="text"
      >
        <Text selectable={textSelectable} style={styles.blockquoteText}>
          {children}
        </Text>
      </View>
    );
  }
  
  // Handle paragraph
  if (node.tagName === 'p') {
    return (
      <Text
        selectable={textSelectable}
        style={[styles.paragraph, style as TextStyle]}
        accessibilityRole="text"
      >
        {children}
      </Text>
    );
  }
  
  // Default block view
  return (
    <View
      style={[styles.block, style]}
      accessibilityRole={getAccessibilityRole(node.tagName)}
    >
      {children}
    </View>
  );
}

/**
 * Get accessibility role for a tag
 */
function getAccessibilityRole(tagName: string): 'none' | 'link' | undefined {
  switch (tagName) {
    case 'nav':
      return 'link';
    default:
      return 'none';
  }
}

/**
 * Memoized BlockView
 */
export const BlockView = memo(BlockViewComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.style === next.style
  );
});

BlockView.displayName = 'BlockView';

const styles = StyleSheet.create({
  block: {
    flexDirection: 'column',
  },
  paragraph: {
    marginVertical: 8,
    lineHeight: 24,
  },
  blockquote: {
    marginVertical: 12,
    paddingLeft: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  blockquoteText: {
    fontStyle: 'italic',
    color: '#666666',
    lineHeight: 24,
  },
});

