/**
 * Example App for @sergenkabakci/react-native-html-renderer
 * 
 * Demonstrates all major features of the library:
 * - Basic HTML rendering
 * - Custom styles
 * - Link and image handling
 * - Plugin system
 * - Performance with large content
 */

import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HTMLRenderer } from '@sergenkabakci/react-native-html-renderer';
import type { ElementNode, HtmlPlugin } from '@sergenkabakci/react-native-html-renderer';
import { SafeAreaView } from 'react-native-safe-area-context';
// Sample HTML content for different examples
const EXAMPLES = {
  basic: `
    <h1>Welcome to HTML Viewer</h1>
    <p>This is a <strong>powerful</strong> library for rendering <em>HTML content</em> in React Native.</p>
    <p>It supports many features:</p>
    <ul>
      <li>Block elements (div, p, blockquote)</li>
      <li>Headings (h1-h6)</li>
      <li>Text formatting (bold, italic, underline)</li>
      <li>Lists (ordered and unordered)</li>
      <li>Links and images</li>
      <li>Tables</li>
      <li>Code blocks</li>
    </ul>
  `,
  
  headings: `
    <h1>Heading 1</h1>
    <h2>Heading 2</h2>
    <h3>Heading 3</h3>
    <h4>Heading 4</h4>
    <h5>Heading 5</h5>
    <h6>Heading 6</h6>
    <p>Regular paragraph text for comparison.</p>
  `,
  
  textFormatting: `
    <p>Text can be <strong>bold</strong> or <b>bold (alternate)</b>.</p>
    <p>Text can be <em>italic</em> or <i>italic (alternate)</i>.</p>
    <p>Text can be <u>underlined</u>.</p>
    <p>Text can be <s>strikethrough</s> or <del>deleted</del>.</p>
    <p>Text can be <mark>highlighted</mark>.</p>
    <p>Combine them: <strong><em>bold and italic</em></strong>.</p>
    <p>Or even: <strong><em><u>bold, italic, and underlined</u></em></strong>!</p>
  `,
  
  lists: `
    <h2>Unordered List</h2>
    <ul>
      <li>First item</li>
      <li>Second item with <strong>bold text</strong></li>
      <li>Third item
        <ul>
          <li>Nested item 1</li>
          <li>Nested item 2</li>
        </ul>
      </li>
    </ul>
    
    <h2>Ordered List</h2>
    <ol>
      <li>First step</li>
      <li>Second step</li>
      <li>Third step
        <ol>
          <li>Sub-step a</li>
          <li>Sub-step b</li>
        </ol>
      </li>
    </ol>
  `,
  
  links: `
    <h2>Links</h2>
    <p>Visit <a href="https://github.com">GitHub</a> for code hosting.</p>
    <p>Send an email to <a href="mailto:example@email.com">example@email.com</a>.</p>
    <p>Call us at <a href="tel:+1234567890">+1 234 567 890</a>.</p>
    <p>Links can contain <a href="https://example.com"><strong>formatted</strong> text</a>.</p>
  `,
  
  images: `
    <h2>Images</h2>
    <p>Here's an image:</p>
    <img src="https://via.placeholder.com/300x200" alt="Placeholder image" />
    <p>Images resize automatically to fit the screen.</p>
    <img src="https://via.placeholder.com/800x400" alt="Wide image" />
  `,
  
  tables: `
    <h2>Tables</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Alice</td>
          <td>Developer</td>
          <td>Active</td>
        </tr>
        <tr>
          <td>Bob</td>
          <td>Designer</td>
          <td>Active</td>
        </tr>
        <tr>
          <td>Charlie</td>
          <td>Manager</td>
          <td>On leave</td>
        </tr>
      </tbody>
    </table>
  `,
  
  code: `
    <h2>Code Blocks</h2>
    <p>Inline code: <code>const x = 42;</code></p>
    
    <p>Code block:</p>
    <pre><code>function greet(name) {
  console.log('Hello, ' + name + '!');
}

greet('World');</code></pre>
  `,
  
  blockquote: `
    <h2>Blockquotes</h2>
    <blockquote>
      This is a blockquote. It's styled with a left border and italic text to stand out from regular content.
    </blockquote>
    <p>Regular paragraph after the quote.</p>
    <blockquote>
      Another quote with <strong>bold</strong> and <em>italic</em> text inside.
    </blockquote>
  `,
  
  customStyles: `
    <h1>Custom Styled Content</h1>
    <p class="intro">This paragraph has the "intro" class for custom styling.</p>
    <p class="highlight">This paragraph is highlighted with a yellow background.</p>
    <div class="card">
      <h3>Card Title</h3>
      <p>This is content inside a styled card container.</p>
    </div>
  `,

  complex: `
    <article>
      <header>
        <h1>Complete Article Example</h1>
        <p><em>Published on January 2024</em></p>
      </header>
      
      <section>
        <h2>Introduction</h2>
        <p>This example demonstrates all the features of the HTML Viewer library working together.</p>
        
        <blockquote>
          Building great user interfaces requires attention to detail.
        </blockquote>
      </section>
      
      <section>
        <h2>Key Features</h2>
        <ul>
          <li><strong>Performance</strong> - Optimized for large content</li>
          <li><strong>Flexibility</strong> - Customize everything</li>
          <li><strong>Accessibility</strong> - Built-in support</li>
        </ul>
        
        <table>
          <tr>
            <th>Feature</th>
            <th>Supported</th>
          </tr>
          <tr>
            <td>Custom Styles</td>
            <td>✓</td>
          </tr>
          <tr>
            <td>Plugins</td>
            <td>✓</td>
          </tr>
          <tr>
            <td>Virtualization</td>
            <td>✓</td>
          </tr>
        </table>
      </section>
      
      <section>
        <h2>Code Example</h2>
        <pre><code>import { HTMLRenderer } from 'react-native-html-viewer';

function MyComponent() {
  return (
    &lt;HTMLRenderer
      html="&lt;p&gt;Hello World&lt;/p&gt;"
      tagsStyles={{ p: { color: 'blue' } }}
    /&gt;
  );
}</code></pre>
      </section>
      
      <footer>
        <hr />
        <p>Learn more at <a href="https://github.com">our GitHub repository</a>.</p>
      </footer>
    </article>
  `,
};

