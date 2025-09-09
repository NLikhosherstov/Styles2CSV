// Figma Plugin Main Code
// Extracts local styles, text styles, and variables using modern async Figma API
figma.showUI(__html__, { width: 500, height: 600, themeColors: true });

// Check if we're running in Figma environment
const isInFigma = typeof figma !== 'undefined' && typeof figma.getLocalPaintStylesAsync === 'function';

interface StyleData {
  id: string;
  name: string;
  type: "FILL" | "FONT";
  mode: string;
  description: string;
  value: string;
}

// Helper function to convert a single color stop to RGB string
function colorStopToRgb(color: RGB, opacity?: number): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const alpha = opacity !== undefined ? opacity : 1;
  
  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

// Function to extract color value from paint
function extractColorValue(paint: Paint): string {
  if (paint.type === 'SOLID') {
    const r = Math.round(paint.color.r * 255);
    const g = Math.round(paint.color.g * 255);
    const b = Math.round(paint.color.b * 255);
    const alpha = paint.opacity !== undefined ? paint.opacity : 1;
    
    if (alpha < 1) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } else if (paint.type === 'GRADIENT_LINEAR') {
    const gradientPaint = paint as GradientPaint;
    
    // Convert gradient transform matrix to angle
    const transform = gradientPaint.gradientTransform;
    let angle = 90; // Default angle
    
    if (transform && transform.length >= 2) {
      // Calculate angle from transform matrix
      // The gradient transform is a 2x3 matrix [[a, c, tx], [b, d, ty]]
      const a = transform[0][0];
      const b = transform[1][0];
      angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
      
      // Normalize angle to 0-360 range
      if (angle < 0) angle += 360;
    }
    
    // Process gradient stops
    const stops = gradientPaint.gradientStops.map(stop => {
      const colorValue = colorStopToRgb(stop.color, stop.color.a);
      const position = Math.round(stop.position * 10000) / 100; // Convert to percentage with 2 decimal places
      return `${colorValue} ${position}%`;
    }).join(', ');
    
    return `linear-gradient(${angle}deg, ${stops})`;
  } else if (paint.type === 'GRADIENT_RADIAL') {
    const gradientPaint = paint as GradientPaint;
    
    // Process gradient stops for radial gradient
    const stops = gradientPaint.gradientStops.map(stop => {
      const colorValue = colorStopToRgb(stop.color, stop.color.a);
      const position = Math.round(stop.position * 10000) / 100; // Convert to percentage with 2 decimal places
      return `${colorValue} ${position}%`;
    }).join(', ');
    
    return `radial-gradient(${stops})`;
  } else if (paint.type === 'GRADIENT_ANGULAR') {
    const gradientPaint = paint as GradientPaint;
    
    // Process gradient stops for conic gradient
    const stops = gradientPaint.gradientStops.map(stop => {
      const colorValue = colorStopToRgb(stop.color, stop.color.a);
      const position = Math.round(stop.position * 36000) / 100; // Convert to degrees with 2 decimal places
      return `${colorValue} ${position}deg`;
    }).join(', ');
    
    return `conic-gradient(${stops})`;
  } else if (paint.type === 'GRADIENT_DIAMOND') {
    // Diamond gradients don't have direct CSS equivalent, fallback to description
    return `diamond-gradient (not supported in CSS)`;
  } else if (paint.type === 'IMAGE') {
    return 'image-fill';
  } else if (paint.type === 'VIDEO') {
    return 'video-fill';
  }
  return paint.type.toLowerCase();
}

// Function to extract text style value
function extractTextStyleValue(style: TextStyle): string {
  const fontSize = style.fontSize;
  const fontFamily = style.fontName ? style.fontName.family : 'Unknown';
  const fontWeight = style.fontName ? style.fontName.style : 'Regular';
  const lineHeight = style.lineHeight;
  
  let lineHeightStr = '';
  if (typeof lineHeight === 'object' && lineHeight !== null) {
    if ('unit' in lineHeight) {
      if (lineHeight.unit === 'PERCENT') {
        lineHeightStr = `, ${lineHeight.value}%`;
      } else if (lineHeight.unit === 'PIXELS') {
        lineHeightStr = `, ${lineHeight.value}px`;
      }
    }
  } else if (typeof lineHeight === 'number') {
    lineHeightStr = `, ${lineHeight}`;
  }

  // Handle variable fontSize
  let fontSizeStr = '';
  if (typeof fontSize === 'number') {
    fontSizeStr = `${fontSize}px`;
  } else if (fontSize === figma.mixed) {
    fontSizeStr = 'mixed';
  } else if (fontSize && typeof fontSize === 'object' && 'type' in fontSize) {
    // Handle variable alias for fontSize
    const fontSizeObj = fontSize as { type: string; id?: string };
    if (fontSizeObj.type === 'VARIABLE_ALIAS') {
      fontSizeStr = 'Variable reference';
    }
  } else {
    fontSizeStr = 'Unknown';
  }
  
  return `${fontFamily}, ${fontSizeStr}, ${fontWeight}${lineHeightStr}`;
}

