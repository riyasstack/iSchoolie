import * as React from 'react';
import Link from 'next/link';

/**
 * Renders plain text with safe links. No HTML is ever injected: the body is
 * escaped by React and only the three recognised token types become anchors.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const tokens = text.split(/(https?:\/\/[^\s<]+|#[\w]{1,49}|@[A-Za-z0-9][A-Za-z0-9-]{1,29})/g);

  return (
    <p className={className} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      {tokens.map((token, index) => {
        if (/^https?:\/\//.test(token)) {
          const href = token.replace(/[.,;:!?)]+$/, '');
          const trailing = token.slice(href.length);
          return (
            <React.Fragment key={`${token}-${index}`}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand"
              >
                {href.replace(/^https?:\/\//, '')}
              </a>
              {trailing}
            </React.Fragment>
          );
        }
        if (/^#[\w]+$/.test(token)) {
          return (
            <Link
              key={`${token}-${index}`}
              href={`/search?q=${encodeURIComponent(token)}&type=latest`}
              className="font-medium text-brand hover:underline"
            >
              {token}
            </Link>
          );
        }
        if (/^@[A-Za-z0-9-]+$/.test(token)) {
          return (
            <Link
              key={`${token}-${index}`}
              href={`/u/${token.slice(1).toLowerCase()}`}
              className="font-medium text-brand hover:underline"
            >
              {token}
            </Link>
          );
        }
        return <React.Fragment key={`text-${index}`}>{token}</React.Fragment>;
      })}
    </p>
  );
}
