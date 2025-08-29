// This file customizes the web index.html used by Expo Router (web only).
export default function Html({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <style
          // Make the app fill the viewport and match our dark theme.
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; }
              * { box-sizing: border-box; }
              body { margin: 0; background: #0b0e13; color: #fff; }
              ::-webkit-scrollbar { width: 8px; height: 8px; }
              ::-webkit-scrollbar-thumb { background: #1f2630; border-radius: 8px; }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