// Function to create mode mapping from collections
async function createModeMapping(): Promise<Map<string, string>> {
  const modeMapping = new Map<string, string>();
  
  try {
    if (figma.variables && typeof figma.variables.getLocalVariableCollectionsAsync === "function") {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      
      for (const collection of collections) {
        for (const mode of collection.modes) {
          const modeName = collection.name ? `"${collection.name}/${mode.name}"` : `"${mode.name}"`;
          modeMapping.set(mode.modeId, modeName);
        }
      }
      

    }
  } catch (error) {
    console.error('Error creating mode mapping:', error);
  }
  
  return modeMapping;
}

// Function to get all styles
async function getAllStyles(): Promise<StyleData[]> {
  const styles: StyleData[] = [];
  
  // Check if we're in Figma environment
  if (!isInFigma) {
    return styles;
  }

  // Create mode mapping for variables
  const modeMapping = await createModeMapping();

  try {
    // Get local paint styles
    if (typeof figma.getLocalPaintStylesAsync === 'function') {
      const localPaintStyles = await figma.getLocalPaintStylesAsync();
      let paintStylesCount = 0;
      for (const style of localPaintStyles) {
        try {
          if (style.paints && style.paints.length > 0) {
            const paint = style.paints[0];
            styles.push({
              id: style.id,
              name: style.name,
              type: "FILL",
              mode: "",
              description: style.description || "",
              value: extractColorValue(paint)
            });
            paintStylesCount++;
          }
        } catch (styleError) {
          console.warn('Error processing paint style:', style.name, styleError);
        }
      }

    }
    
    // Get local text styles
    if (typeof figma.getLocalTextStylesAsync === 'function') {
      const localTextStyles = await figma.getLocalTextStylesAsync();
      let textStylesCount = 0;
      for (const style of localTextStyles) {
        try {
          styles.push({
            id: style.id,
            name: style.name,
            type: "FONT",
            mode: "",
            description: style.description || "",
            value: extractTextStyleValue(style)
          });
          textStylesCount++;
        } catch (styleError) {
          console.warn('Error processing text style:', style.name, styleError);
        }
      }
    }
  } catch (error) {
    console.error('Error getting local styles:', error);
  }

  // Get local color variables only
  try {
    if (figma.variables && typeof figma.variables.getLocalVariablesAsync === 'function') {
      const localVariables = await figma.variables.getLocalVariablesAsync();
      let variablesCount = 0;
      for (const variable of localVariables) {
        try {
          // Only process COLOR type variables
          if (variable.resolvedType === 'COLOR') {
            // Process each mode separately
            const modeIds = Object.keys(variable.valuesByMode);
            for (const modeId of modeIds) {
              const value = variable.valuesByMode[modeId];
              
              let valueString = '';
              
              if (value && typeof value === 'object' && 'r' in value) {
                // Handle color values
                const colorValue = value as any;
                const r = Math.round(colorValue.r * 255);
                const g = Math.round(colorValue.g * 255);
                const b = Math.round(colorValue.b * 255);
                const a = colorValue.a !== undefined ? colorValue.a : 1;
                valueString = a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
              } else {
                valueString = String(value);
              }

              // Get readable mode name from mapping, fallback to ID if not found
              const modeName = modeMapping.get(modeId) || `\"${modeId}\"`;

              styles.push({
                id: variable.id,
                name: variable.name,
                type: "FILL", // All color variables are classified as FILL
                mode: modeName,
                description: variable.description || "",
                value: valueString
              });
              variablesCount++;
            }
          }
        } catch (variableError) {
          console.warn('Error processing variable:', variable.name, variableError);
        }
      }

    }
  } catch (error) {

  }
  
  return styles;
}

