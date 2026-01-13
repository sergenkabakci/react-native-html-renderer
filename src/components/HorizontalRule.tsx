/**
 * Horizontal Rule Component
 * Renders hr element
 * @module components/HorizontalRule
 */

import React, { memo, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { ElementNode } from '../parser/types';

/**
 * Props for HorizontalRule
 */
export interface HorizontalRuleProps {
  node: ElementNode;
  style?: ViewStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * Horizontal Rule component for hr element
 */
function HorizontalRuleComponent({
  style,
}: HorizontalRuleProps): React.ReactElement {
  return (
    <View
      style={[styles.hr, style]}
      accessibilityRole="none"
    />
  );
}

/**
 * Memoized HorizontalRule
 */
export const HorizontalRule = memo(HorizontalRuleComponent);

HorizontalRule.displayName = 'HorizontalRule';

const styles = StyleSheet.create({
  hr: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
    alignSelf: 'stretch',
  },
});

