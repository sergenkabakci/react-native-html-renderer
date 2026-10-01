/**
 * Text Wrapper Component
 * Renders inline text elements (span, strong, em, etc.)
 * @module components/TextWrapper
 */

import React, { memo, type ReactNode } from 'react';
import { Text } from 'react-native';
import type { TextStyle } from 'react-native';
import type { ElementNode } from '../parser/types';
import { useRenderContext } from '../renderer/RenderContext';
import { getMonospaceFont } from './CodeBlock';

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
  cite: { fontStyle: 'italic' },
  var: { fontStyle: 'italic' },
  dfn: { fontStyle: 'italic' },
  big: { fontSize: 19 },
  abbr: { textDecorationLine: 'underline', textDecorationStyle: 'dotted' },
  span: {},
};

/**
 * Tags rendered in a monospace font
 */
const MONOSPACE_TAGS = new Set(['kbd', 'samp', 'tt']);

/**
 * Legacy <font size="1..7"> to pixel sizes (browser defaults)
 */
const FONT_SIZES = [10, 13, 16, 18, 24, 32, 48];

/**
 * Styles from the legacy <font color size face> attributes
 */
function getFontTagStyle(node: ElementNode): TextStyle {
  const { color, size, face } = node.attributes;
  const result: TextStyle = {};
  if (color) {
    result.color = color;
  }
  const sizeIndex = size ? parseInt(size, 10) : NaN;
  if (!Number.isNaN(sizeIndex)) {
    result.fontSize = FONT_SIZES[Math.min(Math.max(sizeIndex, 1), 7) - 1];
  }
  const family = face?.split(',')[0].trim();
  if (family) {
    result.fontFamily = family;
  }
  return result;
}

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
  let baseStyle = tagStyles[node.tagName] || {};
  if (MONOSPACE_TAGS.has(node.tagName)) {
    baseStyle = { fontFamily: customFonts?.monospace || getMonospaceFont() };
  } else if (node.tagName === 'font') {
    baseStyle = getFontTagStyle(node);
  }
  
  // Apply custom font if specified
  let fontStyle: TextStyle = {};
  if (customFonts && baseStyle.fontFamily) {
    const customFont = customFonts[baseStyle.fontFamily];
    if (customFont) {
      fontStyle = { fontFamily: customFont };
    }
  }
  
  // <q> gets quotation marks, like in browsers
  const content = node.tagName === 'q' ? <>{'\u201C'}{children}{'\u201D'}</> : children;
  
  return (
    <Text
      style={[baseStyle, fontStyle, style]}
      selectable={textSelectable}
    >
      {content}
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

