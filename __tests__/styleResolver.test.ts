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
    resolveTreeStyles,
    extractClassNames,
    scaleTextStyles,
    getDefaultTagStyle,
} from '../src/styles';

import type { TextStyle } from 'react-native';
import { parseHtml } from '../src/parser';

/** Inline styles are a View/Text/Image union; tests read them as text styles */
const parseText = (css: string | undefined) => parseInlineStyle(css) as TextStyle & Record<string, unknown>;

describe('parseInlineStyle', () => {
    it('should parse simple CSS properties', () => {
        const style = parseText('color: red; font-size: 16px');

        expect(style.color).toBe('red');
        expect(style.fontSize).toBe(16);
    });

    it('should handle camelCase conversion', () => {
        const style = parseText('background-color: blue; text-align: center');

        expect(style.backgroundColor).toBe('blue');
        expect(style.textAlign).toBe('center');
    });

    it('should convert px units to numbers', () => {
        const style = parseText('margin: 10px; padding: 20px');

        expect(style.margin).toBe(10);
        expect(style.padding).toBe(20);
    });

    it('should handle font-weight values', () => {
        const style = parseText('font-weight: bold');
        expect(style.fontWeight).toBe('bold');

        const style2 = parseText('font-weight: 600');
        expect(style2.fontWeight).toBe('600');
    });

    it('should return empty object for empty input', () => {
        expect(parseText('')).toEqual({});
        expect(parseText(undefined)).toEqual({});
    });

    it('should skip unsupported properties', () => {
        const style = parseText('color: blue; animation: spin 1s; float: left');

        expect(style.color).toBe('blue');
        expect((style as any).animation).toBeUndefined();
        expect((style as any).float).toBeUndefined();
    });

    it('should handle text decoration', () => {
        const style = parseText('text-decoration: underline');
        expect(style.textDecorationLine).toBe('underline');

        const style2 = parseText('text-decoration: line-through');
        expect(style2.textDecorationLine).toBe('line-through');
    });
});

describe('parseInlineStyle with real-world CSS', () => {
    it('should expand multi-value margin and padding', () => {
        expect(parseText('margin: 0 auto')).toEqual({
            marginTop: 0, marginRight: 'auto', marginBottom: 0, marginLeft: 'auto',
        });
        expect(parseText('padding: 1px 2px 3px 4px')).toEqual({
            paddingTop: 1, paddingRight: 2, paddingBottom: 3, paddingLeft: 4,
        });
    });

    it('should drop enum values React Native does not support', () => {
        const style = parseText('display: block; position: fixed; overflow: auto; text-align: justify');

        expect(style.display).toBeUndefined();
        expect(style.position).toBeUndefined();
        expect(style.overflow).toBeUndefined();
        expect(style.textAlign).toBe('justify');
    });

    it('should map CSS aliases', () => {
        expect(parseText('text-align: start').textAlign).toBe('left');
        expect(parseText('font-style: oblique').fontStyle).toBe('italic');
    });

    it('should resolve unitless line-height against the font size', () => {
        expect(parseText('font-size: 20px; line-height: 1.5').lineHeight).toBe(30);
        expect(parseText('line-height: 1.5').lineHeight).toBe(24);
    });

    it('should reject percentages and keywords for number-only props', () => {
        const style = parseText('font-size: 120%; line-height: normal; flex: 1 1 auto; opacity: 0.5');

        expect(style.fontSize).toBeUndefined();
        expect(style.lineHeight).toBeUndefined();
        expect(style.flex).toBeUndefined();
        expect(style.opacity).toBe(0.5);
    });

    it('should keep only the first font family', () => {
        expect(parseText('font-family: "Helvetica Neue", Arial, sans-serif').fontFamily).toBe('Helvetica Neue');
        expect(parseText('font-family: sans-serif').fontFamily).toBeUndefined();
    });

    it('should strip !important and ignore CSS functions', () => {
        const style = parseText('color: red !important; width: calc(100% - 10px)');

        expect(style.color).toBe('red');
        expect(style.width).toBeUndefined();
    });

    it('should expand the border shorthand', () => {
        expect(parseText('border: 1px solid rgba(0, 0, 0, 0.2)')).toEqual({
            borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(0, 0, 0, 0.2)',
        });
    });

    it('should only use plain colors from background', () => {
        expect(parseText('background: #fff').backgroundColor).toBe('#fff');
        expect(parseText('background: url(a.png) no-repeat').backgroundColor).toBeUndefined();
    });

    it('should pass box-shadow through for the New Architecture', () => {
        expect(parseText('box-shadow: 0 1px 2px rgba(0,0,0,0.2)').boxShadow).toBe('0 1px 2px rgba(0,0,0,0.2)');
    });

    it('should normalize text-decoration order', () => {
        expect(parseText('text-decoration: line-through underline').textDecorationLine).toBe('underline line-through');
        expect(parseText('text-decoration: overline').textDecorationLine).toBe('none');
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

        expect((result as TextStyle).color).toBe('blue'); // Last wins
        expect((result as TextStyle).fontSize).toBe(16);
    });

    it('should handle undefined values', () => {
        const result = mergeStyles(
            { color: 'red' },
            undefined,
            { fontSize: 16 }
        );

        expect((result as TextStyle).color).toBe('red');
        expect((result as TextStyle).fontSize).toBe(16);
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

        const style = resolver(nodes[0] as any).style as TextStyle;

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

        const style = resolver(nodes[0] as any).style as TextStyle;

        expect(style.color).toBe('purple');
    });

    it('should apply class styles', () => {
        const { nodes } = parseHtml('<div class="highlight">Content</div>');
        const resolver = createStyleResolver({
            classesStyles: {
                highlight: { backgroundColor: 'yellow' },
            },
        });

        const style = resolver(nodes[0] as any).style as TextStyle;

        expect(style.backgroundColor).toBe('yellow');
    });

    it('should prioritize inline styles', () => {
        const { nodes } = parseHtml('<p style="color: green">Text</p>');
        const resolver = createStyleResolver({
            tagsStyles: {
                p: { color: 'red' },
            },
        });

        const style = resolver(nodes[0] as any).style as TextStyle;

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
        const h1Style = getDefaultTagStyle('h1') as TextStyle;
        expect(h1Style.fontWeight).toBe('bold');

        const aStyle = getDefaultTagStyle('a') as TextStyle;
        expect(aStyle.color).toBe('#1976d2');
    });

    it('should return empty object for unknown tags', () => {
        const style = getDefaultTagStyle('unknown-tag');
        expect(style).toEqual({});
    });
});