// Color format conversion functions
function parseRgbColor(rgbString: string): { r: number; g: number; b: number; a: number } | null {
  // Parse rgb(r, g, b) or rgba(r, g, b, a) format
  const rgbMatch = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
      a: rgbMatch[4] ? Math.round(parseFloat(rgbMatch[4]) * 255) : 255
    };
  }
  return null;
}

function componentToHex(c: number): string {
  const hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function formatColor(colorValue: string, format: 'rgba' | 'hex-argb' | 'hex-rgb'): string {
  const colorData = parseRgbColor(colorValue);
  if (!colorData) {
    return colorValue; // Return original if not parseable
  }

  const { r, g, b, a } = colorData;

  switch (format) {
    case "rgba":
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    case "hex-argb":
      return `#${componentToHex(a)}${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`.toUpperCase();
    case "hex-rgb":
      return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`.toUpperCase();
    default:
      return colorValue;
  }
}

function formatGradient(gradientValue: string, format: 'rgba' | 'hex-argb' | 'hex-rgb'): string {
  // Parse and reformat gradient colors based on the selected format
  if (gradientValue.includes("linear-gradient") || gradientValue.includes("radial-gradient") || gradientValue.includes("conic-gradient")) {
    // Extract colors from gradient and reformat them
    const colorRegex = /rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d.]+)?\)/g;
    return gradientValue.replace(colorRegex, (match) => formatColor(match, format));
  }
  return gradientValue;
}

// Function to convert styles to CSV
function stylesToCSV(styles: StyleData[], colorFormat: 'rgba' | 'hex-argb' | 'hex-rgb' = 'rgba'): string {
  const headers = ["Type", "Mode", "Name", "Value", "Description"];
  const rows = styles.map(style => {
    let value = style.value;
    
    // Apply formatting for FILL type styles
    if (style.type === "FILL") {
      // Check if it's a gradient
      if (value.includes("gradient") || value.includes("GRADIENT")) {
        value = formatGradient(value, colorFormat);
      } 
      // Check if it's a regular color
      else if (value.startsWith("rgb")) {
        value = formatColor(value, colorFormat);
      }
    }
    
    return [
      style.type,
      style.mode,
      `"${style.name}"`,
      `"${value}"`,
      `"${style.description}"`
    ];
  });
  
  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

// Filter styles based on filters
function filterStyles(styles: StyleData[], filters: { colors: boolean; typography: boolean; variables: boolean }): StyleData[] {
  return styles.filter(style => {
    if (!filters.colors && style.type === 'FILL') return false;
    if (!filters.typography && style.type === 'FONT') return false;
    // Variables filter now applies to both FILL and FONT types that came from variables
    // Check if style has a mode (came from variables) and variables filter is disabled
    if (!filters.variables && style.mode && style.mode !== "") return false;
    return true;
  });
}

// Initialize plugin
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'get-styles') {
    try {
      const styles = await getAllStyles();
      const colorFormat = msg.colorFormat || 'rgba';
      const csvData = stylesToCSV(styles, colorFormat);
      
      figma.ui.postMessage({
        type: 'styles-data',
        styles: styles,
        csvData: csvData
      });
    } catch (error) {
      console.error('Error extracting styles:', error);
      
      figma.ui.postMessage({
        type: 'error',
        message: 'Failed to extract styles: ' + (error instanceof Error ? error.message : String(error))
      });
      
    }
  } else if (msg.type === 'generate-csv') {
    try {
      const styles = await getAllStyles();
      const filters = msg.filters || { colors: true, typography: true, variables: true };
      const colorFormat = msg.colorFormat || 'rgba';
      
      const filteredStyles = filterStyles(styles, filters);
      const csvData = stylesToCSV(filteredStyles, colorFormat);
      
      figma.ui.postMessage({
        type: 'csv-data',
        csvData: csvData,
        filteredStyles: filteredStyles
      });
    } catch (error) {
      console.error('Error generating CSV:', error);
      
      figma.ui.postMessage({
        type: 'error',
        message: 'Failed to generate CSV: ' + (error instanceof Error ? error.message : String(error))
      });
    }
  } else if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};

