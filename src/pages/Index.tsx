import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import SVGUploader from '@/components/SVGUploader';
import SVGPreview from '@/components/SVGPreview';
import ControlPanel from '@/components/ControlPanel';
import { processSVG, sanitizeSVG } from '@/utils/svgProcessor';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [originalSVG, setOriginalSVG] = useState<string>('');
  const [processedSVG, setProcessedSVG] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('upload');

  // Settings
  const [borderWidth, setBorderWidth] = useState<number>(10);
  const [borderColor, setBorderColor] = useState<string>('#000000');

  const handleSVGLoaded = useCallback((svgString: string) => {
    const cleanSVG = sanitizeSVG(svgString);
    setOriginalSVG(cleanSVG);
    setProcessedSVG('');
    setActiveTab('preview');
  }, []);

  const handleProcessSVG = useCallback(async () => {
    if (!originalSVG) {
      toast.error("No SVG loaded");
      return;
    }

    setIsProcessing(true);
    try {
      // Using a setTimeout to allow UI to update before processing
      setTimeout(async () => {
        try {
          const result = processSVG(originalSVG, borderWidth, borderColor);
          setProcessedSVG(result);
          toast.success("SVG processed successfully");
        } catch (error) {
          console.error("Processing error:", error);
          toast.error("Failed to process SVG");
        } finally {
          setIsProcessing(false);
        }
      }, 100);
    } catch (error) {
      setIsProcessing(false);
      toast.error("Failed to process SVG");
      console.error("Processing error:", error);
    }
  }, [originalSVG, borderWidth, borderColor]);

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">SVG Outline Stylizer</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload an SVG, add an outer border, and generate a cutting-ready SVG with transparent background.
          </p>
        </header>

        <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload">Upload SVG</TabsTrigger>
            <TabsTrigger value="preview" disabled={!originalSVG}>Preview & Process</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <SVGUploader onSVGLoaded={handleSVGLoaded} />

            {originalSVG && (
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => setActiveTab('preview')}
                  className="bg-brand-purple hover:bg-brand-purple-dark"
                >
                  Continue to Preview
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <ControlPanel
                  borderWidth={borderWidth}
                  borderColor={borderColor}
                  onBorderWidthChange={setBorderWidth}
                  onBorderColorChange={setBorderColor}
                  onProcess={handleProcessSVG}
                  isProcessing={isProcessing}
                  hasOriginalSVG={!!originalSVG}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px]">
                <SVGPreview
                  svgString={originalSVG}
                  title="Original SVG"
                  className="h-full"
                />
                <SVGPreview
                  svgString={processedSVG}
                  title="Processed SVG"
                  isProcessing={isProcessing}
                  downloadFileName="outlined-svg.svg"
                  className="h-full"
                />
              </div>
            </div>

            <div className="flex justify-center space-x-4 mt-6">
              <Button
                variant="outline"
                onClick={() => setActiveTab('upload')}
              >
                Upload Another SVG
              </Button>

              {processedSVG && (
                <Button
                  className="bg-brand-purple hover:bg-brand-purple-dark"
                  onClick={() => {
                    const blob = new Blob([processedSVG], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'outlined-svg.svg';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download Processed SVG
                </Button>
              )}
            </div>

            <Button variant="outline" onClick={() => navigate('/image-test')}>
              Test SVG Image Borders
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
