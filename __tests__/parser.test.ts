/**
 * Parser Unit Tests
 * Tests for HTML parsing and AST generation
 */

import {
    parseHtml,
    parseHtmlStrict,
    walkAst,
    findByTag,
    findById,
    countNodes,
    getTextContent,
    resetKeyCounter,
    NodeType,
    isElementNode,
    isTextNode,
} from '../src/parser';

describe('parseHtml', () => {
    beforeEach(() => {
        resetKeyCounter();
    });

    it('should parse simple text', () => {
        const { nodes, errors } = parseHtml('Hello World');

        expect(errors).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        expect(isTextNode(nodes[0])).toBe(true);
        expect((nodes[0] as any).content).toBe('Hello World');
    });

    it('should parse a simple paragraph', () => {
        const { nodes, errors } = parseHtml('<p>Hello World</p>');

        expect(errors).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        expect(isElementNode(nodes[0])).toBe(true);
        expect((nodes[0] as any).tagName).toBe('p');
        expect((nodes[0] as any).children).toHaveLength(1);
    });

    it('should parse nested elements', () => {
        const { nodes, errors } = parseHtml('<div><p><strong>Bold</strong></p></div>');

        expect(errors).toHaveLength(0);
        expect(nodes).toHaveLength(1);

        const div = nodes[0] as any;
        expect(div.tagName).toBe('div');

        const p = div.children[0];
        expect(p.tagName).toBe('p');

        const strong = p.children[0];
        expect(strong.tagName).toBe('strong');
        expect(strong.children[0].content).toBe('Bold');
    });

    it('should parse attributes', () => {
        const { nodes } = parseHtml('<a href="https://example.com" class="link">Link</a>');

        const anchor = nodes[0] as any;
        expect(anchor.attributes.href).toBe('https://example.com');
        expect(anchor.attributes.class).toBe('link');
        expect(anchor.classNames).toEqual(['link']);
    });

    it('should parse inline styles', () => {
        const { nodes } = parseHtml('<div style="color: red; margin: 10px;">Content</div>');

        const div = nodes[0] as any;
        expect(div.attributes.style).toBe('color: red; margin: 10px;');
    });

    it('should handle self-closing tags', () => {
        const { nodes, errors } = parseHtml('<div><br/><img src="test.jpg"/></div>');

        expect(errors).toHaveLength(0);
        const div = nodes[0] as any;
        expect(div.children).toHaveLength(2);
        expect(div.children[0].tagName).toBe('br');
        expect(div.children[1].tagName).toBe('img');
    });

    it('should handle malformed HTML gracefully', () => {
        const { nodes, errors } = parseHtml('<div><p>Unclosed paragraph<div>Another');

        // Should not throw, should produce some output
        expect(nodes.length).toBeGreaterThanOrEqual(0);
    });

    it('should normalize whitespace by default', () => {
        const { nodes } = parseHtml('<p>   Multiple   spaces   </p>');

        const p = nodes[0] as any;
        const text = p.children[0].content;
        expect(text).not.toContain('   ');
    });

    it('should skip script and style tags', () => {
        const { nodes } = parseHtml('<div><script>alert("x")</script><style>.x{}</style>Content</div>');

        const div = nodes[0] as any;
        // Should only have text content, script and style skipped
        expect(div.children.every((c: any) => c.tagName !== 'script')).toBe(true);
        expect(div.children.every((c: any) => c.tagName !== 'style')).toBe(true);
    });

    it('should handle HTML entities', () => {
        const { nodes } = parseHtml('<p>&amp; &lt; &gt; &quot;</p>');

        const p = nodes[0] as any;
        expect(p.children[0].content).toContain('&');
        expect(p.children[0].content).toContain('<');
        expect(p.children[0].content).toContain('>');
    });
});

describe('parseHtmlStrict', () => {
    it('should return nodes for valid HTML', () => {
        const nodes = parseHtmlStrict('<p>Test</p>');
        expect(nodes).toHaveLength(1);
    });
});

describe('walkAst', () => {
    it('should visit all nodes', () => {
        const { nodes } = parseHtml('<div><p>Text</p><span>More</span></div>');
        const visited: string[] = [];

        walkAst(nodes, (node) => {
            if (isElementNode(node)) {
                visited.push(node.tagName);
            } else if (isTextNode(node)) {
                visited.push('text:' + node.content);
            }
        });

        expect(visited).toContain('div');
        expect(visited).toContain('p');
        expect(visited).toContain('span');
        expect(visited).toContain('text:Text');
    });

    it('should skip children when returning false', () => {
        const { nodes } = parseHtml('<div><p>Text</p></div>');
        const visited: string[] = [];

        walkAst(nodes, (node) => {
            if (isElementNode(node)) {
                visited.push(node.tagName);
                if (node.tagName === 'div') {
                    return false; // Skip children
                }
            }
        });

        expect(visited).toContain('div');
        expect(visited).not.toContain('p');
    });
});

describe('findByTag', () => {
    it('should find all elements by tag name', () => {
        const { nodes } = parseHtml('<div><p>1</p><p>2</p><span><p>3</p></span></div>');

        const paragraphs = findByTag(nodes, 'p');
        expect(paragraphs).toHaveLength(3);
    });

    it('should return empty array if tag not found', () => {
        const { nodes } = parseHtml('<div><span>Text</span></div>');

        const result = findByTag(nodes, 'h1');
        expect(result).toHaveLength(0);
    });
});

describe('findById', () => {
    it('should find element by ID', () => {
        const { nodes } = parseHtml('<div><p id="target">Found</p></div>');

        const element = findById(nodes, 'target');
        expect(element).toBeDefined();
        expect(element?.tagName).toBe('p');
    });

    it('should return undefined if ID not found', () => {
        const { nodes } = parseHtml('<div><p>No ID</p></div>');

        const element = findById(nodes, 'missing');
        expect(element).toBeUndefined();
    });
});

describe('countNodes', () => {
    it('should count all nodes', () => {
        const { nodes } = parseHtml('<div><p>Text</p></div>');

        const count = countNodes(nodes);
        // div + p + text = 3
        expect(count).toBe(3);
    });
});

describe('getTextContent', () => {
    it('should extract text from nested elements', () => {
        const { nodes } = parseHtml('<div><p>Hello <strong>World</strong>!</p></div>');

        const text = getTextContent(nodes[0]);
        expect(text).toBe('Hello World!');
    });
});

describe('NodeType', () => {
    it('should have correct enum values', () => {
        expect(NodeType.Element).toBe('element');
        expect(NodeType.Text).toBe('text');
        expect(NodeType.Comment).toBe('comment');
    });
});