// Example type definition
type ExampleKey = keyof typeof EXAMPLES;

// Example plugin that transforms custom tags
const badgePlugin: HtmlPlugin = {
  name: 'badge',
  tagRenderers: {
    badge: ({ node, style }) => (
      <View style={[styles.badge, style]}>
        <Text style={styles.badgeText}>
          {node.children.map((child: any) => 
            child.type === 'text' ? child.content : ''
          ).join('')}
        </Text>
      </View>
    ),
  },
};

export default function App() {
  const [currentExample, setCurrentExample] = useState<ExampleKey>('basic');
  
  // Link press handler
  const handleLinkPress = useCallback((url: string, node: ElementNode) => {
    Alert.alert(
      'Link Pressed',
      `URL: ${url}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open', 
          onPress: () => Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Could not open URL');
          })
        },
      ]
    );
  }, []);
  
  // Image press handler
  const handleImagePress = useCallback((src: string, node: ElementNode) => {
    Alert.alert('Image Pressed', `Source: ${src}`);
  }, []);
  
  // Custom styles for class-based styling
  const classesStyles = {
    intro: {
      fontSize: 18,
      lineHeight: 28,
      color: '#333',
      marginBottom: 16,
    },
    highlight: {
      backgroundColor: '#fff3cd',
      padding: 12,
      borderRadius: 8,
    },
    card: {
      backgroundColor: '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e9ecef',
      marginVertical: 12,
    },
  };
  
  // Custom tag styles
  const tagsStyles = {
    h1: {
      color: '#1a1a2e',
      marginBottom: 20,
    },
    a: {
      color: '#6366f1',
    },
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>HTML Viewer Examples</Text>
      </View>
      
      {/* Example selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {(Object.keys(EXAMPLES) as ExampleKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.tab,
              currentExample === key && styles.tabActive,
            ]}
            onPress={() => setCurrentExample(key)}
          >
            <Text
              style={[
                styles.tabText,
                currentExample === key && styles.tabTextActive,
              ]}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* HTML Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <HTMLRenderer
          html={EXAMPLES[currentExample]}
          tagsStyles={tagsStyles}
          classesStyles={classesStyles}
          onLinkPress={handleLinkPress}
          onImagePress={handleImagePress}
          plugins={[badgePlugin]}
          textSelectable={true}
          debug={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tabBar: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabBarContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  badge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
