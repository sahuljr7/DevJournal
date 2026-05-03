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
      { selector: 'h1', options: { uppercase: true } },
      { selector: 'h2', options: { uppercase: true } },
      { selector: 'h3', options: { uppercase: true } },
    ]
  }).trim();
}
