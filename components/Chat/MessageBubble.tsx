'use client';

import { User, Copy, ThumbsUp, ThumbsDown, Bot } from 'lucide-react';
import { Message } from 'ai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`
          w-8 h-8 rounded-full flex-shrink-0
          flex items-center justify-center
          ${isUser
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
            : 'bg-gradient-to-r from-purple-500 to-pink-500'
          }
        `}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`
            px-4 py-3 rounded-2xl
            ${isUser
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
              : 'bg-muted border border-border text-foreground'
            }
          `}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm space-y-2">
              <ReactMarkdown
                components={{
                  // Paragraphs - don't wrap pre/code blocks
                  p: ({ node, children }) => {
                    return <p className="mb-2 last:mb-0">{children}</p>;
                  },
                  // Code blocks
                  code: ({ node, inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    
                    // Inline code
                    if (inline) {
                      return (
                        <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                    
                    // Block code - just return string, pre will handle it
                    return String(children).replace(/\n$/, '');
                  },
                  // Pre blocks - this is where we render the syntax highlighter
                  pre: ({ node, children, ...props }) => {
                    // Extract code content and language from children
                    const childArray = Array.isArray(children) ? children : [children];
                    const codeElement = childArray.find((child: any) => child?.type === 'code' || typeof child === 'string');
                    const codeContent = typeof codeElement === 'string' ? codeElement : codeElement?.props?.children || '';
                    
                    // Skip empty code blocks
                    const trimmedContent = String(codeContent).trim();
                    if (!trimmedContent) {
                      return null;
                    }
                    
                    // Try to detect language from className if available
                    let language = 'text';
                    if (codeElement?.props?.className) {
                      const match = /language-(\w+)/.exec(codeElement.props.className);
                      if (match) language = match[1];
                    }
                    
                    return (
                      <div className="my-3">
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={language}
                          PreTag="div"
                          className="!bg-gray-900 !rounded-lg !text-sm !m-0 relative group"
                          customStyle={{
                            padding: '1rem',
                            borderRadius: '0.5rem',
                          }}
                        >
                          {trimmedContent}
                        </SyntaxHighlighter>
                      </div>
                    );
                  },
                  ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions (only for AI messages) */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-2 px-2">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={copied ? 'Copied!' : 'Copy message'}
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-green-500 transition-colors"
              title="Good response"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
              title="Bad response"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1 px-2 block">
          {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
