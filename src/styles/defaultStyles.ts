/**
 * Default styles for HTML tags
 * These provide sensible defaults matching browser rendering
 * @module styles/defaultStyles
 */

import type { TextStyle, ViewStyle, ImageStyle } from 'react-native';

/**
 * Default text style applied to all text
 */
export const defaultTextStyle: TextStyle = {
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
};

/**
 * Default styles for each supported HTML tag
 */
export const defaultTagStyles: Record<string, ViewStyle | TextStyle | ImageStyle> = {
    // Block elements
    div: {
        flexDirection: 'column',
    },

    p: {
        marginVertical: 12,
    },

    blockquote: {
        marginVertical: 16,
        marginHorizontal: 0,
        paddingLeft: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#e0e0e0',
        fontStyle: 'italic',
        color: '#666666',
    },

    article: {
        flexDirection: 'column',
    },

    section: {
        flexDirection: 'column',
    },

    header: {
        flexDirection: 'column',
    },

    footer: {
        flexDirection: 'column',
    },

    main: {
        flexDirection: 'column',
    },

    aside: {
        flexDirection: 'column',
    },

    nav: {
        flexDirection: 'column',
    },

    // Headings
    h1: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 16,
        lineHeight: 40,
    },

    h2: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 14,
        lineHeight: 36,
    },

    h3: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 18,
        marginBottom: 12,
        lineHeight: 32,
    },

    h4: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 10,
        lineHeight: 28,
    },

    h5: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 14,
        marginBottom: 8,
        lineHeight: 26,
    },

    h6: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 8,
        lineHeight: 24,
    },

    // Text formatting
    span: {},

    strong: {
        fontWeight: 'bold',
    },

    b: {
        fontWeight: 'bold',
    },

    em: {
        fontStyle: 'italic',
    },

    i: {
        fontStyle: 'italic',
    },

    u: {
        textDecorationLine: 'underline',
    },

    s: {
        textDecorationLine: 'line-through',
    },

    strike: {
        textDecorationLine: 'line-through',
    },

    del: {
        textDecorationLine: 'line-through',
        color: '#888888',
    },

    ins: {
        textDecorationLine: 'underline',
        color: '#2e7d32',
    },

    mark: {
        backgroundColor: '#ffeb3b',
        color: '#1a1a1a',
    },

    small: {
        fontSize: 12,
    },

    sub: {
        fontSize: 12,
    },

    sup: {
        fontSize: 12,
    },

    // Lists
    ul: {
        marginVertical: 12,
        paddingLeft: 20,
    },

    ol: {
        marginVertical: 12,
        paddingLeft: 20,
    },

    li: {
        marginVertical: 4,
        flexDirection: 'row',
    },

    // Links
    a: {
        color: '#1976d2',
        textDecorationLine: 'underline',
    },

    // Images
    img: {},

    // Horizontal rule
    hr: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 16,
        borderWidth: 0,
    },

    // Tables
    table: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginVertical: 12,
    },

    thead: {
        backgroundColor: '#f5f5f5',
    },

    tbody: {},

    tfoot: {
        backgroundColor: '#f5f5f5',
    },

    tr: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },

    th: {
        flex: 1,
        padding: 8,
        fontWeight: 'bold',
        borderRightWidth: 1,
        borderRightColor: '#e0e0e0',
        textAlign: 'center',
    },

    td: {
        flex: 1,
        padding: 8,
        borderRightWidth: 1,
        borderRightColor: '#e0e0e0',
    },

    caption: {
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 8,
    },

    // Code
    pre: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 4,
        marginVertical: 12,
        overflow: 'hidden',
    },

    code: {
        fontFamily: 'monospace',
        fontSize: 14,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 2,
    },

    // Other
    figure: {
        alignItems: 'center',
        marginVertical: 16,
    },

    figcaption: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#666666',
        marginTop: 8,
        textAlign: 'center',
    },

    details: {
        marginVertical: 8,
    },

    summary: {
        fontWeight: 'bold',
    },

    // Line break (rendered as empty, but can have margin)
    br: {
        height: 0,
    },
};

/**
 * Get the default style for a tag
 * 
 * @param tagName - HTML tag name (lowercase)
 * @returns Default style for the tag or empty object
 */
export function getDefaultTagStyle(tagName: string): ViewStyle | TextStyle | ImageStyle {
    return defaultTagStyles[tagName] || {};
}

/**
 * Check if a tag is a text-only tag (content should be wrapped in Text)
 */
export const TEXT_ONLY_TAGS = new Set([
    'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'mark',
    'small', 'sub', 'sup', 'code', 'a',
]);

/**
 * Check if a tag should render as text
 */
export function isTextOnlyTag(tagName: string): boolean {
    return TEXT_ONLY_TAGS.has(tagName);
}

/**
 * Heading tags for special handling
 */
export const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * Check if a tag is a heading
 */
export function isHeadingTag(tagName: string): boolean {
    return HEADING_TAGS.has(tagName);
}

