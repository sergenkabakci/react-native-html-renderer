/**
 * Text Wrapper Component
 * Renders inline text elements (span, strong, em, etc.)
 * @module components/TextWrapper
 */

import React, { memo, type ReactNode } from 'react';
import { Text, StyleSheet } from 'react-native';
import type { TextStyle } from 'react-native';
import type { ElementNode } from '../parser/types';
import { useRenderContext } from '../renderer/RenderContext';

/**
 * Props for TextWrapper
 */
export interface TextWrapperProps {
  node: ElementNode;
  style?: TextStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * Tag-specific base styles
 */
const tagStyles: Record<string, TextStyle> = {
  strong: { fontWeight: 'bold' },
  b: { fontWeight: 'bold' },
  em: { fontStyle: 'italic' },
  i: { fontStyle: 'italic' },
  u: { textDecorationLine: 'underline' },
  s: { textDecorationLine: 'line-through' },
  strike: { textDecorationLine: 'line-through' },
  del: { textDecorationLine: 'line-through', color: '#888888' },
  ins: { textDecorationLine: 'underline', color: '#2e7d32' },
  mark: { backgroundColor: '#ffeb3b', color: '#1a1a1a' },
  small: { fontSize: 12 },
  sub: { fontSize: 12, lineHeight: 12 },
  sup: { fontSize: 12, lineHeight: 12 },
  span: {},
};

/**
 * Text Wrapper component for inline text elements
 */
function TextWrapperComponent({
  node,
  style,
  children,
}: TextWrapperProps): React.ReactElement {
  const { textSelectable, customFonts } = useRenderContext();
  
  // Get base style for tag
  const baseStyle = tagStyles[node.tagName] || {};
  
  // Apply custom font if specified
  let fontStyle: TextStyle = {};
  if (customFonts && baseStyle.fontFamily) {
    const customFont = customFonts[baseStyle.fontFamily];
    if (customFont) {
      fontStyle = { fontFamily: customFont };
    }
  }
  
  return (
    <Text
      style={[baseStyle, fontStyle, style]}
      selectable={textSelectable}
    >
      {children}
    </Text>
  );
}

/**
 * Memoized TextWrapper
 */
export const TextWrapper = memo(TextWrapperComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.style === next.style
  );
});

TextWrapper.displayName = 'TextWrapper';

export { tagStyles };

