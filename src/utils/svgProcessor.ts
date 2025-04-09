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
    
    // Install PaperOffset
    if (typeof PaperOffset === 'function') {
      PaperOffset(paper);
    }
    
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
    
    if (!importedItem) {
      throw new Error('Failed to import SVG');
    }
    
    // Get all paths from the imported SVG
    const allPaths: paper.Path[] = [];
    
    // Correctly collect all paths from the imported SVG
    const collectPaths = (item: paper.Item) => {
      if (item instanceof paper.Path) {
        allPaths.push(item);
      } else if (item.children) {
        item.children.forEach(child => collectPaths(child));
      }
    };
    
    collectPaths(importedItem);
    console.log("Found paths:", allPaths.length);
    
    if (allPaths.length === 0) {
      throw new Error('No paths found in SVG');
    }
    
    // Create an outer path by uniting all paths
    let unifiedPath: paper.PathItem;
    
    if (allPaths.length === 1) {
      unifiedPath = allPaths[0].clone();
    } else {
      // Create a single unified path from all paths
      unifiedPath = allPaths[0].clone();
      for (let i = 1; i < allPaths.length; i++) {
        const nextPath = allPaths[i].clone();
        if (unifiedPath.unite) {
          unifiedPath = unifiedPath.unite(nextPath);
          nextPath.remove();
        }
      }
    }
    
    console.log("Created unified path");
    
    // Ensure the unified path has no fill for the offset operation
    unifiedPath.fillColor = null;
    unifiedPath.strokeColor = null;
    
    // Use the offset method provided by PaperOffset
    // @ts-ignore - Using PaperOffset's extension to Path
    const outerPath = unifiedPath.offset(borderWidth, { join: 'round' });
    
    if (!outerPath) {
      throw new Error('Failed to create outer path');
    }
    
    console.log("Outer path created successfully");
    
    // Style the outer path (outline only, no fill)
    outerPath.fillColor = null;
    outerPath.strokeColor = new paper.Color(borderColor);
    outerPath.strokeWidth = 1;
    
    // The original SVG should be visible, but the unified path should be hidden
    unifiedPath.visible = false;
    
    // Add the original SVG back
    const originalItem = paper.project.importSVG(svgString);
    if (originalItem) {
      // Make sure the original SVG has no stroke so it doesn't interfere with the border
      const removeStrokes = (item: paper.Item) => {
        if (item instanceof paper.Path) {
          // Keep fill, remove stroke
          item.strokeColor = null;
        } else if (item.children) {
          item.children.forEach(child => removeStrokes(child));
        }
      };
      
      removeStrokes(originalItem);
    }
    
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
