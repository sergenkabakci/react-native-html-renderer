/**
 * Plugin System Types
 * Define interfaces for extending the HTML renderer
 * @module plugins/pluginTypes
 */

import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle, ImageStyle } from 'react-native';
import type { ElementNode, HtmlNode } from '../parser/types';

/**
 * Context passed to custom renderers
 */
export interface RenderContext {
    /** The current node being rendered */
    node: ElementNode;
    /** Parent node (if any) */
    parent?: ElementNode;
    /** Resolved style for the node */
    style: ViewStyle | TextStyle | ImageStyle;
    /** Children nodes */
    children: HtmlNode[];
    /** Render function for children */
    renderChildren: () => ReactNode;
    /** Current nesting depth */
    depth: number;
    /** Index within parent */
    index: number;
    /** Link press handler */
    onLinkPress?: (url: string, node: ElementNode) => void;
    /** Image press handler */
    onImagePress?: (src: string, node: ElementNode) => void;
    /** Text scale factor */
    textScale: number;
    /** Default renderer for fallback */
    defaultRenderer: (node: ElementNode) => ReactNode;
}

/**
 * Custom tag renderer function
 */
export type TagRenderer = (context: RenderContext) => ReactNode;

/**
 * Map of tag names to custom renderers
 */
export type RenderersMap = Record<string, TagRenderer>;

/**
 * Node transform function
 * Can modify nodes before rendering
 */
export type NodeTransform = (node: HtmlNode, parent?: ElementNode) => HtmlNode | null;

/**
 * Plugin interface for extending the renderer
 */
export interface HtmlPlugin {
    /** Unique plugin name */
    name: string;

    /** Priority (lower = earlier execution) */
    priority?: number;

    /** Custom tag renderers */
    tagRenderers?: RenderersMap;

    /** Node transforms applied before rendering */
    nodeTransforms?: NodeTransform[];

    /** Style modifiers applied to resolved styles */
    styleModifiers?: Record<string, (style: ViewStyle | TextStyle) => ViewStyle | TextStyle>;

    /** Setup function called when plugin is registered */
    setup?: () => void;

    /** Cleanup function called when plugin is unregistered */
    cleanup?: () => void;
}

/**
 * Plugin registry state
 */
export interface PluginRegistryState {
    /** Registered plugins by name */
    plugins: Map<string, HtmlPlugin>;
    /** Merged tag renderers from all plugins */
    renderers: RenderersMap;
    /** All node transforms in order */
    transforms: NodeTransform[];
    /** All style modifiers */
    styleModifiers: Record<string, (style: ViewStyle | TextStyle) => ViewStyle | TextStyle>;
}

/**
 * Plugin registration options
 */
export interface RegisterPluginOptions {
    /** Replace existing plugin with same name */
    replace?: boolean;
}

/**
 * Result of applying transforms to a node
 */
export interface TransformResult {
    /** Transformed node (or null if filtered) */
    node: HtmlNode | null;
    /** Whether any transform was applied */
    transformed: boolean;
}

