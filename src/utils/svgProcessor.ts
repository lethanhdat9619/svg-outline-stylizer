
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
    
    // Parse SVG to get width and height
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.documentElement;
    
    // Get the original SVG dimensions
    let width = parseInt(svgElement.getAttribute('width') || '24');
    let height = parseInt(svgElement.getAttribute('height') || '24');
    let viewBox = svgElement.getAttribute('viewBox') || `0 0 ${width} ${height}`;
    
    console.log("Original SVG dimensions:", width, height, "viewBox:", viewBox);
    
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
    
    // Calculate the bounds for the outer path to ensure we don't cut it off
    const outerBounds = outerPath.bounds;
    
    // Calculate padding needed to fully display the border
    // We add a small extra padding (2px) to ensure nothing gets cut off
    const paddingLeft = Math.max(0, -outerBounds.x) + 2;
    const paddingTop = Math.max(0, -outerBounds.y) + 2;
    const paddingRight = Math.max(0, outerBounds.x + outerBounds.width - width) + 2;
    const paddingBottom = Math.max(0, outerBounds.y + outerBounds.height - height) + 2;
    
    // New dimensions that will fully contain both the original SVG and the border
    const newWidth = width + paddingLeft + paddingRight;
    const newHeight = height + paddingTop + paddingBottom;
    
    // Create a viewBox that ensures the entire content is visible
    const newViewBox = `${-paddingLeft} ${-paddingTop} ${newWidth} ${newHeight}`;
    
    console.log("New dimensions:", newWidth, newHeight, "viewBox:", newViewBox);
    
    // Create a new SVG document
    const finalSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    finalSvg.setAttribute('width', newWidth.toString());
    finalSvg.setAttribute('height', newHeight.toString());
    finalSvg.setAttribute('viewBox', newViewBox);
    finalSvg.setAttribute('fill', 'none');
    finalSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Export the outer path
    paper.project.clear();
    paper.project.activeLayer.addChild(outerPath);
    
    // Style the outer path (outline only, no fill)
    outerPath.fillColor = null;
    outerPath.strokeColor = new paper.Color(borderColor);
    outerPath.strokeWidth = 2;
    
    // Export the outer path as SVG string
    const outerPathSvg = paper.project.exportSVG({ asString: true }) as string;
    const outerPathGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    outerPathGroup.innerHTML = outerPathSvg.replace(/<svg[^>]*>([\s\S]*)<\/svg>/i, '$1');
    
    // Add the outer path group to the new SVG
    finalSvg.appendChild(outerPathGroup);
    
    // Add the original SVG as a nested SVG, adjusted for the new viewBox
    const innerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    innerSvg.setAttribute('x', '0');
    innerSvg.setAttribute('y', '0');
    innerSvg.setAttribute('width', width.toString());
    innerSvg.setAttribute('height', height.toString());
    innerSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    innerSvg.setAttribute('fill', 'currentColor');
    innerSvg.innerHTML = svgString.replace(/<svg[^>]*>([\s\S]*)<\/svg>/i, '$1');
    
    // Add the inner SVG to the final SVG
    finalSvg.appendChild(innerSvg);
    
    // Return the final SVG string
    const serializer = new XMLSerializer();
    const finalSvgString = serializer.serializeToString(finalSvg);
    
    console.log("SVG exported successfully");
    
    return finalSvgString;
  } catch (error) {
    console.error('Error processing SVG:', error);
    throw error;
  }
};

export const sanitizeSVG = (svgString: string): string => {
  // Remove unwanted script tags for security
  return svgString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
