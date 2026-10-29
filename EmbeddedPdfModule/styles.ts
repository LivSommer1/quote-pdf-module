import type { CSSProperties } from 'react';

export const placeholderStyle: CSSProperties = {
  border: '2px dashed var(--hsQuotes--document--lines-color, #cbd6e2)',
  borderRadius: 8,
  padding: 'calc(var(--spacing-unit) * 6)',
  textAlign: 'center',
  color: 'var(--hsQuotes--body__fontColor, #33475b)',
  backgroundColor: 'var(--color-line-items-bg, #f8f9fe)',
  fontSize: '0.9em',
};

export const pageStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: 'auto',
  marginBottom: 'calc(var(--spacing-unit) * 2)',
  border: '1px solid var(--hsQuotes--document--lines-color, #cbd6e2)',
  boxSizing: 'border-box',
  breakInside: 'avoid',
};

export const noteStyle: CSSProperties = {
  margin: 'calc(var(--spacing-unit) * 1) 0',
  opacity: 0.7,
  fontSize: '0.875em',
};

export const linkStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 'calc(var(--spacing-unit) * 1)',
  fontSize: '0.875em',
};
