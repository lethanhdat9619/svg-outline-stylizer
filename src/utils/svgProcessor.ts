
import paper from 'paper';
import PaperOffset from 'paperjs-offset';

// Initialize Paper.js with a canvas element
let initialized = false;

const initializePaper = () => {
  if (!initialized) {
    // Create a canvas element for Paper.js
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    paper.setup(canvas);
    
    // PaperOffset is a function that extends paper
    PaperOffset(paper);
    
    initialized = true;
    console.log("Paper.js initialized successfully");
  }
};

export const processSVG = (
  svgString: string, 
  borderWidth: number = 10, 
  borderColor: string = '#000000'
): string => {
  try {
    initializePaper();
    console.log("Processing SVG with border width:", borderWidth, "color:", borderColor);
    
    // Clear project
    paper.project.clear();
    
    // Import SVG
    const importedItem = paper.project.importSVG(svgString);
    console.log("SVG imported:", importedItem);
    
    // Get all paths from the imported SVG
    const allPaths: paper.Path[] = [];
    
    // Correctly collect all paths from the imported SVG
    const collectPaths = (item: paper.Item) => {
      if (item instanceof paper.Path) {
        allPaths.push(item);
      } else if (item.children) {
        // Use children array instead of traverse method
        item.children.forEach(child => collectPaths(child));
      }
    };
    
    collectPaths(importedItem);
    console.log("Found paths:", allPaths.length);
    
    if (allPaths.length === 0) {
      throw new Error('No paths found in SVG');
    }
    
    // Create a compound path from all paths to ensure we have an outer path
    const compoundPath = new paper.CompoundPath({
      children: allPaths.map(path => path.clone()),
      fillColor: null,
      strokeColor: null
    });
    
    // Generate the outer border using offset
    // Use the correct method from PaperOffset
    const outerPath = compoundPath.offset(borderWidth, { join: 'round' });
    
    if (!outerPath) {
      throw new Error('Failed to create outer path');
    }
    
    console.log("Outer path created successfully");
    
    // Style the outer path
    outerPath.fillColor = null;
    outerPath.strokeColor = new paper.Color(borderColor);
    outerPath.strokeWidth = 1;
    
    // Hide the original SVG for export
    compoundPath.visible = false;
    
    // Add the original SVG back, but with no stroke
    const originalItem = paper.project.importSVG(svgString);
    originalItem.strokeColor = null;
    
    // Export the result as SVG
    const exportedSVG = paper.project.exportSVG({ asString: true }) as string;
    console.log("SVG exported successfully");
    
    return exportedSVG;
  } catch (error) {
    console.error('Error processing SVG:', error);
    throw error;
  }
};

export const sanitizeSVG = (svgString: string): string => {
  // Remove unwanted script tags for security
  return svgString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
