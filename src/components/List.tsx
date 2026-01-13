/**
 * List Components
 * Renders ul, ol, and li HTML elements with proper formatting
 * @module components/List
 */

import React, { memo, type ReactNode, createContext, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { ElementNode } from '../parser/types';
import { useRenderContext } from '../renderer/RenderContext';

/**
 * List context for passing list type and depth
 */
interface ListContextValue {
  type: 'ul' | 'ol';
  depth: number;
  index: number;
  totalItems: number;
}

const ListContext = createContext<ListContextValue>({
  type: 'ul',
  depth: 0,
  index: 0,
  totalItems: 0,
});

/**
 * Get bullet character based on depth
 */
function getBullet(depth: number): string {
  const bullets = ['•', '◦', '▪', '▫', '–'];
  return bullets[depth % bullets.length];
}

/**
 * Get ordered list marker
 */
function getOrderedMarker(index: number, depth: number): string {
  // Different numbering styles based on depth
  switch (depth % 3) {
    case 0: // 1, 2, 3...
      return `${index + 1}.`;
    case 1: // a, b, c...
      return `${String.fromCharCode(97 + (index % 26))}.`;
    case 2: // i, ii, iii...
      return toRoman(index + 1).toLowerCase() + '.';
    default:
      return `${index + 1}.`;
  }
}

/**
 * Convert number to Roman numerals
 */
function toRoman(num: number): string {
  if (num <= 0 || num > 3999) return String(num);
  
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  
  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

/**
 * Props for List
 */
export interface ListProps {
  node: ElementNode;
  style?: ViewStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * List component for ul and ol
 */
function ListComponent({
  node,
  style,
  depth = 0,
  children,
}: ListProps): React.ReactElement {
  const type = node.tagName === 'ol' ? 'ol' : 'ul';
  
  // Count li children
  const liChildren = node.children.filter(
    (child) => child.type === 'element' && (child as ElementNode).tagName === 'li'
  );
  
  return (
    <ListContext.Provider
      value={{
        type,
        depth,
        index: 0,
        totalItems: liChildren.length,
      }}
    >
      <View
        style={[styles.list, { paddingLeft: depth > 0 ? 20 : 0 }, style]}
        accessibilityRole="list"
      >
        {children}
      </View>
    </ListContext.Provider>
  );
}

/**
 * Props for ListItem
 */
export interface ListItemProps {
  node: ElementNode;
  style?: ViewStyle | TextStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * List Item component
 */
function ListItemComponent({
  node,
  style,
  depth = 0,
  index = 0,
  children,
}: ListItemProps): React.ReactElement {
  const { textSelectable } = useRenderContext();
  const listContext = useContext(ListContext);
  
  // Determine marker
  const marker = listContext.type === 'ol'
    ? getOrderedMarker(index, listContext.depth)
    : getBullet(listContext.depth);
  
  return (
    <View style={[styles.listItem, style]}>
      <Text style={styles.marker} selectable={false}>
        {marker}
      </Text>
      <View style={styles.listItemContent}>
        <Text selectable={textSelectable} style={styles.listItemText}>
          {children}
        </Text>
      </View>
    </View>
  );
}

/**
 * Memoized List
 */
export const List = memo(ListComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.style === next.style &&
    prev.depth === next.depth
  );
});

List.displayName = 'List';

/**
 * Memoized ListItem
 */
export const ListItem = memo(ListItemComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.style === next.style &&
    prev.index === next.index
  );
});

ListItem.displayName = 'ListItem';

const styles = StyleSheet.create({
  list: {
    marginVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  marker: {
    width: 24,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    marginRight: 4,
    textAlign: 'right',
    paddingRight: 8,
  },
  listItemContent: {
    flex: 1,
  },
  listItemText: {
    lineHeight: 22,
    fontSize: 16,
  },
});

export { ListContext, getBullet, getOrderedMarker };

