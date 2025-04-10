import React, { useState, useEffect } from 'react';
import { processSVG } from '../utils/svgProcessor';
import SVGPreview from '../components/SVGPreview';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Slider } from '../components/ui/slider';

const ImageTest: React.FC = () => {
  const [originalSvg, setOriginalSvg] = useState<string | null>(null);
  const [processedSvg, setProcessedSvg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [borderWidth, setBorderWidth] = useState(10);
  const [borderColor, setBorderColor] = useState('#000000');

  // Load the test SVG on component mount
  useEffect(() => {
    // Load the card image SVG from our utils folder
    fetch('/src/utils/cardImage.svg')
      .then(response => response.text())
      .then(svgText => {
        setOriginalSvg(svgText);
      })
      .catch(error => {
        console.error('Error loading test SVG:', error);
      });
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setOriginalSvg(content);
        setProcessedSvg(null); // Reset processed SVG
      };
      reader.readAsText(file);
    }
  };

  const handleProcess = async () => {
    if (!originalSvg) return;

    setIsProcessing(true);

    try {
      // Process with a slight delay to allow the UI to update
      setTimeout(() => {
        const result = processSVG(originalSvg, borderWidth, borderColor);
        setProcessedSvg(result);
        setIsProcessing(false);
      }, 100);
    } catch (error) {
      console.error('Error processing SVG:', error);
      setIsProcessing(false);
    }
  };

  const handleBorderWidthChange = (value: number[]) => {
    setBorderWidth(value[0]);
  };

  // Thêm hàm để tải xuống ví dụ SVG mẫu
  const downloadSampleSvg = () => {
    fetch('/src/utils/cardImage.svg')
      .then(response => response.text())
      .then(svgText => {
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample-with-image.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading sample SVG:', error);
      });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">SVG Image Border Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="svg-file">Upload SVG File</Label>
                <Input
                  id="svg-file"
                  type="file"
                  accept=".svg"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="border-width">Border Width: {borderWidth}px</Label>
                <Slider
                  id="border-width"
                  min={1}
                  max={30}
                  step={1}
                  value={[borderWidth]}
                  onValueChange={handleBorderWidthChange}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="border-color">Border Color</Label>
                <div className="flex mt-1 gap-2">
                  <Input
                    id="border-color"
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="w-16 p-1 h-10"
                  />
                  <Input
                    type="text"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Sample SVG with embedded image</Label>
                <Button
                  variant="outline"
                  onClick={downloadSampleSvg}
                  className="mt-1 w-full"
                >
                  Download Sample SVG
                </Button>
              </div>

              <Button
                onClick={handleProcess}
                disabled={!originalSvg || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Process SVG'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>This page demonstrates the ability to add borders to SVGs containing embedded images.</p>
              <p>The processor uses a special approach for SVGs with embedded base64 images:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Detects SVGs containing image elements or base64 encoded images</li>
                <li>Creates a clean rectangular border around image-based SVGs</li>
                <li><b>Preserves the original SVG content without any modification</b></li>
                <li>Only adds a border rectangle and adjusts the viewBox to accommodate it</li>
                <li>Maintains all embedded images and their quality intact</li>
              </ul>
              <p className="font-medium mt-4">Advantages of this approach:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The original SVG structure is preserved exactly as it was</li>
                <li>All embedded images retain their original quality</li>
                <li>The border is added without affecting the original content</li>
                <li>Works with complex SVGs containing multiple embedded images</li>
              </ul>
              <p className="font-medium mt-4">Usage:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Upload an SVG file with embedded images (or use the default)</li>
                <li>Adjust the border width and color</li>
                <li>Click "Process SVG" to generate the bordered version</li>
                <li>Download the result using the download button</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SVGPreview
          svgString={originalSvg}
          title="Original SVG"
          className="h-[500px]"
        />

        <SVGPreview
          svgString={processedSvg}
          title="SVG with Border"
          isProcessing={isProcessing}
          downloadFileName="bordered-svg.svg"
          className="h-[500px]"
        />
      </div>
    </div>
  );
};

export default ImageTest; 