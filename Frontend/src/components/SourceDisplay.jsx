import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Globe } from 'lucide-react';

const SourceDisplay = ({ sources = [] }) => {
  const [iframeErrorIndex, setIframeErrorIndex] = useState(null);

  // Normalize + dedupe sources
  const normalized = useMemo(() => {
    const seen = new Set();
    const out = [];

    (sources || []).forEach((s) => {
      if (!s) return;

      let raw = '';
      let title = null;
      let snippet = null;
      let id = null;

      if (typeof s === 'string') {
        raw = s;
      } else if (typeof s === 'object') {
        raw = s.source || s.url || s.id || s.name || '';
        title = s.title || s.name || null;
        snippet = s.snippet || s.preview || null;
        id = s.id ?? raw;
      } else {
        raw = String(s);
      }

      if (!raw) return;

      const isUrl = /^https?:\/\//i.test(raw);
      const display = isUrl
        ? (() => {
            try {
              return new URL(raw).hostname;
            } catch {
              return raw;
            }
          })()
        : raw.split('/').pop();

      const key = (isUrl ? raw.toLowerCase() : display.toLowerCase());
      if (!key || seen.has(key)) return;
      seen.add(key);

      out.push({
        id: id || key,
        raw,
        display,
        title,
        snippet,
        type: isUrl ? 'url' : /\.pdf$/i.test(display) ? 'pdf' : 'file',
      });
    });

    return out;
  }, [sources]);

  if (!normalized || normalized.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
        <FileText className="h-12 w-12 mb-3 text-gray-300" />
        <p className="text-sm text-center">Sources will appear here when available</p>
      </div>
    );
  }

  const isUrl = (val) => /^https?:\/\//i.test(val);

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sources</h3>
        <p className="text-sm text-gray-600">
          {normalized.length} source{normalized.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Scrollable source list */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {normalized.map((s, idx) => {
          const url = s.raw;
          const urlIs = isUrl(url);

          return (
            <Card
              key={s.id ?? idx}
              className="border border-gray-200 hover:border-blue-300 transition-colors flex flex-col"
            >
              <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex items-start justify-between w-full">
                  {/* Always show Document X */}
                  <Badge
                    variant="secondary"
                    className="text-xs break-words whitespace-normal w-full mr-2"
                  >
                    Document {idx + 1}
                  </Badge>

                  {urlIs ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(url, '_blank', 'noopener')}
                      className="h-6 w-6 p-0"
                      title="Open source in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(s.display || url);
                        } catch {
                          // ignore
                        }
                      }}
                      className="h-6 w-6 p-0"
                      title="Copy filename"
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0 flex flex-col flex-1">
                {urlIs ? (
                  <>
                    <div className="flex items-center space-x-2 mb-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{s.display}</span>
                    </div>

                    {/* Full iframe preview */}
                    <div className="relative border rounded overflow-hidden flex-1 min-h-[600px] h-[80vh]">
                      {iframeErrorIndex === idx ? (
                        <div className="p-4">
                          <p className="text-sm text-gray-700 mb-2">
                            Preview unavailable. Open the source to view it.
                          </p>
                          <Button onClick={() => window.open(url, '_blank', 'noopener')}>
                            Open Source
                          </Button>
                        </div>
                      ) : (
                        <iframe
                          src={url}
                          className="absolute top-0 left-0 w-full h-full"
                          title={`source-iframe-${idx}`}
                          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                          onError={() => setIframeErrorIndex(idx)}
                          onLoad={(e) => {
                            try {
                              const cw = e.target.contentWindow;
                              if (!cw || !cw.location) {
                                setTimeout(() => {}, 500);
                              }
                            } catch {
                              setIframeErrorIndex(idx);
                            }
                          }}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-800 break-words">{s.display}</span>
                    </div>

                    {s.title && (
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                        {s.title}
                      </h4>
                    )}
                    {s.snippet && (
                      <p className="text-xs text-gray-600 line-clamp-3 mb-2">{s.snippet}</p>
                    )}

                    <div className="mt-auto">
                      {s.raw && s.raw.startsWith('/api/download') && (
                        <Button onClick={() => window.open(s.raw, '_blank', 'noopener')}>
                          Open File
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SourceDisplay;
