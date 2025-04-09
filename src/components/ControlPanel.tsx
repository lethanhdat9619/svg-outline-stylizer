
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { RefreshCcw } from 'lucide-react';

interface ControlPanelProps {
  borderWidth: number;
  borderColor: string;
  onBorderWidthChange: (value: number) => void;
  onBorderColorChange: (value: string) => void;
  onProcess: () => void;
  isProcessing: boolean;
  hasOriginalSVG: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  borderWidth,
  borderColor,
  onBorderWidthChange,
  onBorderColorChange,
  onProcess,
  isProcessing,
  hasOriginalSVG
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Border Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="border-width">Border Width: {borderWidth}px</Label>
          </div>
          <Slider
            id="border-width"
            min={1}
            max={50}
            step={1}
            value={[borderWidth]}
            onValueChange={(value) => onBorderWidthChange(value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="border-color">Border Color</Label>
          <div className="flex gap-2">
            <div 
              className="w-10 h-10 rounded border" 
              style={{ backgroundColor: borderColor }}
            />
            <Input
              id="border-color"
              type="text"
              value={borderColor}
              onChange={(e) => onBorderColorChange(e.target.value)}
              className="flex-1"
            />
            <Input
              type="color"
              value={borderColor}
              onChange={(e) => onBorderColorChange(e.target.value)}
              className="w-14 h-10 p-1"
            />
          </div>
        </div>

        <Button 
          className="w-full bg-brand-purple hover:bg-brand-purple-dark"
          onClick={onProcess}
          disabled={isProcessing || !hasOriginalSVG}
        >
          {isProcessing ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Generate Outline'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
