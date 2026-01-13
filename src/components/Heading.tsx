/**
 * Heading Component
 * Renders h1-h6 HTML elements
 * @module components/Heading
 */

import React, { memo, type ReactNode } from 'react';
import { Text } from 'react-native';
import type { TextStyle } from 'react-native';
import type { ElementNode } from '../parser/types';
import { useRenderContext } from '../renderer/RenderContext';
import { scaleTextStyles } from '../styles/styleResolver';

/**
 * Props for Heading
 */
export interface HeadingProps {
  node: ElementNode;
  style?: TextStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * Heading level to style mapping
 */
const headingStyles: Record<string, TextStyle> = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 14,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 12,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 10,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 8,
    lineHeight: 26,
  },
  h6: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    lineHeight: 24,
  },
};

/**
 * Heading component for h1-h6
 */
function HeadingComponent({
  node,
  style,
  children,
}: HeadingProps): React.ReactElement {
  const { textScale, textSelectable } = useRenderContext();
  
  // Get base heading style
  const baseStyle = headingStyles[node.tagName] || headingStyles.h1;
  
  // Apply text scaling
  const scaledStyle = textScale !== 1 
    ? scaleTextStyles(baseStyle, textScale) 
    : baseStyle;
  
  return (
    <Text
      style={[scaledStyle, style]}
      accessibilityRole="header"
      selectable={textSelectable}
    >
      {children}
    </Text>
  );
}

/**
 * Memoized Heading
 */
export const Heading = memo(HeadingComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.style === next.style
  );
});

Heading.displayName = 'Heading';

export { headingStyles };

