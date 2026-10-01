/**
 * Renderer Tests
 * Tests for the HTMLRenderer component
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { HTMLRenderer } from '../src/renderer/HTMLRenderer';
import type { HtmlPlugin } from '../src/plugins';

type HostInstance = ReturnType<typeof screen.getByText>;

/**
 * Text style as React Native computes it: nested <Text> inherits from its <Text> ancestors
 */
function inheritedTextStyle(instance: HostInstance | null): Record<string, unknown> {
  const chain: Record<string, unknown>[] = [];
  let node: HostInstance | null = instance;
  while (node) {
    if (node.type === 'Text') {
      chain.unshift(StyleSheet.flatten(node.props.style) ?? {});
    }
    node = node.parent;
  }
  return Object.assign({}, ...chain);
}

describe('HTMLRenderer', () => {
  it('should render simple HTML', async () => {
    await render(<HTMLRenderer html="<p>Hello World</p>" />);

    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('should render nested elements', async () => {
    await render(
      <HTMLRenderer html="<div><p><strong>Bold text</strong></p></div>" />
    );

    expect(screen.getByText('Bold text')).toBeTruthy();
  });

  it('should apply custom tag styles', async () => {
    await render(
      <HTMLRenderer
        html="<p>Styled text</p>"
        tagsStyles={{
          p: { color: 'blue' },
        }}
      />
    );

    expect(inheritedTextStyle(screen.getByText('Styled text'))).toMatchObject({ color: 'blue' });
  });

  it('should render empty string without errors', async () => {
    const { toJSON } = await render(<HTMLRenderer html="" />);

    expect(toJSON()).toBeTruthy();
  });

  it('should handle null/undefined gracefully', async () => {
    const { toJSON } = await render(<HTMLRenderer html={null as any} />);

    expect(toJSON()).toBeTruthy();
  });

  it('should render headings', async () => {
    const html = `
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
    `;

    await render(<HTMLRenderer html={html} />);

    expect(screen.getByRole('header', { name: 'Heading 1' })).toBeTruthy();
    expect(screen.getByText('Heading 2')).toBeTruthy();
    expect(screen.getByText('Heading 3')).toBeTruthy();
  });

  it('should render lists with markers', async () => {
    const html = `
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      <ol>
        <li>First</li>
        <li>Second</li>
      </ol>
    `;

    await render(<HTMLRenderer html={html} />);

    expect(screen.getByText('Item 1')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
    expect(screen.getAllByText('•')).toHaveLength(2);
    expect(screen.getByText('2.')).toBeTruthy();
  });

  it('should render links', async () => {
    await render(<HTMLRenderer html='<a href="https://example.com">Link</a>' />);

    expect(screen.getByRole('link', { name: 'Link' })).toBeTruthy();
  });

  it('should render images', async () => {
    const { toJSON } = await render(
      <HTMLRenderer html='<img src="https://example.com/image.png" alt="Test" />' />
    );

    expect(toJSON()).toBeTruthy();
  });

  it('should render tables', async () => {
    const html = `
      <table>
        <tr>
          <th>Header 1</th>
          <th>Header 2</th>
        </tr>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
        </tr>
      </table>
    `;

    await render(<HTMLRenderer html={html} />);

    expect(screen.getByText('Header 1')).toBeTruthy();
    expect(screen.getByText('Cell 2')).toBeTruthy();
  });

  it('should render code blocks', async () => {
    const html = `
      <pre><code>const x = 1;</code></pre>
      <p>Inline <code>code</code> here</p>
    `;

    await render(<HTMLRenderer html={html} />);

    expect(screen.getByText('const x = 1;')).toBeTruthy();
    expect(screen.getByText('code')).toBeTruthy();
  });

  it('should render text formatting', async () => {
    const html = `
      <p>
        <strong>Bold</strong> and <em>italic</em> and
        <u>underline</u> and <s>strikethrough</s>
      </p>
    `;

    await render(<HTMLRenderer html={html} />);

    expect(inheritedTextStyle(screen.getByText('Bold'))).toMatchObject({ fontWeight: 'bold' });
    expect(inheritedTextStyle(screen.getByText('italic'))).toMatchObject({ fontStyle: 'italic' });
  });

  it('should render blockquotes', async () => {
    await render(<HTMLRenderer html="<blockquote>Quote text</blockquote>" />);

    expect(screen.getByText('Quote text')).toBeTruthy();
  });

  it('should render horizontal rules', async () => {
    await render(<HTMLRenderer html="<p>Before</p><hr/><p>After</p>" />);

    expect(screen.getByText('Before')).toBeTruthy();
    expect(screen.getByText('After')).toBeTruthy();
  });

  it('should use custom renderers', async () => {
    const customRenderer = jest.fn(({ renderChildren }) => (
      <Text testID="custom">{renderChildren()}</Text>
    ));

    await render(
      <HTMLRenderer
        html="<custom>Content</custom>"
        renderers={{
          custom: customRenderer,
        }}
      />
    );

    expect(customRenderer).toHaveBeenCalled();
    expect(screen.getByTestId('custom')).toBeTruthy();
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('should apply class styles', async () => {
    await render(
      <HTMLRenderer
        html='<p class="highlight">Content</p>'
        classesStyles={{
          highlight: { backgroundColor: 'yellow' },
        }}
      />
    );

    expect(inheritedTextStyle(screen.getByText('Content'))).toMatchObject({ backgroundColor: 'yellow' });
  });

  it('should handle complex nested HTML', async () => {
    const html = `
      <article>
        <header>
          <h1>Article Title</h1>
        </header>
        <section>
          <p>First paragraph with <a href="#">link</a>.</p>
          <ul>
            <li>Item with <strong>bold</strong></li>
            <li>Item with <em>italic</em></li>
          </ul>
          <blockquote>
            <p>Quoted text</p>
          </blockquote>
        </section>
        <footer>
          <p>Footer text</p>
        </footer>
      </article>
    `;

    await render(<HTMLRenderer html={html} />);

    expect(screen.getByText('Article Title')).toBeTruthy();
    expect(screen.getByText('Quoted text')).toBeTruthy();
    expect(screen.getByText('Footer text')).toBeTruthy();
  });
});

describe('HTMLRenderer with handlers', () => {
  it('should call onLinkPress with the href', async () => {
    const onLinkPress = jest.fn();

    await render(
      <HTMLRenderer
        html='<a href="https://example.com">Link</a>'
        onLinkPress={onLinkPress}
      />
    );

    await fireEvent.press(screen.getByText('Link'));

    expect(onLinkPress).toHaveBeenCalledTimes(1);
    expect(onLinkPress.mock.calls[0][0]).toBe('https://example.com');
    expect(onLinkPress.mock.calls[0][1].tagName).toBe('a');
  });

  it('should call onImagePress with the src', async () => {
    const onImagePress = jest.fn();

    await render(
      <HTMLRenderer
        html='<img src="test.jpg" width="100" height="50" />'
        onImagePress={onImagePress}
      />
    );

    await fireEvent.press(screen.getByRole('imagebutton'));

    expect(onImagePress).toHaveBeenCalledWith('test.jpg', expect.objectContaining({ tagName: 'img' }));
  });
});

describe('HTMLRenderer configuration', () => {
  it('should apply text scale to resolved font sizes', async () => {
    await render(
      <HTMLRenderer
        html="<h1>Scaled title</h1>"
        textScale={1.5}
      />
    );

    // default h1 is 32/40
    expect(inheritedTextStyle(screen.getByText('Scaled title'))).toMatchObject({ fontSize: 48, lineHeight: 60 });
  });

  it('should enable text selection', async () => {
    await render(
      <HTMLRenderer
        html="<p>Selectable text</p>"
        textSelectable={true}
      />
    );

    expect(screen.getByText('Selectable text').props.selectable).toBe(true);
  });

  it('should apply container style', async () => {
    const { toJSON } = await render(
      <HTMLRenderer
        html="<p>Content</p>"
        containerStyle={{ padding: 10 }}
      />
    );

    expect(toJSON()).toBeTruthy();
  });

  it('should not re-register plugins when re-rendered with equal props', async () => {
    const setup = jest.fn();
    const plugin: HtmlPlugin = { name: 'counter', setup };

    const { rerender } = await render(
      <HTMLRenderer html="<p>Plugins</p>" plugins={[plugin]} tagsStyles={{ p: { color: 'red' } }} />
    );
    const plugins = [plugin];
    await rerender(<HTMLRenderer html="<p>Plugins</p>" plugins={plugins} tagsStyles={{ p: { color: 'red' } }} />);
    await rerender(<HTMLRenderer html="<p>Plugins</p>" plugins={plugins} tagsStyles={{ p: { color: 'red' } }} />);

    // first render + one new array identity; equal inline styles must not matter
    expect(setup).toHaveBeenCalledTimes(2);
  });
});

describe('HTMLRenderer error handling', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    // React logs caught render errors; keep the test output clean
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('should show the fallback and report errors thrown by renderers', async () => {
    const onError = jest.fn();

    await render(
      <HTMLRenderer
        html="<boom>Content</boom>"
        renderers={{
          boom: () => {
            throw new Error('renderer failed');
          },
        }}
        errorBoundaryFallback={<Text>Something went wrong</Text>}
        onError={onError}
      />
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'renderer failed' }));
  });

  it('should recover when the html changes', async () => {
    const renderers = {
      boom: () => {
        throw new Error('renderer failed');
      },
    };

    const { rerender } = await render(
      <HTMLRenderer html="<boom>x</boom>" renderers={renderers} />
    );
    expect(screen.getByText('Failed to render HTML')).toBeTruthy();

    await rerender(<HTMLRenderer html="<p>Recovered</p>" renderers={renderers} />);
    expect(screen.getByText('Recovered')).toBeTruthy();
  });
});

describe('HTMLRenderer virtualization', () => {
  const longHtml = Array.from({ length: 200 }, (_, i) => `<p>Paragraph ${i}</p>`).join('');

  it('should only mount the first chunks when enabled and above the threshold', async () => {
    await render(
      <HTMLRenderer html={longHtml} enableVirtualization virtualizationThreshold={10} />
    );

    expect(screen.getByText('Paragraph 0')).toBeTruthy();
    expect(screen.queryByText('Paragraph 199')).toBeNull();
  });

  it('should render everything below the threshold', async () => {
    await render(
      <HTMLRenderer html={longHtml} enableVirtualization virtualizationThreshold={100000} />
    );

    expect(screen.getByText('Paragraph 199')).toBeTruthy();
  });
});

describe('HTMLRenderer layout', () => {
  /**
   * Boxes (View, ScrollView, Image) nested in a <Text> are laid out as inline
   * views by React Native, which breaks wrapping and line heights.
   */
  function boxesInsideText(container: HostInstance): string[] {
    const boxes = container.queryAll((node) => node.type !== 'Text' && typeof node.type === 'string');
    return boxes
      .filter((box) => {
        let ancestor = box.parent;
        while (ancestor) {
          if (ancestor.type === 'Text') return true;
          ancestor = ancestor.parent;
        }
        return false;
      })
      .map((box) => String(box.type));
  }

  it('should flow inline content of a block as one line of text', async () => {
    await render(<HTMLRenderer html="<div>Hello <b>bold</b> <i>world</i></div>" />);

    // a single <Text> holds the whole line, including the spaces between tags
    expect(screen.getByText('Hello bold world')).toBeTruthy();
  });

  it('should keep nested lists out of text', async () => {
    const { container } = await render(
      <HTMLRenderer html="<ul><li>Parent<ul><li>Child</li></ul></li></ul>" />
    );

    expect(screen.getByText('Parent')).toBeTruthy();
    expect(screen.getByText('Child')).toBeTruthy();
    expect(boxesInsideText(container)).toEqual([]);
  });

  it('should lay out paragraphs and blockquotes holding blocks as boxes', async () => {
    const { container } = await render(
      <HTMLRenderer
        html={`
          <p>Before <img src="a.png" width="10" height="10"> after</p>
          <blockquote><p>Quoted</p><p>Twice</p></blockquote>
          <table><tr><td><p>Cell</p><ul><li>Item</li></ul></td></tr></table>
        `}
      />
    );

    expect(screen.getByText('Before')).toBeTruthy();
    expect(screen.getByText('after')).toBeTruthy();
    expect(screen.getByText('Twice')).toBeTruthy();
    expect(boxesInsideText(container)).toEqual([]);
  });

  it('should make links that wrap blocks pressable', async () => {
    const onLinkPress = jest.fn();
    await render(
      <HTMLRenderer
        html='<a href="https://example.com/full.png"><img src="thumb.png" width="10" height="10"></a>'
        onLinkPress={onLinkPress}
      />
    );

    await fireEvent.press(screen.getByRole('link'));

    expect(onLinkPress).toHaveBeenCalledWith('https://example.com/full.png', expect.objectContaining({ tagName: 'a' }));
  });

  it('should inherit text styles through block containers', async () => {
    await render(
      <HTMLRenderer
        html={'<div style="color: red; text-align: center">Plain<p>Paragraph</p><ul><li>Item</li></ul></div>'}
      />
    );

    expect(inheritedTextStyle(screen.getByText('Plain'))).toMatchObject({ color: 'red', textAlign: 'center' });
    expect(inheritedTextStyle(screen.getByText('Paragraph'))).toMatchObject({ color: 'red' });
    expect(inheritedTextStyle(screen.getByText('Item'))).toMatchObject({ color: 'red' });
  });

  it('should apply baseTextStyle everywhere without resetting nested elements', async () => {
    await render(
      <HTMLRenderer
        html="<div>Body <span>span</span></div><h1>Title <span>inside</span></h1>"
        baseTextStyle={{ fontSize: 20, color: '#222' }}
      />
    );

    expect(inheritedTextStyle(screen.getByText('span'))).toMatchObject({ fontSize: 20, color: '#222' });
    // the span inside <h1> keeps the heading size
    expect(inheritedTextStyle(screen.getByText('inside'))).toMatchObject({ fontSize: 32, color: '#222' });
  });

  it('should keep the formatting of preformatted text', async () => {
    await render(<HTMLRenderer html={'<pre><code>if (x) {\n    run();\n}</code></pre>'} />);

    expect(screen.getByText('if (x) {\n    run();\n}')).toBeTruthy();
  });

  it('should render legacy and semantic inline tags as text', async () => {
    await render(
      <HTMLRenderer html={'<p><font color="green">Green</font> said <q>hi</q> <kbd>Ctrl</kbd></p>'} />
    );

    expect(inheritedTextStyle(screen.getByText('Green'))).toMatchObject({ color: 'green' });
    expect(screen.getByText('“hi”')).toBeTruthy();
    expect(screen.queryByText('[font]')).toBeNull();
  });
});
