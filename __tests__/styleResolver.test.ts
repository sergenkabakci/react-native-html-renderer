/**
 * Style Resolver Unit Tests
 * Tests for CSS parsing and style resolution
 */

import {
    parseInlineStyle,
    parseBoxShorthand,
    mergeStyles,
    isEmptyStyle,
    createStyleResolver,
    defaultStyleResolver,
    resolveTreeStyles,
    extractClassNames,
    scaleTextStyles,
    getDefaultTagStyle,
} from '../src/styles';

import { parseHtml } from '../src/parser';

describe('parseInlineStyle', () => {
    it('should parse simple CSS properties', () => {
        const style = parseInlineStyle('color: red; font-size: 16px');

        expect(style.color).toBe('red');
        expect(style.fontSize).toBe(16);
    });

    it('should handle camelCase conversion', () => {
        const style = parseInlineStyle('background-color: blue; text-align: center');

        expect(style.backgroundColor).toBe('blue');
        expect(style.textAlign).toBe('center');
    });

    it('should convert px units to numbers', () => {
        const style = parseInlineStyle('margin: 10px; padding: 20px');

        expect(style.margin).toBe(10);
        expect(style.padding).toBe(20);
    });

    it('should handle font-weight values', () => {
        const style = parseInlineStyle('font-weight: bold');
        expect(style.fontWeight).toBe('bold');

        const style2 = parseInlineStyle('font-weight: 600');
        expect(style2.fontWeight).toBe('600');
    });

    it('should return empty object for empty input', () => {
        expect(parseInlineStyle('')).toEqual({});
        expect(parseInlineStyle(undefined)).toEqual({});
    });

    it('should skip unsupported properties', () => {
        const style = parseInlineStyle('color: blue; animation: spin 1s; float: left');

        expect(style.color).toBe('blue');
        expect((style as any).animation).toBeUndefined();
        expect((style as any).float).toBeUndefined();
    });

    it('should handle text decoration', () => {
        const style = parseInlineStyle('text-decoration: underline');
        expect(style.textDecorationLine).toBe('underline');

        const style2 = parseInlineStyle('text-decoration: line-through');
        expect(style2.textDecorationLine).toBe('line-through');
    });
});

describe('parseBoxShorthand', () => {
    it('should parse single value', () => {
        const result = parseBoxShorthand('10px', 'margin');

        expect(result.marginTop).toBe(10);
        expect(result.marginRight).toBe(10);
        expect(result.marginBottom).toBe(10);
        expect(result.marginLeft).toBe(10);
    });

    it('should parse two values', () => {
        const result = parseBoxShorthand('10px 20px', 'padding');

        expect(result.paddingTop).toBe(10);
        expect(result.paddingRight).toBe(20);
        expect(result.paddingBottom).toBe(10);
        expect(result.paddingLeft).toBe(20);
    });

    it('should parse four values', () => {
        const result = parseBoxShorthand('1px 2px 3px 4px', 'margin');

        expect(result.marginTop).toBe(1);
        expect(result.marginRight).toBe(2);
        expect(result.marginBottom).toBe(3);
        expect(result.marginLeft).toBe(4);
    });
});

describe('mergeStyles', () => {
    it('should merge multiple style objects', () => {
        const result = mergeStyles(
            { color: 'red' },
            { fontSize: 16 },
            { color: 'blue' }
        );

        expect(result.color).toBe('blue'); // Last wins
        expect(result.fontSize).toBe(16);
    });

    it('should handle undefined values', () => {
        const result = mergeStyles(
            { color: 'red' },
            undefined,
            { fontSize: 16 }
        );

        expect(result.color).toBe('red');
        expect(result.fontSize).toBe(16);
    });
});

describe('isEmptyStyle', () => {
    it('should return true for empty objects', () => {
        expect(isEmptyStyle({})).toBe(true);
        expect(isEmptyStyle(undefined)).toBe(true);
    });

    it('should return false for non-empty objects', () => {
        expect(isEmptyStyle({ color: 'red' })).toBe(false);
    });
});

describe('createStyleResolver', () => {
    it('should resolve default tag styles', () => {
        const { nodes } = parseHtml('<h1>Heading</h1>');
        const resolver = createStyleResolver();

        const { style } = resolver(nodes[0] as any);

        expect(style.fontSize).toBeDefined();
        expect(style.fontWeight).toBe('bold');
    });

    it('should apply custom tag styles', () => {
        const { nodes } = parseHtml('<p>Paragraph</p>');
        const resolver = createStyleResolver({
            tagsStyles: {
                p: { color: 'purple' },
            },
        });

        const { style } = resolver(nodes[0] as any);

        expect(style.color).toBe('purple');
    });

    it('should apply class styles', () => {
        const { nodes } = parseHtml('<div class="highlight">Content</div>');
        const resolver = createStyleResolver({
            classesStyles: {
                highlight: { backgroundColor: 'yellow' },
            },
        });

        const { style } = resolver(nodes[0] as any);

        expect(style.backgroundColor).toBe('yellow');
    });

    it('should prioritize inline styles', () => {
        const { nodes } = parseHtml('<p style="color: green">Text</p>');
        const resolver = createStyleResolver({
            tagsStyles: {
                p: { color: 'red' },
            },
        });

        const { style } = resolver(nodes[0] as any);

        expect(style.color).toBe('green');
    });
});

describe('resolveTreeStyles', () => {
    it('should resolve styles for all nodes', () => {
        const { nodes } = parseHtml('<div><p>Text</p></div>');
        const resolved = resolveTreeStyles(nodes);

        expect((resolved[0] as any).parsedStyles).toBeDefined();
        expect((resolved[0] as any).children[0].parsedStyles).toBeDefined();
    });
});

describe('extractClassNames', () => {
    it('should extract all unique class names', () => {
        const { nodes } = parseHtml(`
      <div class="container">
        <p class="text highlight">One</p>
        <p class="text">Two</p>
      </div>
    `);

        const classes = extractClassNames(nodes);

        expect(classes.has('container')).toBe(true);
        expect(classes.has('text')).toBe(true);
        expect(classes.has('highlight')).toBe(true);
        expect(classes.size).toBe(3);
    });
});

describe('scaleTextStyles', () => {
    it('should scale font-related properties', () => {
        const style = {
            fontSize: 16,
            lineHeight: 24,
            letterSpacing: 1,
        };

        const scaled = scaleTextStyles(style, 1.5);

        expect(scaled.fontSize).toBe(24);
        expect(scaled.lineHeight).toBe(36);
        expect(scaled.letterSpacing).toBe(1.5);
    });
});

describe('getDefaultTagStyle', () => {
    it('should return styles for known tags', () => {
        const h1Style = getDefaultTagStyle('h1');
        expect(h1Style.fontWeight).toBe('bold');

        const aStyle = getDefaultTagStyle('a');
        expect(aStyle.color).toBe('#1976d2');
    });

    it('should return empty object for unknown tags', () => {
        const style = getDefaultTagStyle('unknown-tag');
        expect(style).toEqual({});
    });
});
