/**
 * HTML Parser using htmlparser2
 * Converts HTML string into an AST suitable for React Native rendering
 * @module parser/parser
 */

import { Parser, DomHandler } from 'htmlparser2';
import type {
    HtmlNode,
    ElementNode,
    TextNode,
    ParseResult,
    ParseError,
    ParserOptions,
    HtmlAttributes,
} from './types';
import { NodeType } from './types';

/**
 * Default parser options
 */
const DEFAULT_OPTIONS: ParserOptions = {
    decodeEntities: true,
    normalizeWhitespace: true,
    selfClosingTags: ['img', 'br', 'hr', 'input', 'meta', 'link'],
    rawTextTags: ['script', 'style'],
};

/**
 * Generate a unique key for React reconciliation
 */
let keyCounter = 0;
function generateKey(): string {
    return `html-node-${++keyCounter}`;
}

/**
 * Reset key counter (useful for testing)
 */
export function resetKeyCounter(): void {
    keyCounter = 0;
}

/**
 * Normalize whitespace in text content
 * Collapses multiple spaces and trims
 */
function normalizeText(text: string, preserveWhitespace: boolean = false): string {
    if (preserveWhitespace) {
        return text;
    }
    // Collapse multiple whitespace to single space
    return text.replace(/\s+/g, ' ');
}

/**
 * Check if text is only whitespace
 */
function isWhitespaceOnly(text: string): boolean {
    return /^\s*$/.test(text);
}

/**
 * Parse HTML attributes from htmlparser2 format
 */
function parseAttributes(attrs: Record<string, string>): HtmlAttributes {
    const result: HtmlAttributes = {};
    for (const [key, value] of Object.entries(attrs)) {
        result[key.toLowerCase()] = value;
    }
    return result;
}

/**
 * Convert htmlparser2 DOM node to our AST format
 */
function convertNode(
    node: any,
    parent: ElementNode | undefined,
    options: ParserOptions
): HtmlNode | null {
    if (node.type === 'text') {
        const content = options.normalizeWhitespace
            ? normalizeText(node.data)
            : node.data;

        // Skip empty text nodes
        if (isWhitespaceOnly(content) && options.normalizeWhitespace) {
            return null;
        }

        const textNode: TextNode = {
            type: NodeType.Text,
            key: generateKey(),
            content,
            parent,
        };
        return textNode;
    }

    if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
        const tagName = node.name.toLowerCase();

        // Skip script and style tags
        if (tagName === 'script' || tagName === 'style') {
            return null;
        }

        const elementNode: ElementNode = {
            type: NodeType.Element,
            key: generateKey(),
            tagName,
            attributes: parseAttributes(node.attribs || {}),
            children: [],
            parent,
        };

        // Parse class names
        if (elementNode.attributes.class) {
            elementNode.classNames = elementNode.attributes.class
                .split(/\s+/)
                .filter(Boolean);
        }

        // Process children
        if (node.children) {
            for (const child of node.children) {
                const convertedChild = convertNode(child, elementNode, options);
                if (convertedChild) {
                    elementNode.children.push(convertedChild);
                }
            }
        }

        return elementNode;
    }

    if (node.type === 'comment') {
        // Skip comments - they don't render
        return null;
    }

    return null;
}

/**
 * Post-process AST to merge adjacent text nodes and clean up
 */
function postProcess(nodes: HtmlNode[]): HtmlNode[] {
    const result: HtmlNode[] = [];

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (node.type === NodeType.Text) {
            // Merge with previous text node if exists
            const prev = result[result.length - 1];
            if (prev && prev.type === NodeType.Text) {
                prev.content += node.content;
                continue;
            }
        }

        if (node.type === NodeType.Element) {
            // Recursively post-process children
            node.children = postProcess(node.children);
        }

        result.push(node);
    }

    // Trim leading/trailing whitespace from text nodes at boundaries
    if (result.length > 0) {
        const first = result[0];
        if (first.type === NodeType.Text) {
            first.content = first.content.trimStart();
            if (!first.content) {
                result.shift();
            }
        }

        const last = result[result.length - 1];
        if (last && last.type === NodeType.Text) {
            last.content = last.content.trimEnd();
            if (!last.content) {
                result.pop();
            }
        }
    }

    return result;
}

/**
 * Parse HTML string into an AST
 * 
 * @param html - The HTML string to parse
 * @param options - Parser options
 * @returns ParseResult containing nodes and any errors
 * 
 * @example
 * ```typescript
 * const { nodes, errors } = parseHtml('<div><p>Hello World</p></div>');
 * if (errors.length === 0) {
 *   // Process nodes
 * }
 * ```
 */
