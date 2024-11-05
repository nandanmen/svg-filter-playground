"use client";

import { useEffect, useState } from "react";
import { type BundledLanguage, type ThemedToken, codeToTokens } from "shiki";

export function CodeBlockClient({
  children,
  lang = "html",
}: {
  children: string;
  lang?: BundledLanguage;
}) {
  const [tokens, setTokens] = useState<{
    dark: ThemedToken[][];
    light: ThemedToken[][];
  }>({ dark: [], light: [] });

  useEffect(() => {
    Promise.all([
      codeToTokens(children, { lang, theme: "github-light" }),
      codeToTokens(children, { lang, theme: "github-dark" }),
    ]).then(([light, dark]) =>
      setTokens({ light: light.tokens, dark: dark.tokens })
    );
  }, [children]);

  if (!tokens.dark.length || !tokens.light.length) {
    return <pre className="text-sm p-4 overflow-auto h-full">{children}</pre>;
  }
  return (
    <pre className="text-sm p-4 overflow-auto h-full">
      {tokens.light.map((line, index) => {
        return (
          <div key={index}>
            {line.map((token, i) => {
              return (
                <span
                  key={i}
                  style={{
                    color: token.color,
                  }}
                >
                  {token.content}
                </span>
              );
            })}
          </div>
        );
      })}
    </pre>
  );
}
