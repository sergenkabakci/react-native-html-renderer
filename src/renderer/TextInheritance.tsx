/**
 * Text style inheritance
 * React Native only inherits text styles from <Text> to nested <Text>. HTML
 * inherits them through every element, so `<div style="color: red">` must color
 * the text inside it. This context carries the inherited text style through the
 * View-based containers the renderer creates.
 * @module renderer/TextInheritance
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Text } from 'react-native';
import type { TextStyle } from 'react-native';
import { defaultTextStyle } from '../styles/defaultStyles';
import { scaleTextStyles } from '../styles/styleResolver';
import { useRenderContext } from './RenderContext';

/**
 * Inherited text state for the current position in the tree
 */
export interface InheritedText {
  /** Text style a new <Text> tree should start from */
  style?: TextStyle;
  /** True when rendering inside a <Text>, where React Native inherits natively */
  insideText: boolean;
}

/**
 * Style props that CSS inherits (or that visually propagate, like text-decoration)
 */
const INHERITED_TEXT_PROPS = [
  'color',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'fontVariant',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textDecorationLine',
  'textDecorationColor',
  'textDecorationStyle',
  'textTransform',
  'writingDirection',
] as const;

/**
 * Pick the inheritable text props from a resolved element style
 */
export function pickTextStyle(style: object | undefined): TextStyle {
  const result: Record<string, unknown> = {};
  if (!style) return result;
  for (const prop of INHERITED_TEXT_PROPS) {
    const value = (style as Record<string, unknown>)[prop];
    if (value !== undefined) {
      result[prop] = value;
    }
  }
  return result as TextStyle;
}

const InheritedTextContext = createContext<InheritedText | null>(null);

/**
 * Context value for content rendered inside a <Text>
 */
export const INSIDE_TEXT: InheritedText = { insideText: true };

/**
 * Provider for the inherited text state of child nodes
 */
export const InheritedTextProvider = InheritedTextContext.Provider;

/**
 * Read the inherited text state. At the root of the document this is the
 * library's default text style merged with `baseTextStyle`, scaled by `textScale`.
 */
export function useInheritedText(): InheritedText {
  const inherited = useContext(InheritedTextContext);
  const { baseTextStyle, textScale } = useRenderContext();

  const root = useMemo<InheritedText>(() => {
    const style = { ...defaultTextStyle, ...baseTextStyle };
    return {
      style: textScale !== 1 ? scaleTextStyles(style, textScale) : style,
      insideText: false,
    };
  }, [baseTextStyle, textScale]);

  return inherited ?? root;
}

/**
 * Wraps a run of inline content (text, <b>, <a>, ...) that sits in a View
 * container into a single <Text>, so it wraps and flows like a line of text.
 */
export function InlineRun({ children }: { children: ReactNode }): React.ReactElement {
  const inherited = useInheritedText();
  const { textSelectable } = useRenderContext();

  return (
    <Text selectable={textSelectable} style={inherited.style}>
      <InheritedTextProvider value={INSIDE_TEXT}>{children}</InheritedTextProvider>
    </Text>
  );
}
