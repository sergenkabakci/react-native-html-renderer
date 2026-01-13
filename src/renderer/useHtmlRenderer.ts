/**
 * useHtmlRenderer Hook
 * Provides imperative access to rendering functionality
 * @module renderer/useHtmlRenderer
 */

import React, { useMemo, useCallback, type ReactNode, type ReactElement } from 'react';
import { parseHtml } from '../parser/parser';
import type { HtmlNode, ParserOptions } from '../parser/types';
import { createStyleResolver, type StyleResolverConfig, type TagsStyles, type ClassesStyles } from '../styles/styleResolver';
import { createPluginRegistry, type PluginRegistry, type HtmlPlugin, type RenderersMap } from '../plugins';
import { RenderContextProvider } from './RenderContext';
import { NodesRenderer, NodeRenderer } from './NodeRenderer';
import type { FallbackProps } from './types';

/**
 * Options for useHtmlRenderer hook
 */
export interface UseHtmlRendererOptions {
    tagsStyles?: TagsStyles;
    classesStyles?: ClassesStyles;
    renderers?: RenderersMap;
    plugins?: HtmlPlugin[];
    pluginRegistry?: PluginRegistry;
    parserOptions?: Partial<ParserOptions>;
    textScale?: number;
    textSelectable?: boolean;
    customFonts?: Record<string, string>;
    fallbackComponent?: React.ComponentType<FallbackProps>;
    debug?: boolean;
}

/**
 * Return type for useHtmlRenderer
 */
export interface UseHtmlRendererResult {
    render: (html: string) => ReactNode;
    renderNodes: (nodes: HtmlNode[]) => ReactNode;
    renderNode: (node: HtmlNode, index?: number) => ReactNode;
    parseAndRender: (html: string) => ReactNode;
    pluginRegistry: PluginRegistry;
    registerPlugin: (plugin: HtmlPlugin) => void;
}

/**
 * Hook providing imperative HTML rendering
 */
export function useHtmlRenderer(
    options: UseHtmlRendererOptions = {}
): UseHtmlRendererResult {
    const {
        tagsStyles = {},
        classesStyles = {},
        renderers = {},
        plugins = [],
        pluginRegistry: customRegistry,
        parserOptions = {},
        textScale = 1,
        textSelectable = false,
        customFonts,
        fallbackComponent,
        debug = false,
    } = options;

    const registry = useMemo<PluginRegistry>(() => {
        if (customRegistry) return customRegistry;

        const reg = createPluginRegistry();
        for (const plugin of plugins) {
            try {
                reg.register(plugin);
            } catch (error) {
                if (debug) {
                    console.warn(`Failed to register plugin: ${plugin.name}`, error);
                }
            }
        }
        return reg;
    }, [customRegistry, plugins, debug]);

    const resolveStyle = useMemo(() => {
        const config: StyleResolverConfig = {
            tagsStyles,
            classesStyles,
            useDefaultStyles: true,
        };
        return createStyleResolver(config);
    }, [tagsStyles, classesStyles]);

    const mergedRenderers = useMemo<RenderersMap>(() => {
        return {
            ...registry.getRenderers(),
            ...renderers,
        };
    }, [registry, renderers]);

    const renderNodes = useCallback((nodes: HtmlNode[]): ReactElement => {
        const nodesElement = React.createElement(NodesRenderer, { nodes });
        return React.createElement(
            RenderContextProvider,
            {
                resolveStyle,
                renderers: mergedRenderers,
                pluginRegistry: registry,
                textScale,
                textSelectable,
                customFonts,
                FallbackComponent: fallbackComponent,
                debug,
                children: nodesElement,
            }
        );
    }, [resolveStyle, mergedRenderers, registry, textScale, textSelectable, customFonts, fallbackComponent, debug]);

    const renderNode = useCallback((node: HtmlNode, index: number = 0): ReactElement => {
        const nodeElement = React.createElement(NodeRenderer, { node, index });
        return React.createElement(
            RenderContextProvider,
            {
                resolveStyle,
                renderers: mergedRenderers,
                pluginRegistry: registry,
                textScale,
                textSelectable,
                customFonts,
                FallbackComponent: fallbackComponent,
                debug,
                children: nodeElement,
            }
        );
    }, [resolveStyle, mergedRenderers, registry, textScale, textSelectable, customFonts, fallbackComponent, debug]);

    const parseAndRender = useCallback((html: string): ReactNode => {
        const { nodes, errors } = parseHtml(html, parserOptions);
        if (errors.length > 0 || nodes.length === 0) {
            return null;
        }
        return renderNodes(nodes);
    }, [parserOptions, renderNodes]);

    const render = useCallback((html: string): ReactNode => {
        return parseAndRender(html);
    }, [parseAndRender]);

    const registerPlugin = useCallback((plugin: HtmlPlugin): void => {
        registry.register(plugin);
    }, [registry]);

    return {
        render,
        renderNodes,
        renderNode,
        parseAndRender,
        pluginRegistry: registry,
        registerPlugin,
    };
}

export default useHtmlRenderer;

