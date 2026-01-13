/**
 * Renderer Tests
 * Tests for the HTMLRenderer component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { HTMLRenderer } from '../src/renderer/HTMLRenderer';

describe('HTMLRenderer', () => {
  it('should render simple HTML', () => {
    const { toJSON } = render(
      <HTMLRenderer html="<p>Hello World</p>" />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should render nested elements', () => {
    const { toJSON } = render(
      <HTMLRenderer html="<div><p><strong>Bold text</strong></p></div>" />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should apply custom tag styles', () => {
    const { toJSON } = render(
      <HTMLRenderer
        html="<p>Styled text</p>"
        tagsStyles={{
          p: { color: 'blue' },
        }}
      />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should render empty string without errors', () => {
    const { toJSON } = render(
      <HTMLRenderer html="" />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should handle null/undefined gracefully', () => {
    const { toJSON } = render(
      <HTMLRenderer html={null as any} />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should render headings', () => {
    const html = `
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
    `;
    
    const { toJSON } = render(<HTMLRenderer html={html} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render lists', () => {
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
    
    const { toJSON } = render(<HTMLRenderer html={html} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render links', () => {
    const { toJSON } = render(
      <HTMLRenderer html='<a href="https://example.com">Link</a>' />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should render images', () => {
    const { toJSON } = render(
      <HTMLRenderer html='<img src="https://example.com/image.png" alt="Test" />' />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should render tables', () => {
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
    
    const { toJSON } = render(<HTMLRenderer html={html} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render code blocks', () => {
    const html = `
      <pre><code>const x = 1;</code></pre>
      <p>Inline <code>code</code> here</p>
    `;
    
    const { toJSON } = render(<HTMLRenderer html={html} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render text formatting', () => {
    const html = `
      <p>
        <strong>Bold</strong> and <em>italic</em> and 
        <u>underline</u> and <s>strikethrough</s>
      </p>
    `;
    
    const { toJSON } = render(<HTMLRenderer html={html} />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render blockquotes', () => {
    const { toJSON } = render(
      <HTMLRenderer html="<blockquote>Quote text</blockquote>" />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should render horizontal rules', () => {
    const { toJSON } = render(
      <HTMLRenderer html="<p>Before</p><hr/><p>After</p>" />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should handle custom renderers', () => {
    const customRenderer = jest.fn(() => null);
    
    render(
      <HTMLRenderer
        html="<custom>Content</custom>"
        renderers={{
          custom: customRenderer,
        }}
      />
    );
    
    // Note: Custom tag won't trigger built-in renderer
    // This tests that the custom renderer system is in place
  });

  it('should apply class styles', () => {
    const { toJSON } = render(
      <HTMLRenderer
        html='<div class="highlight">Content</div>'
        classesStyles={{
          highlight: { backgroundColor: 'yellow' },
        }}
      />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should handle complex nested HTML', () => {
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
    
    const { toJSON } = render(<HTMLRenderer html={html} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('HTMLRenderer with handlers', () => {
  it('should accept onLinkPress handler', () => {
    const onLinkPress = jest.fn();
    
    const { toJSON } = render(
      <HTMLRenderer
        html='<a href="https://example.com">Link</a>'
        onLinkPress={onLinkPress}
      />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should accept onImagePress handler', () => {
    const onImagePress = jest.fn();
    
    const { toJSON } = render(
      <HTMLRenderer
        html='<img src="test.jpg" />'
        onImagePress={onImagePress}
      />
    );
    
    expect(toJSON()).toBeTruthy();
  });
});

describe('HTMLRenderer configuration', () => {
  it('should apply text scale', () => {
    const { toJSON } = render(
      <HTMLRenderer
        html="<p>Scaled text</p>"
        textScale={1.5}
      />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should enable text selection', () => {
    const { toJSON } = render(
      <HTMLRenderer
        html="<p>Selectable text</p>"
        textSelectable={true}
      />
    );
    
    expect(toJSON()).toBeTruthy();
  });

  it('should apply container style', () => {
    const { toJSON } = render(
      <HTMLRenderer
        html="<p>Content</p>"
        containerStyle={{ padding: 10 }}
      />
    );
    
    expect(toJSON()).toBeTruthy();
  });
});
