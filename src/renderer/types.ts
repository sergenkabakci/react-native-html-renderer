/**
 * Renderer Types
 * Type definitions for the rendering system
 * @module renderer/types
 */

import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle, ImageStyle } from 'react-native';
import type { ElementNode, HtmlNode, ParserOptions } from '../parser/types';
import type { TagsStyles, ClassesStyles, StyleResolverConfig } from '../styles/styleResolver';
import type { HtmlPlugin, RenderersMap, PluginRegistry } from '../plugins';

/**
 * Link press handler
 */
export type LinkPressHandler = (url: string, node: ElementNode) => void;

/**
 * Image press handler
 */
export type ImagePressHandler = (src: string, node: ElementNode) => void;

/**
 * Main HTMLRenderer component props
 */
export interface HTMLRendererProps {
    /** HTML string to render */
    html: string;

    /** Custom styles for specific HTML tags */
    tagsStyles?: TagsStyles;

    /** Custom styles for CSS classes */
    classesStyles?: ClassesStyles;

    /** Custom renderers for specific tags (override defaults) */
    renderers?: RenderersMap;

    /** Base text style applied to all text */
    baseTextStyle?: TextStyle;

    /** Base container style */
    containerStyle?: ViewStyle;

    /** Handler for link presses */
    onLinkPress?: LinkPressHandler;

    /** Handler for image presses */
    onImagePress?: ImagePressHandler;

    /** Plugins to use */
    plugins?: HtmlPlugin[];

    /** Custom plugin registry (overrides default) */
    pluginRegistry?: PluginRegistry;

    /** Parser options */
    parserOptions?: Partial<ParserOptions>;

    /** Text accessibility scale factor */
    textScale?: number;

    /** Whether text is selectable */
    textSelectable?: boolean;

    /** Custom font mapping */
    customFonts?: Record<string, string>;

    /** Fallback component for unsupported tags */
    fallbackComponent?: React.ComponentType<FallbackProps>;

    /** Whether to enable debug mode */
    debug?: boolean;

    /** Key for the renderer (forces re-render when changed) */
    contentKey?: string;

    /** Enable virtualization for large content */
    enableVirtualization?: boolean;

    /** Estimated row height for virtualization */
    estimatedRowHeight?: number;

    /** Maximum number of nodes before virtualization is auto-enabled */
    virtualizationThreshold?: number;

    /** Error boundary fallback */
    errorBoundaryFallback?: ReactNode;

    /** Callback when rendering completes */
    onRenderComplete?: (nodeCount: number) => void;

    /** Callback when an error occurs */
    onError?: (error: Error) => void;
}

/**
 * Props passed to fallback component
 */
export interface FallbackProps {
    /** The unsupported tag name */
    tagName: string;
    /** The full node */
    node: ElementNode;
    /** Children of the node */
    children: ReactNode;
}

/**
 * Node renderer props
 */
export interface NodeRendererProps {
    /** Node to render */
    node: HtmlNode;
    /** Parent element node */
    parent?: ElementNode;
    /** Nesting depth */
    depth: number;
    /** Index in parent's children */
    index: number;
    /** Style resolver function */
    resolveStyle: (node: ElementNode) => { style: ViewStyle | TextStyle | ImageStyle };
    /** Custom renderers */
    renderers: RenderersMap;
    /** Plugin registry */
    pluginRegistry: PluginRegistry;
    /** Link press handler */
    onLinkPress?: LinkPressHandler;
    /** Image press handler */
    onImagePress?: ImagePressHandler;
    /** Text scale */
    textScale: number;
    /** Text selectable */
    textSelectable: boolean;
    /** Custom fonts */
    customFonts?: Record<string, string>;
    /** Fallback component */
    fallbackComponent?: React.ComponentType<FallbackProps>;
    /** Debug mode */
    debug: boolean;
}

/**
 * Text renderer props
 */
export interface TextRendererProps {
    /** Text content */
    content: string;
    /** Style to apply */
    style?: TextStyle;
    /** Whether text is selectable */
    selectable?: boolean;
    /** Text scale factor */
    textScale?: number;
}

/**
 * Internal render context
 */
export interface InternalRenderContext {
    resolveStyle: (node: ElementNode) => { style: ViewStyle | TextStyle | ImageStyle };
    renderers: RenderersMap;
    pluginRegistry: PluginRegistry;
    onLinkPress?: LinkPressHandler;
    onImagePress?: ImagePressHandler;
    textScale: number;
    textSelectable: boolean;
    customFonts?: Record<string, string>;
    fallbackComponent?: React.ComponentType<FallbackProps>;
    debug: boolean;
}

