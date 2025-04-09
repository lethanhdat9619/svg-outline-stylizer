
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface SVGUploaderProps {
  onSVGLoaded: (svgString: string) => void;
}

const SVGUploader: React.FC<SVGUploaderProps> = ({ onSVGLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processSVGFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    processSVGFile(file);
  };

  const processSVGFile = (file?: File) => {
    if (!file) {
      toast.error("No file selected");
      return;
    }

    if (!file.name.toLowerCase().endsWith('.svg')) {
      toast.error("Only SVG files are allowed");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const svgString = e.target?.result as string;
        onSVGLoaded(svgString);
        toast.success("SVG loaded successfully");
      } catch (error) {
        toast.error("Failed to load SVG file");
        console.error("SVG loading error:", error);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? 'border-brand-purple bg-brand-purple-light/30' : 'border-gray-300 hover:border-brand-purple'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".svg"
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-4">
        <Upload className="h-12 w-12 text-brand-purple" />
        <h3 className="text-lg font-medium">Upload SVG</h3>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop your SVG file here or click to browse
        </p>
        <Button 
          variant="outline" 
          className="border-brand-purple text-brand-purple hover:bg-brand-purple-light/50"
          onClick={handleButtonClick}
        >
          Select SVG File
        </Button>
      </div>
    </div>
  );
};

export default SVGUploader;
