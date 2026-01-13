/**
 * Plugin Registry
 * Manages plugins and provides merged configuration
 * @module plugins/pluginRegistry
 */

import type { TextStyle, ViewStyle } from 'react-native';
import type { HtmlNode, ElementNode } from '../parser/types';
import type {
    HtmlPlugin,
    PluginRegistryState,
    RenderersMap,
    NodeTransform,
    RegisterPluginOptions,
    TransformResult,
} from './pluginTypes';

/**
 * Create a new plugin registry
 * 
 * @returns Plugin registry instance
 * 
 * @example
 * ```typescript
 * const registry = createPluginRegistry();
 * 
 * registry.register({
 *   name: 'custom-video',
 *   tagRenderers: {
 *     video: (ctx) => <CustomVideo src={ctx.node.attributes.src} />,
 *   },
 * });
 * ```
 */
export function createPluginRegistry() {
    const state: PluginRegistryState = {
        plugins: new Map(),
        renderers: {},
        transforms: [],
        styleModifiers: {},
    };

    /**
     * Rebuild merged state from all plugins
     */
    function rebuildState(): void {
        // Sort plugins by priority
        const sortedPlugins = Array.from(state.plugins.values())
            .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

        // Merge renderers
        state.renderers = {};
        for (const plugin of sortedPlugins) {
            if (plugin.tagRenderers) {
                Object.assign(state.renderers, plugin.tagRenderers);
            }
        }

        // Collect transforms
        state.transforms = [];
        for (const plugin of sortedPlugins) {
            if (plugin.nodeTransforms) {
                state.transforms.push(...plugin.nodeTransforms);
            }
        }

        // Merge style modifiers
        state.styleModifiers = {};
        for (const plugin of sortedPlugins) {
            if (plugin.styleModifiers) {
                Object.assign(state.styleModifiers, plugin.styleModifiers);
            }
        }
    }

    return {
        /**
         * Register a plugin
         */
        register(plugin: HtmlPlugin, options: RegisterPluginOptions = {}): void {
            if (state.plugins.has(plugin.name) && !options.replace) {
                throw new Error(`Plugin "${plugin.name}" is already registered`);
            }

            // Call setup if provided
            plugin.setup?.();

            state.plugins.set(plugin.name, plugin);
            rebuildState();
        },

        /**
         * Unregister a plugin by name
         */
        unregister(name: string): boolean {
            const plugin = state.plugins.get(name);
            if (!plugin) return false;

            // Call cleanup if provided
            plugin.cleanup?.();

            state.plugins.delete(name);
            rebuildState();
            return true;
        },

        /**
         * Get a registered plugin by name
         */
        get(name: string): HtmlPlugin | undefined {
            return state.plugins.get(name);
        },

        /**
         * Check if a plugin is registered
         */
        has(name: string): boolean {
            return state.plugins.has(name);
        },

        /**
         * Get all registered plugin names
         */
        getNames(): string[] {
            return Array.from(state.plugins.keys());
        },

        /**
         * Get merged renderers from all plugins
         */
        getRenderers(): RenderersMap {
            return { ...state.renderers };
        },

        /**
         * Get renderer for a specific tag
         */
        getRenderer(tagName: string) {
            return state.renderers[tagName];
        },

        /**
         * Check if a custom renderer exists for a tag
         */
        hasRenderer(tagName: string): boolean {
            return tagName in state.renderers;
        },

        /**
         * Get all node transforms
         */
        getTransforms(): NodeTransform[] {
            return [...state.transforms];
        },

        /**
         * Apply all transforms to a node
         */
        applyTransforms(node: HtmlNode, parent?: ElementNode): TransformResult {
            let current: HtmlNode | null = node;
            let transformed = false;

            for (const transform of state.transforms) {
                if (!current) break;

                const result = transform(current, parent);
                if (result !== current) {
                    transformed = true;
                    current = result;
                }
            }

            return { node: current, transformed };
        },

        /**
         * Get style modifier for a tag
         */
        getStyleModifier(tagName: string): ((style: ViewStyle | TextStyle) => ViewStyle | TextStyle) | undefined {
            return state.styleModifiers[tagName];
        },

        /**
         * Apply style modifier for a tag
         */
        applyStyleModifier(tagName: string, style: ViewStyle | TextStyle): ViewStyle | TextStyle {
            const modifier = state.styleModifiers[tagName];
            return modifier ? modifier(style) : style;
        },

        /**
         * Clear all plugins
         */
        clear(): void {
            for (const plugin of state.plugins.values()) {
                plugin.cleanup?.();
            }
            state.plugins.clear();
            rebuildState();
        },

        /**
         * Get the current state (for debugging)
         */
        getState(): Readonly<PluginRegistryState> {
            return { ...state };
        },
    };
}

/**
 * Default global plugin registry
 */
export const defaultPluginRegistry = createPluginRegistry();

/**
 * Shorthand to register a plugin to the default registry
 */
export function registerPlugin(plugin: HtmlPlugin, options?: RegisterPluginOptions): void {
    defaultPluginRegistry.register(plugin, options);
}

/**
 * Shorthand to unregister a plugin from the default registry
 */
export function unregisterPlugin(name: string): boolean {
    return defaultPluginRegistry.unregister(name);
}

/**
 * Type for plugin registry
 */
export type PluginRegistry = ReturnType<typeof createPluginRegistry>;

