/**
 * AST Node Types for HTML parsing
 * @module parser/types
 */

import type { TextStyle, ViewStyle, ImageStyle } from 'react-native';

/**
 * Enumeration of node types in the AST
 */
export enum NodeType {
    /** Element node (e.g., div, span, p) */
    Element = 'element',
    /** Text content node */
    Text = 'text',
    /** Comment node (usually ignored in rendering) */
    Comment = 'comment',
}

/**
 * Base interface for all AST nodes
 */
export interface BaseNode {
    /** Type of the node */
    type: NodeType;
    /** Unique identifier for the node (used for React keys) */
    key: string;
    /** Parent node reference (null for root nodes) */
    parent?: ElementNode;
}

/**
 * Text node containing raw text content
 */
export interface TextNode extends BaseNode {
    type: NodeType.Text;
    /** The actual text content */
    content: string;
}

/**
 * HTML attributes parsed from the element
 */
export interface HtmlAttributes {
    /** Inline style string */
    style?: string;
    /** CSS class names */
    class?: string;
    /** Element ID */
    id?: string;
    /** Link href */
    href?: string;
    /** Image source */
    src?: string;
    /** Image alt text */
    alt?: string;
    /** Element width */
    width?: string;
    /** Element height */
    height?: string;
    /** Any other attributes */
    [key: string]: string | undefined;
}

/**
 * Element node representing an HTML tag
 */
export interface ElementNode extends BaseNode {
    type: NodeType.Element;
    /** Tag name (lowercase) */
    tagName: string;
    /** Raw HTML attributes */
    attributes: HtmlAttributes;
    /** Child nodes */
    children: HtmlNode[];
    /** Parsed inline styles (React Native compatible) */
    parsedStyles?: ViewStyle | TextStyle | ImageStyle;
    /** CSS class names as array */
    classNames?: string[];
}

/**
 * Comment node (usually not rendered)
 */
export interface CommentNode extends BaseNode {
    type: NodeType.Comment;
    /** Comment content */
    content: string;
}

/**
 * Union type for all possible AST nodes
 */
export type HtmlNode = ElementNode | TextNode | CommentNode;

/**
 * Result of parsing HTML
 */
export interface ParseResult {
    /** Root nodes of the parsed HTML */
    nodes: HtmlNode[];
    /** Any errors encountered during parsing */
    errors: ParseError[];
}

/**
 * Parse error information
 */
export interface ParseError {
    /** Error message */
    message: string;
    /** Position in the HTML string where error occurred */
    position?: number;
}

/**
 * Options for the HTML parser
 */
export interface ParserOptions {
    /** Whether to decode HTML entities */
    decodeEntities?: boolean;
    /** Whether to normalize whitespace */
    normalizeWhitespace?: boolean;
    /** Tags to treat as self-closing */
    selfClosingTags?: string[];
    /** Tags whose content should be treated as raw text */
    rawTextTags?: string[];
}

/**
 * Type guard to check if a node is an ElementNode
 */
export function isElementNode(node: HtmlNode): node is ElementNode {
    return node.type === NodeType.Element;
}

/**
 * Type guard to check if a node is a TextNode
 */
export function isTextNode(node: HtmlNode): node is TextNode {
    return node.type === NodeType.Text;
}

/**
 * Type guard to check if a node is a CommentNode
 */
export function isCommentNode(node: HtmlNode): node is CommentNode {
    return node.type === NodeType.Comment;
}

/**
 * Supported HTML tags for the renderer
 */
export const SUPPORTED_TAGS = [
    // Block elements
    'div', 'p', 'blockquote', 'article', 'section', 'header', 'footer', 'main', 'aside', 'nav',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Text formatting
    'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
    // Lists
    'ul', 'ol', 'li',
    // Links and media
    'a', 'img', 'br', 'hr',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    // Code
    'pre', 'code',
    // Other
    'figure', 'figcaption', 'details', 'summary',
] as const;

export type SupportedTag = typeof SUPPORTED_TAGS[number];

/**
 * Check if a tag is supported
 */
export function isSupportedTag(tag: string): tag is SupportedTag {
    return SUPPORTED_TAGS.includes(tag as SupportedTag);
}

/**
 * Block-level tags (create new lines/blocks)
 */
export const BLOCK_TAGS = new Set([
    'div', 'p', 'blockquote', 'article', 'section', 'header', 'footer', 'main', 'aside', 'nav',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tfoot', 'tr',
    'pre', 'figure', 'figcaption', 'details', 'summary', 'hr',
]);

/**
 * Inline tags (flow within text)
 */
export const INLINE_TAGS = new Set([
    'span', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
    'a', 'code', 'br',
]);

/**
 * Self-closing tags
 */
export const SELF_CLOSING_TAGS = new Set([
    'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr',
]);

/**
 * Check if a tag is block-level
 */
export function isBlockTag(tag: string): boolean {
    return BLOCK_TAGS.has(tag);
}

/**
 * Check if a tag is inline
 */
export function isInlineTag(tag: string): boolean {
    return INLINE_TAGS.has(tag);
}

/**
 * Check if a tag is self-closing
 */
export function isSelfClosingTag(tag: string): boolean {
    return SELF_CLOSING_TAGS.has(tag);
}

