/**
 * Style Resolver
 * Combines styles from multiple sources into final computed styles
 * @module styles/styleResolver
 */

import type { TextStyle, ViewStyle, ImageStyle } from 'react-native';
import type { ElementNode, HtmlNode } from '../parser/types';
import { NodeType, isElementNode } from '../parser/types';
import { parseInlineStyle, mergeStyles, type RNStyle } from './styleParser';
import { getDefaultTagStyle, isTextOnlyTag } from './defaultStyles';

/**
 * User-provided tag styles mapping
 */
export type TagsStyles = Record<string, ViewStyle | TextStyle>;

/**
 * User-provided class styles mapping
 */
export type ClassesStyles = Record<string, ViewStyle | TextStyle>;

/**
 * Style resolver configuration
 */
export interface StyleResolverConfig {
    /** Custom styles for specific tags */
    tagsStyles?: TagsStyles;
    /** Custom styles for CSS classes */
    classesStyles?: ClassesStyles;
    /** Base text style applied to all text */
    baseTextStyle?: TextStyle;
    /** Whether to use default tag styles */
    useDefaultStyles?: boolean;
    /** Custom style transformer */
    styleTransformer?: (style: RNStyle, node: ElementNode) => RNStyle;
}

/**
 * Resolved styles result
 */
export interface ResolvedStyle {
    /** Combined style object */
    style: ViewStyle | TextStyle | ImageStyle;
    /** Whether this is a text-only element */
    isTextElement: boolean;
    /** Whether element has any custom styles */
    hasCustomStyles: boolean;
}

/**
 * Create a style resolver with the given configuration
 * 
 * @param config - Style resolver configuration
 * @returns Style resolver function
 * 
 * @example
 * ```typescript
 * const resolver = createStyleResolver({
 *   tagsStyles: { p: { color: 'blue' } },
 *   classesStyles: { highlight: { backgroundColor: 'yellow' } },
 * });
 * 
 * const { style } = resolver(elementNode);
 * ```
 */
export function createStyleResolver(config: StyleResolverConfig = {}) {
    const {
        tagsStyles = {},
        classesStyles = {},
        baseTextStyle = {},
        useDefaultStyles = true,
        styleTransformer,
    } = config;

    /**
     * Resolve styles for an element node
     */
    return function resolveStyle(node: ElementNode): ResolvedStyle {
        const styles: RNStyle[] = [];
        const isText = isTextOnlyTag(node.tagName);
        let hasCustomStyles = false;

        // 1. Apply base text style for text elements
        if (isText && Object.keys(baseTextStyle).length > 0) {
            styles.push(baseTextStyle);
        }

        // 2. Apply default tag styles
        if (useDefaultStyles) {
            const defaultStyle = getDefaultTagStyle(node.tagName);
            if (Object.keys(defaultStyle).length > 0) {
                styles.push(defaultStyle);
            }
        }

        // 3. Apply user-defined tag styles
        const tagStyle = tagsStyles[node.tagName];
        if (tagStyle) {
            styles.push(tagStyle);
            hasCustomStyles = true;
        }

        // 4. Apply class-based styles
        if (node.classNames && node.classNames.length > 0) {
            for (const className of node.classNames) {
                const classStyle = classesStyles[className];
                if (classStyle) {
                    styles.push(classStyle);
                    hasCustomStyles = true;
                }
            }
        }

        // 5. Apply inline styles (highest priority)
        if (node.attributes.style) {
            const inlineStyle = parseInlineStyle(node.attributes.style);
            if (Object.keys(inlineStyle).length > 0) {
                styles.push(inlineStyle);
                hasCustomStyles = true;
            }
        }

        // 6. Merge all styles
        let finalStyle = mergeStyles(...styles);

        // 7. Apply custom transformer if provided
        if (styleTransformer) {
            finalStyle = styleTransformer(finalStyle, node);
        }

        return {
            style: finalStyle,
            isTextElement: isText,
            hasCustomStyles,
        };
    };
}

/**
 * Default style resolver instance
 */
export const defaultStyleResolver = createStyleResolver();

/**
 * Resolve styles for an entire AST tree
 * Adds parsedStyles to each element node
 * 
 * @param nodes - AST nodes
 * @param config - Style resolver configuration
 * @returns Nodes with styles resolved
 */
export function resolveTreeStyles(
    nodes: HtmlNode[],
    config: StyleResolverConfig = {}
): HtmlNode[] {
    const resolver = createStyleResolver(config);

    function processNode(node: HtmlNode): HtmlNode {
        if (!isElementNode(node)) {
            return node;
        }

        const { style } = resolver(node);
        const processedChildren = node.children.map(processNode);

        return {
            ...node,
            parsedStyles: style,
            children: processedChildren,
        };
    }

    return nodes.map(processNode);
}

/**
 * Extract all unique class names from an AST
 * 
 * @param nodes - AST nodes
 * @returns Set of unique class names
 */
export function extractClassNames(nodes: HtmlNode[]): Set<string> {
    const classNames = new Set<string>();

    function traverse(node: HtmlNode): void {
        if (node.type === NodeType.Element) {
            if (node.classNames) {
                node.classNames.forEach(cn => classNames.add(cn));
            }
            node.children.forEach(traverse);
        }
    }

    nodes.forEach(traverse);
    return classNames;
}

/**
 * Create responsive styles based on screen dimensions
 * 
 * @param baseStyle - Base style
 * @param breakpoints - Breakpoint configurations
 * @param width - Current screen width
 * @returns Responsive style
 */
export function createResponsiveStyle(
    baseStyle: RNStyle,
    breakpoints: {
        sm?: RNStyle; // < 640px
        md?: RNStyle; // >= 640px
        lg?: RNStyle; // >= 1024px
        xl?: RNStyle; // >= 1280px
    },
    width: number
): RNStyle {
    let responsiveStyle = { ...baseStyle };

    if (width < 640 && breakpoints.sm) {
        responsiveStyle = mergeStyles(responsiveStyle, breakpoints.sm);
    } else if (width >= 640 && width < 1024 && breakpoints.md) {
        responsiveStyle = mergeStyles(responsiveStyle, breakpoints.md);
    } else if (width >= 1024 && width < 1280 && breakpoints.lg) {
        responsiveStyle = mergeStyles(responsiveStyle, breakpoints.lg);
    } else if (width >= 1280 && breakpoints.xl) {
        responsiveStyle = mergeStyles(responsiveStyle, breakpoints.xl);
    }

    return responsiveStyle;
}

/**
 * Scale styles based on a font scale factor
 * 
 * @param style - Style to scale
 * @param scale - Scale factor
 * @returns Scaled style
 */
export function scaleTextStyles(style: TextStyle, scale: number): TextStyle {
    const scaled = { ...style };

    const scaleProps: (keyof TextStyle)[] = [
        'fontSize',
        'lineHeight',
        'letterSpacing',
    ];

    for (const prop of scaleProps) {
        if (typeof scaled[prop] === 'number') {
            (scaled as Record<string, number>)[prop] = (scaled[prop] as number) * scale;
        }
    }

    return scaled;
}

