/**
 * Virtualized Content Component
 * Renders large HTML content with virtualization for performance
 * @module performance/VirtualizedContent
 */

import React, { memo, useMemo, useCallback, type ReactNode } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import type { ViewStyle, ListRenderItemInfo } from 'react-native';
import type { HtmlNode, ElementNode } from '../parser/types';
import { NodeType, isElementNode } from '../parser/types';

/**
 * A chunk of nodes to render together
 */
interface NodeChunk {
  key: string;
  nodes: HtmlNode[];
  estimatedHeight: number;
}

/**
 * Props for VirtualizedContent
 */
export interface VirtualizedContentProps {
  /** Nodes to render */
  nodes: HtmlNode[];
  /** Render function for nodes */
  renderNodes: (nodes: HtmlNode[]) => ReactNode;
  /** Estimated height per row */
  estimatedRowHeight?: number;
  /** Number of nodes per chunk */
  chunkSize?: number;
  /** Container style */
  style?: ViewStyle;
  /** Initial number of items to render */
  initialNumToRender?: number;
  /** Maximum items to keep in memory */
  maxToRenderPerBatch?: number;
  /** Window size multiplier */
  windowSize?: number;
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Estimate height for a node
 */
function estimateNodeHeight(node: HtmlNode, baseHeight: number): number {
  if (node.type === NodeType.Text) {
    // Estimate based on text length
    const charCount = node.content.length;
    const lines = Math.ceil(charCount / 50);
    return lines * baseHeight;
  }
  
  if (node.type === NodeType.Element) {
    const el = node as ElementNode;
    
    // Special handling for different tags
    switch (el.tagName) {
      case 'img':
        return 200; // Default image height
      case 'h1':
        return 60;
      case 'h2':
        return 50;
      case 'h3':
      case 'h4':
        return 40;
      case 'table':
        return el.children.length * 40 + 20;
      case 'pre':
      case 'code':
        return baseHeight * 2;
      default:
        // Sum children + margin
        const childrenHeight = el.children.reduce(
          (sum, child) => sum + estimateNodeHeight(child, baseHeight),
          0
        );
        return childrenHeight + 10;
    }
  }
  
  return baseHeight;
}

/**
 * Split nodes into chunks for virtualization
 */
function chunkNodes(
  nodes: HtmlNode[],
  chunkSize: number,
  baseHeight: number
): NodeChunk[] {
  const chunks: NodeChunk[] = [];
  let currentChunk: HtmlNode[] = [];
  let currentHeight = 0;
  let chunkIndex = 0;
  
  for (const node of nodes) {
    currentChunk.push(node);
    currentHeight += estimateNodeHeight(node, baseHeight);
    
    if (currentChunk.length >= chunkSize) {
      chunks.push({
        key: `chunk-${chunkIndex}`,
        nodes: currentChunk,
        estimatedHeight: currentHeight,
      });
      currentChunk = [];
      currentHeight = 0;
      chunkIndex++;
    }
  }
  
  // Don't forget remaining nodes
  if (currentChunk.length > 0) {
    chunks.push({
      key: `chunk-${chunkIndex}`,
      nodes: currentChunk,
      estimatedHeight: currentHeight,
    });
  }
  
  return chunks;
}

/**
 * Virtualized Content component
 * Uses FlatList for efficient rendering of large HTML content
 */
function VirtualizedContentComponent({
  nodes,
  renderNodes,
  estimatedRowHeight = 40,
  chunkSize = 10,
  style,
  initialNumToRender = 5,
  maxToRenderPerBatch = 5,
  windowSize = 5,
  debug = false,
}: VirtualizedContentProps): React.ReactElement {
  // Create chunks
  const chunks = useMemo(
    () => chunkNodes(nodes, chunkSize, estimatedRowHeight),
    [nodes, chunkSize, estimatedRowHeight]
  );
  
  // Render item
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<NodeChunk>) => (
      <View style={styles.chunkContainer}>
        {renderNodes(item.nodes)}
      </View>
    ),
    [renderNodes]
  );
  
  // Key extractor
  const keyExtractor = useCallback(
    (item: NodeChunk) => item.key,
    []
  );
  
  // Get item layout for optimization
  const getItemLayout = useCallback(
    (_: ArrayLike<NodeChunk> | null | undefined, index: number) => {
      const chunk = chunks[index];
      const offset = chunks
        .slice(0, index)
        .reduce((sum, c) => sum + c.estimatedHeight, 0);
      
      return {
        length: chunk?.estimatedHeight || estimatedRowHeight,
        offset,
        index,
      };
    },
    [chunks, estimatedRowHeight]
  );
  
  if (debug) {
    console.log(`[VirtualizedContent] Rendering ${chunks.length} chunks from ${nodes.length} nodes`);
  }
  
  return (
    <FlatList<NodeChunk>
      data={chunks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
    />
  );
}

/**
 * Memoized VirtualizedContent
 */
export const VirtualizedContent = memo(VirtualizedContentComponent);

VirtualizedContent.displayName = 'VirtualizedContent';

/**
 * Check if content should be virtualized based on node count
 */
export function shouldVirtualize(
  nodes: HtmlNode[],
  threshold: number = 100
): boolean {
  let count = 0;
  
  function countNodes(nodeList: HtmlNode[]): void {
    for (const node of nodeList) {
      count++;
      if (count > threshold) return;
      if (isElementNode(node)) {
        countNodes(node.children);
      }
    }
  }
  
  countNodes(nodes);
  return count > threshold;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chunkContainer: {
    flexDirection: 'column',
  },
});

export { chunkNodes, estimateNodeHeight };

