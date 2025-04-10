import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SVGPreviewProps {
  svgString: string | null | undefined;
  title: string;
  isProcessing?: boolean;
  downloadFileName?: string;
  className?: string;
}

const SVGPreview: React.FC<SVGPreviewProps> = ({
  svgString,
  title,
  isProcessing = false,
  downloadFileName,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [sanitizedSVG, setSanitizedSVG] = useState('');

  useEffect(() => {
    // Check if svgString is a valid string first
    if (typeof svgString === 'string' && svgString.trim()) {
      try {
        // Simple sanitization - remove scripts
        const cleanSVG = svgString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        setSanitizedSVG(cleanSVG);
      } catch (error) {
        console.error('Error sanitizing SVG:', error);
        setSanitizedSVG('');
      }
    } else {
      // If svgString is not a valid string, set sanitizedSVG to empty
      setSanitizedSVG('');
    }
  }, [svgString]);

  const handleZoomIn = () => {
    setZoom(prev => prev + 0.25);
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.25, prev - 0.25));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleDownload = () => {
    if (!sanitizedSVG) return;

    const blob = new Blob([sanitizedSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFileName || 'modified-svg.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to check if SVG content exists
  const hasSvgContent = Boolean(sanitizedSVG);

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.25}
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleResetZoom}
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            {downloadFileName && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                disabled={!hasSvgContent || isProcessing}
                className="h-8 w-8 ml-2"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center overflow-auto p-3 bg-gray-50 rounded-md">
        <div
          ref={containerRef}
          className="relative flex items-center justify-center w-full h-full"
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-purple mb-2" />
              <p className="text-sm text-gray-500">Processing SVG...</p>
            </div>
          ) : hasSvgContent ? (
            <div
              style={{
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease-out'
              }}
              className="svg-container max-w-full max-h-full"
              dangerouslySetInnerHTML={{ __html: sanitizedSVG }}
            />
          ) : (
            <p className="text-gray-500 text-sm">No SVG to display</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SVGPreview;