export function parseHtml(
    html: string,
    options: Partial<ParserOptions> = {}
): ParseResult {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const errors: ParseError[] = [];
    let nodes: HtmlNode[] = [];

    try {
        // Use DomHandler to build a DOM tree
        const handler = new DomHandler((error, dom) => {
            if (error) {
                errors.push({
                    message: error.message,
                });
                return;
            }

            // Convert DOM to our AST format
            for (const node of dom) {
                const converted = convertNode(node, undefined, mergedOptions);
                if (converted) {
                    nodes.push(converted);
                }
            }
        }, {
            withStartIndices: false,
            withEndIndices: false,
        });

        // Create parser with options
        const parser = new Parser(handler, {
            decodeEntities: mergedOptions.decodeEntities,
            lowerCaseTags: true,
            lowerCaseAttributeNames: true,
        });

        // Parse the HTML
        parser.write(html);
        parser.end();

        // Post-process to clean up whitespace
        if (mergedOptions.normalizeWhitespace) {
            nodes = postProcess(nodes);
        }

    } catch (error) {
        errors.push({
            message: error instanceof Error ? error.message : 'Unknown parsing error',
        });
    }

    return { nodes, errors };
}

/**
 * Parse HTML and return only the nodes (throws on error)
 * 
 * @param html - The HTML string to parse
 * @returns Array of AST nodes
 * @throws Error if parsing fails
 * 
 * @example
 * ```typescript
 * const nodes = parseHtmlStrict('<p>Hello</p>');
 * ```
 */
export function parseHtmlStrict(html: string): HtmlNode[] {
    const { nodes, errors } = parseHtml(html);
    if (errors.length > 0) {
        throw new Error(`HTML parsing failed: ${errors.map(e => e.message).join(', ')}`);
    }
    return nodes;
}

/**
 * Walk the AST and call visitor for each node
 * 
 * @param nodes - Root nodes to walk
 * @param visitor - Callback function for each node
 * 
 * @example
 * ```typescript
 * walkAst(nodes, (node) => {
 *   if (node.type === NodeType.Element) {
 *     console.log(node.tagName);
 *   }
 * });
 * ```
 */
export function walkAst(
    nodes: HtmlNode[],
    visitor: (node: HtmlNode, parent?: ElementNode) => void | false
): void {
    function walk(nodeList: HtmlNode[], parent?: ElementNode): void {
        for (const node of nodeList) {
            const result = visitor(node, parent);
            if (result === false) {
                continue; // Skip children
            }
            if (node.type === NodeType.Element) {
                walk(node.children, node);
            }
        }
    }
    walk(nodes);
}

/**
 * Find all nodes matching a predicate
 * 
 * @param nodes - Root nodes to search
 * @param predicate - Function to test each node
 * @returns Array of matching nodes
 */
export function findNodes(
    nodes: HtmlNode[],
    predicate: (node: HtmlNode) => boolean
): HtmlNode[] {
    const result: HtmlNode[] = [];
    walkAst(nodes, (node) => {
        if (predicate(node)) {
            result.push(node);
        }
    });
    return result;
}

/**
 * Find all elements by tag name
 * 
 * @param nodes - Root nodes to search
 * @param tagName - Tag name to find (case insensitive)
 * @returns Array of matching element nodes
 */
export function findByTag(nodes: HtmlNode[], tagName: string): ElementNode[] {
    const lowerTag = tagName.toLowerCase();
    return findNodes(nodes, (node) =>
        node.type === NodeType.Element && node.tagName === lowerTag
    ) as ElementNode[];
}

/**
 * Find element by ID
 * 
 * @param nodes - Root nodes to search
 * @param id - ID to find
 * @returns Matching element or undefined
 */
export function findById(nodes: HtmlNode[], id: string): ElementNode | undefined {
    let result: ElementNode | undefined;
    walkAst(nodes, (node) => {
        if (node.type === NodeType.Element && node.attributes.id === id) {
            result = node;
            return false; // Stop walking
        }
    });
    return result;
}

/**
 * Count total nodes in the AST
 * 
 * @param nodes - Root nodes
 * @returns Total count of all nodes
 */
export function countNodes(nodes: HtmlNode[]): number {
    let count = 0;
    walkAst(nodes, () => {
        count++;
    });
    return count;
}

/**
 * Get the text content of a node and its descendants
 * 
 * @param node - Node to extract text from
 * @returns Combined text content
 */
export function getTextContent(node: HtmlNode): string {
    if (node.type === NodeType.Text) {
        return node.content;
    }
    if (node.type === NodeType.Element) {
        return node.children.map(getTextContent).join('');
    }
    return '';
}

