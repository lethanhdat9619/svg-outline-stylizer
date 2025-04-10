import paper from "paper";
import PaperOffset from "paperjs-offset";

// Initialize Paper.js with a canvas element
let initialized = false;

const initializePaper = () => {
  if (!initialized) {
    // Create a canvas element for Paper.js
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1000;
    paper.setup(canvas);

    // Install PaperOffset
    if (typeof PaperOffset === "function") {
      PaperOffset(paper);
    }

    initialized = true;
    console.log("Paper.js initialized successfully");
  }
};

export const processSVG = (
  svgString: string,
  borderWidth: number = 10,
  borderColor: string = "#000000"
): string => {
  try {
    initializePaper();
    console.log(
      "Processing SVG with border width:",
      borderWidth,
      "color:",
      borderColor
    );

    // Clear project
    paper.project.clear();

    // Parse SVG to get width and height
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.documentElement;

    // Get the original SVG dimensions
    const width = parseInt(svgElement.getAttribute("width") || "24");
    const height = parseInt(svgElement.getAttribute("height") || "24");
    const viewBox =
      svgElement.getAttribute("viewBox") || `0 0 ${width} ${height}`;

    console.log("Original SVG dimensions:", width, height, "viewBox:", viewBox);

    // Import SVG
    const importedItem = paper.project.importSVG(svgString);
    console.log("SVG imported:", importedItem);

    if (!importedItem) {
      throw new Error("Failed to import SVG");
    }

    // Get all paths from the imported SVG
    const allPaths: paper.Path[] = [];

    // Correctly collect all paths from the imported SVG
    const collectPaths = (item: paper.Item) => {
      if (item instanceof paper.Path) {
        allPaths.push(item);
      } else if (item.children) {
        item.children.forEach((child) => collectPaths(child));
      }
    };

    collectPaths(importedItem);
    console.log("Found paths:", allPaths.length);

    if (allPaths.length === 0) {
      throw new Error("No paths found in SVG");
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

    // Ensure the path has no fill for the offset operation
    unifiedPath.fillColor = null;
    unifiedPath.strokeColor = null;

    // Use the offset method provided by PaperOffset with smoother joins
    // @ts-expect-error - Using PaperOffset's extension to Path
    const outlinePath = unifiedPath.offset(borderWidth, {
      join: "round",
      cap: "round",
    });

    if (!outlinePath) {
      throw new Error("Failed to create outer path");
    }

    console.log("Outline path created successfully");

    // Now let's remove the parts of the outline that overlap with the original SVG
    // First, create a compound path that represents the original SVG
    let originalShape: paper.PathItem;

    // If we only have one path in the original SVG
    if (allPaths.length === 1) {
      originalShape = allPaths[0].clone();
    } else {
      // For multiple paths, unite them to get the original shape
      try {
        // Clone all paths
        const pathClones = allPaths.map((path) => path.clone());

        // Convert paths to filled shapes
        pathClones.forEach((path) => {
          // Set a fill color to enable proper union/subtraction operations
          path.fillColor = new paper.Color("black");
          path.strokeColor = null;
        });

        // Unite all paths to get the original shape
        let unifiedOriginal = pathClones[0];
        for (let i = 1; i < pathClones.length; i++) {
          if (unifiedOriginal.unite) {
            const tempPath = unifiedOriginal.unite(pathClones[i]) as paper.Path;
            if (tempPath) {
              unifiedOriginal = tempPath;
            }
          }
        }

        originalShape = unifiedOriginal;

        // Clean up unused clones
        pathClones.forEach((path) => {
          if (path !== unifiedOriginal) {
            path.remove();
          }
        });
      } catch (error) {
        console.error("Error creating original shape:", error);
        // Fallback: Use the first path as the original shape
        originalShape = allPaths[0].clone();
      }
    }

    // Ensure both shapes have fill for the subtract operation
    outlinePath.fillColor = new paper.Color("black");
    originalShape.fillColor = new paper.Color("black");

    // Subtract the original SVG shape from the outline
    // This will remove any part of the outline that overlaps with the original SVG
    const cleanOutline = outlinePath.subtract(originalShape) as paper.PathItem;

    // Clean up temporary paths
    originalShape.remove();
    outlinePath.remove();

    const outlineBounds = cleanOutline.bounds;

    const paddingLeft = Math.max(0, -outlineBounds.x) + 2;
    const paddingTop = Math.max(0, -outlineBounds.y) + 2;
    const paddingRight =
      Math.max(0, outlineBounds.x + outlineBounds.width - width) + 2;
    const paddingBottom =
      Math.max(0, outlineBounds.y + outlineBounds.height - height) + 2;

    const newWidth = width + paddingLeft + paddingRight;
    const newHeight = height + paddingTop + paddingBottom;

    const newViewBox = `${-paddingLeft} ${-paddingTop} ${newWidth} ${newHeight}`;

    // Create a new SVG document
    const finalSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    finalSvg.setAttribute("width", newWidth.toString());
    finalSvg.setAttribute("height", newHeight.toString());
    finalSvg.setAttribute("viewBox", newViewBox);
    finalSvg.setAttribute("fill", "none");
    finalSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    paper.project.clear();
    paper.project.activeLayer.addChild(cleanOutline);

    cleanOutline.fillColor = null;
    cleanOutline.strokeColor = new paper.Color(borderColor);
    cleanOutline.strokeWidth = 2;

    // Export the clean outline as SVG string
    const cleanOutlineSvg = paper.project.exportSVG({
      asString: true,
    }) as string;
    const cleanOutlineGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    cleanOutlineGroup.innerHTML = cleanOutlineSvg.replace(
      /<svg[^>]*>([\s\S]*)<\/svg>/i,
      "$1"
    );

    // Add the clean outline group to the new SVG
    finalSvg.appendChild(cleanOutlineGroup);

    // Add the original SVG as a nested SVG, adjusted for the new viewBox
    const innerSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    innerSvg.setAttribute("x", "0");
    innerSvg.setAttribute("y", "0");
    innerSvg.setAttribute("width", width.toString());
    innerSvg.setAttribute("height", height.toString());
    innerSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    innerSvg.setAttribute("fill", "currentColor");
    innerSvg.innerHTML = svgString.replace(/<svg[^>]*>([\s\S]*)<\/svg>/i, "$1");

    // Add the inner SVG to the final SVG
    finalSvg.appendChild(innerSvg);

    // Return the final SVG string
    const serializer = new XMLSerializer();
    const finalSvgString = serializer.serializeToString(finalSvg);

    console.log("SVG exported successfully");

    return finalSvgString;
  } catch (error) {
    console.error("Error processing SVG:", error);
    throw error;
  }
};

export const sanitizeSVG = (svgString: string): string => {
  // Remove unwanted script tags for security
  return svgString.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
};
