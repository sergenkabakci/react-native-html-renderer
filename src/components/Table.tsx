/**
 * Table Components
 * Renders table, tr, th, td elements
 * @module components/Table
 */

import React, { memo, type ReactNode, createContext, useContext } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { ElementNode } from '../parser/types';
import { useRenderContext } from '../renderer/RenderContext';

/**
 * Table context for passing column count
 */
interface TableContextValue {
  columnCount: number;
  isHeader: boolean;
}

const TableContext = createContext<TableContextValue>({
  columnCount: 1,
  isHeader: false,
});

/**
 * Props for Table
 */
export interface TableProps {
  node: ElementNode;
  style?: ViewStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * Count columns in table
 */
function countColumns(node: ElementNode): number {
  let maxColumns = 0;
  
  // Check all rows
  const findRows = (el: ElementNode): void => {
    if (el.tagName === 'tr') {
      const cellCount = el.children.filter(
        (child) =>
          child.type === 'element' &&
          ['td', 'th'].includes((child as ElementNode).tagName)
      ).length;
      maxColumns = Math.max(maxColumns, cellCount);
    } else {
      el.children.forEach((child) => {
        if (child.type === 'element') {
          findRows(child as ElementNode);
        }
      });
    }
  };
  
  findRows(node);
  return Math.max(maxColumns, 1);
}

/**
 * Table component
 */
function TableComponent({
  node,
  style,
  children,
}: TableProps): React.ReactElement {
  const columnCount = countColumns(node);
  const isHeader = node.tagName === 'thead';
  
  return (
    <TableContext.Provider value={{ columnCount, isHeader }}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={[styles.table, style]}>{children}</View>
      </ScrollView>
    </TableContext.Provider>
  );
}

/**
 * Props for TableRow
 */
export interface TableRowProps {
  node: ElementNode;
  style?: ViewStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * Table Row component
 */
function TableRowComponent({
  node,
  style,
  parent,
  children,
}: TableRowProps): React.ReactElement {
  const isInHeader = parent?.tagName === 'thead';
  
  return (
    <View
      style={[
        styles.row,
        isInHeader && styles.headerRow,
        style,
      ]}
      accessibilityRole="none"
    >
      {children}
    </View>
  );
}

/**
 * Props for TableCell
 */
export interface TableCellProps {
  node: ElementNode;
  style?: ViewStyle | TextStyle;
  parent?: ElementNode;
  depth?: number;
  index?: number;
  children?: ReactNode;
}

/**
 * Table Cell component
 */
function TableCellComponent({
  node,
  style,
  parent,
  children,
}: TableCellProps): React.ReactElement {
  const { textSelectable } = useRenderContext();
  const { columnCount } = useContext(TableContext);
  
  const isHeader = node.tagName === 'th' || parent?.tagName === 'thead';
  const isCaption = node.tagName === 'caption';
  
  if (isCaption) {
    return (
      <View style={styles.caption}>
        <Text style={styles.captionText} selectable={textSelectable}>
          {children}
        </Text>
      </View>
    );
  }
  
  return (
    <View
      style={[
        styles.cell,
        isHeader && styles.headerCell,
        { minWidth: 100 },
        style,
      ]}
    >
      <Text
        style={[
          styles.cellText,
          isHeader && styles.headerCellText,
        ]}
        selectable={textSelectable}
      >
        {children}
      </Text>
    </View>
  );
}

/**
 * Memoized Table
 */
export const Table = memo(TableComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.style === next.style
  );
});

Table.displayName = 'Table';

/**
 * Memoized TableRow
 */
export const TableRow = memo(TableRowComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.style === next.style
  );
});

TableRow.displayName = 'TableRow';

/**
 * Memoized TableCell
 */
export const TableCell = memo(TableCellComponent, (prev, next) => {
  return (
    prev.node.key === next.node.key &&
    prev.style === next.style
  );
});

TableCell.displayName = 'TableCell';

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerRow: {
    backgroundColor: '#f5f5f5',
  },
  cell: {
    flex: 1,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    justifyContent: 'center',
  },
  headerCell: {
    backgroundColor: '#f5f5f5',
  },
  cellText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
  headerCellText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  caption: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  captionText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#666666',
  },
});

export { TableContext, countColumns };

