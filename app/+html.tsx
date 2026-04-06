import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Background color matching the app's light theme (Colors.bgPrimary)
// Prevents white flash on page load and mismatched background on overscroll
const BG_PRIMARY = '#F4FBFC';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ru" style={{ backgroundColor: BG_PRIMARY }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
      </head>
      <body style={{ backgroundColor: BG_PRIMARY }}>
        {children}
      </body>
    </html>
  );
}
