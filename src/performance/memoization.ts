/**
 * Memoization Utilities
 * Provides helpers for optimizing render performance
 * @module performance/memoization
 */

import { useMemo, useRef, useCallback } from 'react';
import type { HtmlNode, ElementNode } from '../parser/types';
import { NodeType } from '../parser/types';

/**
 * Create a stable key generator for nodes
 * Uses content hashing for better cache hits
 */
export function createNodeKeyGenerator() {
    let counter = 0;
    const keyMap = new WeakMap<HtmlNode, string>();

    return function getKey(node: HtmlNode): string {
        let key = keyMap.get(node);
        if (!key) {
            key = `node-${++counter}`;
            keyMap.set(node, key);
        }
        return key;
    };
}

/**
 * Create a content hash for a node tree
 * Useful for determining if content has changed
 */
export function hashNodeTree(nodes: HtmlNode[]): string {
    const parts: string[] = [];

    function hashNode(node: HtmlNode): void {
        if (node.type === NodeType.Text) {
            parts.push(`t:${node.content.slice(0, 20)}`);
        } else if (node.type === NodeType.Element) {
            const el = node as ElementNode;
            parts.push(`e:${el.tagName}`);
            if (el.attributes.class) parts.push(`c:${el.attributes.class}`);
            if (el.attributes.id) parts.push(`i:${el.attributes.id}`);
            el.children.forEach(hashNode);
        }
    }

    nodes.forEach(hashNode);
    return parts.join('|');
}

/**
 * Hook for memoizing node trees
 * Only re-computes when content changes
 */
export function useMemoizedNodes<T>(
    nodes: HtmlNode[],
    transform: (nodes: HtmlNode[]) => T,
    deps: unknown[] = []
): T {
    const hashRef = useRef<string>('');
    const resultRef = useRef<T | null>(null);

    return useMemo(() => {
        const hash = hashNodeTree(nodes);

        if (hash !== hashRef.current || resultRef.current === null) {
            hashRef.current = hash;
            resultRef.current = transform(nodes);
        }

        return resultRef.current;
    }, [nodes, ...deps]);
}

/**
 * Compare two node arrays for equality
 * Shallow comparison based on keys
 */
export function areNodesEqual(a: HtmlNode[], b: HtmlNode[]): boolean {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
        if (a[i].key !== b[i].key) return false;
    }

    return true;
}

/**
 * Deep compare two node trees
 */
export function areNodesDeepEqual(a: HtmlNode[], b: HtmlNode[]): boolean {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
        const nodeA = a[i];
        const nodeB = b[i];

        if (nodeA.type !== nodeB.type) return false;

        if (nodeA.type === NodeType.Text && nodeB.type === NodeType.Text) {
            if (nodeA.content !== nodeB.content) return false;
        }

        if (nodeA.type === NodeType.Element && nodeB.type === NodeType.Element) {
            if (nodeA.tagName !== nodeB.tagName) return false;
            if (!areNodesDeepEqual(nodeA.children, nodeB.children)) return false;
        }
    }

    return true;
}

/**
 * Create a memoized renderer function
 */
export function createMemoizedRenderer<T>(
    render: (nodes: HtmlNode[]) => T
): (nodes: HtmlNode[]) => T {
    let lastNodes: HtmlNode[] | null = null;
    let lastResult: T | null = null;

    return function memoizedRender(nodes: HtmlNode[]): T {
        if (lastNodes && areNodesEqual(nodes, lastNodes)) {
            return lastResult!;
        }

        lastNodes = nodes;
        lastResult = render(nodes);
        return lastResult;
    };
}

/**
 * Hook for creating a stable callback that only changes when nodes change
 */
export function useStableNodesCallback<T extends (...args: unknown[]) => unknown>(
    nodes: HtmlNode[],
    callback: T
): T {
    const hashRef = useRef(hashNodeTree(nodes));
    const callbackRef = useRef(callback);

    const currentHash = hashNodeTree(nodes);
    if (currentHash !== hashRef.current) {
        hashRef.current = currentHash;
        callbackRef.current = callback;
    }

    return useCallback(
        ((...args) => callbackRef.current(...args)) as T,
        []
    );
}

/**
 * LRU cache for parsed/rendered content
 */
export class ContentCache<T> {
    private cache = new Map<string, { value: T; timestamp: number }>();
    private maxSize: number;
    private maxAge: number;

    constructor(maxSize: number = 50, maxAgeMs: number = 60000) {
        this.maxSize = maxSize;
        this.maxAge = maxAgeMs;
    }

    get(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;

        // Check if expired
        if (Date.now() - entry.timestamp > this.maxAge) {
            this.cache.delete(key);
            return undefined;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value;
    }

    set(key: string, value: T): void {
        // Remove oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, { value, timestamp: Date.now() });
    }

    has(key: string): boolean {
        return this.cache.has(key);
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

/**
 * Global cache instance for parsed HTML
 */
export const globalParseCache = new ContentCache<HtmlNode[]>();

