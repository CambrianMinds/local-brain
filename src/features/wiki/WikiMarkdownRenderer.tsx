import React from 'react';
import { BookOpen, FileText, RefreshCw, Copy, Check } from 'lucide-react';
import { WikiPage, DocumentItem } from '../../types';

interface WikiMarkdownRendererProps {
  content: string;
  allWikis: WikiPage[];
  allDocs: DocumentItem[];
  onNavigateWiki: (wikiIdOrTitle: string) => void;
  onCitationClick: (docTitle: string, event: React.MouseEvent) => void;
  onRegenerateSection?: (heading: string) => void;
  isLocked?: boolean;
}

export const WikiMarkdownRenderer: React.FC<WikiMarkdownRendererProps> = ({
  content,
  allWikis,
  allDocs,
  onNavigateWiki,
  onCitationClick,
  onRegenerateSection,
  isLocked = false,
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  // Parse lines into tokens: headings, blockquotes, tables, code blocks, lists, paragraphs
  const blocks = React.useMemo(() => {
    const lines = content.split('\n');
    const result: Array<{
      type: 'h1' | 'h2' | 'h3' | 'blockquote' | 'code' | 'table' | 'hr' | 'ul' | 'ol' | 'p';
      content: string;
      heading?: string;
      id?: string;
      rows?: string[][];
    }> = [];

    let inCode = false;
    let codeBuffer: string[] = [];
    let inTable = false;
    let tableBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code fences
      if (line.trim().startsWith('```')) {
        if (inCode) {
          result.push({
            type: 'code',
            content: codeBuffer.join('\n'),
          });
          codeBuffer = [];
          inCode = false;
        } else {
          inCode = true;
        }
        continue;
      }
      if (inCode) {
        codeBuffer.push(line);
        continue;
      }

      // Tables
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        tableBuffer.push(line);
        continue;
      } else if (inTable) {
        // Table ended
        const rows = tableBuffer
          .filter((l) => !l.includes('---'))
          .map((l) =>
            l
              .split('|')
              .map((c) => c.trim())
              .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
          );
        result.push({
          type: 'table',
          content: '',
          rows,
        });
        tableBuffer = [];
        inTable = false;
      }

      // Horizontal rules
      if (line.trim() === '---' || line.trim() === '***') {
        result.push({ type: 'hr', content: '' });
        continue;
      }

      // Headings
      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        result.push({
          type: 'h1',
          content: h1Match[1],
          id: h1Match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        });
        continue;
      }

      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        result.push({
          type: 'h2',
          heading: h2Match[1],
          content: h2Match[1],
          id: h2Match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        });
        continue;
      }

      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match) {
        result.push({
          type: 'h3',
          heading: h3Match[1],
          content: h3Match[1],
          id: h3Match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        });
        continue;
      }

      // Blockquotes
      if (line.trim().startsWith('>')) {
        result.push({
          type: 'blockquote',
          content: line.replace(/^>\s*/, ''),
        });
        continue;
      }

      // Lists
      if (line.match(/^[\*\-]\s+(.+)$/)) {
        result.push({
          type: 'ul',
          content: line.replace(/^[\*\-]\s+/, ''),
        });
        continue;
      }

      if (line.match(/^\d+\.\s+(.+)$/)) {
        result.push({
          type: 'ol',
          content: line.replace(/^\d+\.\s+/, ''),
        });
        continue;
      }

      // Paragraphs
      if (line.trim().length > 0) {
        result.push({
          type: 'p',
          content: line,
        });
      }
    }

    if (inTable && tableBuffer.length > 0) {
      const rows = tableBuffer
        .filter((l) => !l.includes('---'))
        .map((l) =>
          l
            .split('|')
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
        );
      result.push({
        type: 'table',
        content: '',
        rows,
      });
    }

    return result;
  }, [content]);

  // Render text with interactive [[Links]] and citations
  const renderFormattedText = (text: string) => {
    // Match [[anything]]
    const parts = text.split(/(\[\[[^\]]+\]\])/g);

    return parts.map((part, index) => {
      const linkMatch = part.match(/^\[\[([^\]]+)\]\]$/);
      if (linkMatch) {
        const target = linkMatch[1];

        // Check if it's a document citation
        const matchedDoc = allDocs.find(
          (d) => d.title.toLowerCase() === target.toLowerCase() || d.title.toLowerCase().includes(target.toLowerCase())
        );

        if (matchedDoc) {
          return (
            <button
              key={index}
              onClick={(e) => onCitationClick(matchedDoc.title, e)}
              className="wiki-inline-citation"
              title={`Source Citation: Click to view details for "${matchedDoc.title}"`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '1px 7px',
                margin: '0 3px',
                borderRadius: '4px',
                background: 'rgba(110, 231, 183, 0.12)',
                border: '1px solid rgba(110, 231, 183, 0.3)',
                color: 'var(--accent)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                verticalAlign: 'baseline',
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={11} />
              <span>{matchedDoc.title.length > 28 ? matchedDoc.title.slice(0, 26) + '...' : matchedDoc.title}</span>
            </button>
          );
        }

        // Check if it's a wiki link
        const matchedWiki = allWikis.find(
          (w) => w.title.toLowerCase() === target.toLowerCase() || w.title.toLowerCase().includes(target.toLowerCase())
        );

        return (
          <button
            key={index}
            onClick={() => onNavigateWiki(matchedWiki ? matchedWiki.id : target)}
            className="wiki-inline-link"
            title={`Wiki Link: Jump to article "${target}"`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '1px 7px',
              margin: '0 3px',
              borderRadius: '4px',
              background: 'rgba(125, 211, 252, 0.12)',
              border: '1px solid rgba(125, 211, 252, 0.3)',
              color: 'var(--accent-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              verticalAlign: 'baseline',
              transition: 'all 0.15s ease',
            }}
          >
            <BookOpen size={11} />
            <span>{target}</span>
          </button>
        );
      }

      // Handle standard markdown bold, italics, code
      return renderInlineMarkdown(part, index);
    });
  };

  const renderInlineMarkdown = (text: string, keyPrefix: number) => {
    // Process code `...`
    const codeSegments = text.split(/(`[^`]+`)/g);
    return codeSegments.map((segment, cIdx) => {
      if (segment.startsWith('`') && segment.endsWith('`')) {
        return (
          <code
            key={`${keyPrefix}-${cIdx}`}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12.5px',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 5px',
              borderRadius: '3px',
              color: 'var(--accent)',
            }}
          >
            {segment.slice(1, -1)}
          </code>
        );
      }

      // Process bold **...**
      const boldSegments = segment.split(/(\*\*[^\*]+\*\*)/g);
      return boldSegments.map((bSeg, bIdx) => {
        if (bSeg.startsWith('**') && bSeg.endsWith('**')) {
          return (
            <strong key={`${keyPrefix}-${cIdx}-${bIdx}`} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {bSeg.slice(2, -2)}
            </strong>
          );
        }
        return bSeg;
      });
    });
  };

  const handleCopyCode = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <article className="wiki-article-body" style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '14.5px' }}>
      {blocks.map((block, idx) => {
        if (block.type === 'h1') {
          return (
            <h1
              key={idx}
              id={block.id}
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginTop: '16px',
                marginBottom: '16px',
                lineHeight: 1.3,
              }}
            >
              {renderFormattedText(block.content)}
            </h1>
          );
        }

        if (block.type === 'h2') {
          return (
            <div
              key={idx}
              className="wiki-section-heading-wrapper"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '32px',
                marginBottom: '14px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '8px',
              }}
            >
              <h2
                id={block.id}
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}
              >
                {renderFormattedText(block.content)}
              </h2>

              {!isLocked && onRegenerateSection && block.heading && (
                <button
                  onClick={() => onRegenerateSection(block.heading!)}
                  className="btn btn-ghost btn-sm"
                  title="Regenerate this specific section with updated context"
                  style={{
                    fontSize: '11px',
                    gap: '4px',
                    padding: '3px 8px',
                    color: 'var(--text-tertiary)',
                    opacity: 0.8,
                  }}
                >
                  <RefreshCw size={11} />
                  <span>Refresh Section</span>
                </button>
              )}
            </div>
          );
        }

        if (block.type === 'h3') {
          return (
            <h3
              key={idx}
              id={block.id}
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '22px',
                marginBottom: '8px',
              }}
            >
              {renderFormattedText(block.content)}
            </h3>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={idx}
              style={{
                margin: '18px 0',
                padding: '14px 18px',
                borderLeft: '3px solid var(--accent)',
                background: 'rgba(110, 231, 183, 0.05)',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                color: 'var(--text-secondary)',
                fontSize: '13.5px',
                fontStyle: 'normal',
                lineHeight: 1.6,
              }}
            >
              {renderFormattedText(block.content)}
            </blockquote>
          );
        }

        if (block.type === 'table' && block.rows && block.rows.length > 0) {
          const [headerRow, ...bodyRows] = block.rows;
          return (
            <div key={idx} style={{ overflowX: 'auto', margin: '20px 0' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  background: 'var(--bg-base)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {headerRow.map((cell, cIdx) => (
                      <th
                        key={cIdx}
                        style={{
                          textAlign: 'left',
                          padding: '10px 14px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                        }}
                      >
                        {renderFormattedText(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: rIdx === bodyRows.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                      }}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            padding: '9px 14px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {renderFormattedText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'code') {
          return (
            <div
              key={idx}
              style={{
                position: 'relative',
                margin: '18px 0',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span>Snippet</span>
                <button
                  onClick={() => handleCopyCode(block.content, idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  {copiedIndex === idx ? <Check size={12} style={{ color: 'var(--accent)' }} /> : <Copy size={12} />}
                  <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre
                style={{
                  padding: '12px 16px',
                  margin: 0,
                  fontSize: '12.5px',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.55,
                  overflowX: 'auto',
                  color: '#e2e8f0',
                }}
              >
                {block.content}
              </pre>
            </div>
          );
        }

        if (block.type === 'hr') {
          return (
            <hr
              key={idx}
              style={{
                border: 'none',
                height: '1px',
                background: 'var(--border-subtle)',
                margin: '28px 0',
              }}
            />
          );
        }

        if (block.type === 'ul') {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                margin: '6px 0',
                paddingLeft: '6px',
              }}
            >
              <span style={{ color: 'var(--accent)', marginTop: '2px', fontWeight: 700 }}>•</span>
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{renderFormattedText(block.content)}</span>
            </div>
          );
        }

        if (block.type === 'ol') {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                margin: '6px 0',
                paddingLeft: '6px',
              }}
            >
              <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '13px', minWidth: '18px' }}>
                {idx}.
              </span>
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{renderFormattedText(block.content)}</span>
            </div>
          );
        }

        return (
          <p key={idx} style={{ margin: '12px 0', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {renderFormattedText(block.content)}
          </p>
        );
      })}
    </article>
  );
};
