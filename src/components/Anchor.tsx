/**
 * Anchor Component
 * Renders a elements with link handling
 * @module components/Anchor
 */

import React, { memo, useCallback, type ReactNode } from 'react';
import { Text, Linking, StyleSheet } from 'react-native';
import type { TextStyle } from 'react-native';
import type { ElementNode } from '../parser/types';
import { useRenderContext } from '../renderer/RenderContext';

/**
 * Props for Anchor
 */
export interface AnchorProps {
  node: ElementNode;
  style?: TextStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * Check if URL is external
 */
function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Check if URL is a mailto link
 */
function isMailtoLink(url: string): boolean {
  return url.startsWith('mailto:');
}

/**
 * Check if URL is a tel link
 */
function isTelLink(url: string): boolean {
  return url.startsWith('tel:');
}

/**
 * Anchor component for a elements
 */
function AnchorComponent({
  node,
  style,
  children,
}: AnchorProps): React.ReactElement {
  const { onLinkPress, textSelectable } = useRenderContext();
  
  const href = node.attributes.href || '';
  
  const handlePress = useCallback(async () => {
    if (!href) return;
    
    // Call custom handler if provided
    if (onLinkPress) {
      onLinkPress(href, node);
      return;
    }
    
    // Default handling
    try {
      const canOpen = await Linking.canOpenURL(href);
      if (canOpen) {
        await Linking.openURL(href);
      } else {
        console.warn(`[react-native-html-viewer] Cannot open URL: ${href}`);
      }
    } catch (error) {
      console.error(`[react-native-html-viewer] Error opening URL: ${href}`, error);
    }
  }, [href, onLinkPress, node]);
  
  // Determine accessibility hint
  const getAccessibilityHint = (): string => {
    if (isMailtoLink(href)) {
      return 'Opens email client';
    }
    if (isTelLink(href)) {
      return 'Initiates phone call';
    }
    if (isExternalUrl(href)) {
      return 'Opens in browser';
    }
    return 'Navigates to link';
  };
  
  return (
    <Text
      style={[styles.link, style]}
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityHint={getAccessibilityHint()}
      selectable={textSelectable}
    >
      {children}
    </Text>
  );
}

/**
 * Memoized Anchor
 */
export const Anchor = memo(AnchorComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.node.attributes.href === next.node.attributes.href &&
    prev.style === next.style
  );
});

Anchor.displayName = 'Anchor';

const styles = StyleSheet.create({
  link: {
    color: '#1976d2',
    textDecorationLine: 'underline',
  },
});

export { isExternalUrl, isMailtoLink, isTelLink };

