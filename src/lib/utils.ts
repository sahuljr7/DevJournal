import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { marked } from 'marked';
import { convert } from 'html-to-text';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function markdownToPlainText(markdown: string): string {
  if (!markdown) return '';
  
  // Convert Markdown to HTML
  const html = marked.parse(markdown) as string;
  
  // Convert HTML to clean plain text
  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
      { selector: 'h1', format: 'headingStrategy', options: { uppercase: true } },
      { selector: 'h2', format: 'headingStrategy', options: { uppercase: true } },
      { selector: 'h3', format: 'headingStrategy', options: { uppercase: true } },
      { selector: 'code', format: 'inlineCodeStrategy' },
      { selector: 'pre', format: 'blockCodeStrategy' },
    ],
    formatters: {
      'headingStrategy': (elem, walk, builder, formatOptions) => {
        builder.openBlock();
        walk(elem.children, builder);
        builder.closeBlock();
      },
      'inlineCodeStrategy': (elem, walk, builder, formatOptions) => {
        builder.addInline('`');
        walk(elem.children, builder);
        builder.addInline('`');
      },
      'blockCodeStrategy': (elem, walk, builder, formatOptions) => {
        builder.openBlock();
        builder.addInline('--- CODE BLOCK ---\n');
        walk(elem.children, builder);
        builder.addInline('\n------------------');
        builder.closeBlock();
      }
    }
  }).trim();
}
