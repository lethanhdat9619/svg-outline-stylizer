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

/**
 * Checks if an SVG contains embedded images
 * @param svgString The SVG string to check
 * @returns True if the SVG contains an image element or xlink:href with base64 data
 */
const containsEmbeddedImages = (svgString: string): boolean => {
  return (
    svgString.includes("<image") ||
    svgString.includes('xlink:href="data:image') ||
    svgString.includes('href="data:image')
  );
};

/**
 * Creates a simple rectangular border for an SVG that contains embedded images
 * @param svgString The original SVG string
 * @param width The width of the SVG
 * @param height The height of the SVG
 * @param borderWidth The width of the border to add
 * @param borderColor The color of the border
 * @returns A new SVG string with a rectangular border
 */
const createRectangleBorderForImageSvg = (
  svgString: string,
  width: number,
  height: number,
  borderWidth: number,
  borderColor: string
): string => {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.documentElement;

    // Lưu lại tất cả các thuộc tính của SVG gốc
    const attributes = Array.from(svgElement.attributes).reduce((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {} as { [key: string]: string });

    // Đảm bảo các namespace quan trọng được bảo toàn
    if (!attributes["xmlns"]) {
      svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    if (!attributes["xmlns:xlink"] && svgString.includes("xlink:href")) {
      svgElement.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    }

    // Lấy kích thước và viewBox của SVG gốc
    const originalWidth = parseInt(attributes.width || width.toString());
    const originalHeight = parseInt(attributes.height || height.toString());
    const viewBox =
      attributes.viewBox || `0 0 ${originalWidth} ${originalHeight}`;
    const viewBoxParts = viewBox.split(" ").map(Number);
    const viewBoxX = viewBoxParts[0] || 0;
    const viewBoxY = viewBoxParts[1] || 0;
    const viewBoxWidth = viewBoxParts[2] || originalWidth;
    const viewBoxHeight = viewBoxParts[3] || originalHeight;

    // Tính toán viewBox mới để chứa viền
    const newViewBox = `${viewBoxX - borderWidth} ${viewBoxY - borderWidth} ${
      viewBoxWidth + borderWidth * 2
    } ${viewBoxHeight + borderWidth * 2}`;

    // Tính toán kích thước mới
    const newWidth = originalWidth + borderWidth * 2;
    const newHeight = originalHeight + borderWidth * 2;

    // Cập nhật thuộc tính width, height và viewBox
    svgElement.setAttribute("width", newWidth.toString());
    svgElement.setAttribute("height", newHeight.toString());
    svgElement.setAttribute("viewBox", newViewBox);

    // Tạo một nhóm để chứa nội dung gốc và di chuyển nó để làm chỗ cho viền
    const mainGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );

    // Thêm id cho nhóm chính để dễ dàng xác định
    mainGroup.setAttribute("id", "original-content-group");

    // Di chuyển tất cả nội dung gốc từ SVG vào nhóm mới
    while (svgElement.firstChild) {
      mainGroup.appendChild(svgElement.firstChild);
    }

    // Tạo hình chữ nhật làm viền
    const borderRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    borderRect.setAttribute("id", "border-rect");
    borderRect.setAttribute("x", (viewBoxX - borderWidth / 2).toString());
    borderRect.setAttribute("y", (viewBoxY - borderWidth / 2).toString());
    borderRect.setAttribute("width", (viewBoxWidth + borderWidth).toString());
    borderRect.setAttribute("height", (viewBoxHeight + borderWidth).toString());
    borderRect.setAttribute("rx", borderWidth.toString());
    borderRect.setAttribute("ry", borderWidth.toString());
    borderRect.setAttribute("stroke", borderColor);
    borderRect.setAttribute("stroke-width", borderWidth.toString());
    borderRect.setAttribute("fill", "none");

    // Thêm viền vào SVG trước
    svgElement.appendChild(borderRect);

    // Thêm nhóm chứa nội dung gốc vào SVG sau viền
    svgElement.appendChild(mainGroup);

    // Thêm bình luận để giải thích các phần của SVG
    const commentNode = document.createComment(
      " SVG with border added by SVG Outline Stylizer. Original content preserved in the group below. "
    );
    svgElement.insertBefore(commentNode, svgElement.firstChild);

    // Trả về chuỗi SVG mới
    const serializer = new XMLSerializer();
    const finalSvgString = serializer.serializeToString(svgElement);

    return finalSvgString;
  } catch (error) {
    console.error("Error creating border for image SVG:", error);
    return svgString; // Trả về SVG gốc nếu có lỗi
  }
};

export const processSVG = (
  svgString: unknown,
  borderWidth: number = 10,
  borderColor: string = "#000000"
): string => {
  try {
    // Check if the SVG input is a string and convert if necessary
    let svgStringValue: string;

    if (typeof svgString !== "string") {
      if (svgString === null || svgString === undefined) {
        throw new Error("SVG input is null or undefined");
      }

      // Try to convert to string
      try {
        if (svgString instanceof SVGElement) {
          const serializer = new XMLSerializer();
          svgStringValue = serializer.serializeToString(svgString);
        } else if (typeof svgString === "object") {
          svgStringValue = JSON.stringify(svgString);
        } else {
          svgStringValue = String(svgString);
        }
      } catch (error) {
        throw new Error(`Failed to convert SVG input to string: ${error}`);
      }
    } else {
      svgStringValue = svgString;
    }

    if (!svgStringValue.includes("<svg")) {
      throw new Error("Invalid SVG content: Missing <svg> tag");
    }

    initializePaper();
    console.log(
      "Processing SVG with border width:",
      borderWidth,
      "color:",
      borderColor
    );

    // Parse SVG to get width and height
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgStringValue, "image/svg+xml");
    const svgElement = svgDoc.documentElement;

    // Get the original SVG dimensions
    const width = parseInt(svgElement.getAttribute("width") || "24");
    const height = parseInt(svgElement.getAttribute("height") || "24");
    const viewBox =
      svgElement.getAttribute("viewBox") || `0 0 ${width} ${height}`;

    console.log("Original SVG dimensions:", width, height, "viewBox:", viewBox);

    // Check if the SVG contains embedded images
    if (containsEmbeddedImages(svgStringValue)) {
      console.log(
        "SVG contains embedded images, using rectangular border approach"
      );
      return createRectangleBorderForImageSvg(
        svgStringValue,
        width,
        height,
        borderWidth,
        borderColor
      );
    }

    // Clear project
    paper.project.clear();

    // Import SVG
    const importedItem = paper.project.importSVG(svgStringValue);
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
      console.log(
        "No paths found in SVG, falling back to rectangular border approach"
      );
      return createRectangleBorderForImageSvg(
        svgStringValue,
        width,
        height,
        borderWidth,
        borderColor
      );
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
    innerSvg.innerHTML = svgStringValue.replace(
      /<svg[^>]*>([\s\S]*)<\/svg>/i,
      "$1"
    );

    // Add the inner SVG to the final SVG
    finalSvg.appendChild(innerSvg);

    // Return the final SVG string
    const serializer = new XMLSerializer();
    const finalSvgString = serializer.serializeToString(finalSvg);

    console.log("SVG exported successfully");

    return finalSvgString;
  } catch (error) {
    console.error("Error processing SVG:", error);
    // Return the original SVG as a fallback
    return typeof svgString === "string" ? svgString : "";
  }
};

export const sanitizeSVG = (svgString: unknown): string => {
  // Check if the input is a valid string
  if (typeof svgString !== "string") {
    return "";
  }

  // Remove unwanted script tags for security
  return svgString.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
};
