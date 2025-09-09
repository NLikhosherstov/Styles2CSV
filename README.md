# Figma Styles to CSV Export Plugin

A Figma plugin that automatically extracts local styles from your design files and exports them as CSV format for documentation, design system management, and external tool integration.

## Features

### Style Extraction
- **Local Paint Styles**: Extract all color styles including solid colors, gradients (linear, radial, conic, diamond)
- **Local Text Styles**: Extract typography styles with font family, weight, size, and line height information
- **Local Variables**: Extract color variables with mode-specific values for design tokens

### Data Processing
- **Multiple Color Formats**: Support for RGBA, HEX (AARRGGBB), and HEX (RRGGBB) formats
- **Gradient Support**: Full support for all Figma gradient types with proper CSS conversion
- **Mode-Aware Variables**: Correctly handles variable modes with readable collection/mode names
- **Comprehensive Metadata**: Includes style names, descriptions, types, and mode information

### Filtering Options
- **Style Type Filters**: Toggle Colors, Typography, and Variables independently
- **Export Settings**: Configure color format before export
- **Real-time Updates**: Live filtering and preview of exported data

### Export Capabilities
- **CSV Generation**: Clean, structured CSV output with proper escaping
- **Download Functionality**: Direct file download with automatic filename
- **Copy Support**: Select all text functionality with Ctrl+A support (including Russian keyboard layout)
- **Statistics**: Real-time count of filtered styles by type

## Usage

1. **Open Plugin**: Launch "Figma Styles to CSV" from the Figma plugins menu
2. **Configure Filters**: Use the Export Settings panel to select which style types to include
3. **Choose Format**: Select your preferred color format (RGBA, HEX-ARGB, HEX-RGB)
4. **Review Data**: Preview the generated CSV in the output textarea
5. **Export**: Click "Download CSV" to save the file or use "Select All" to copy the data

## CSV Output Format

The exported CSV contains the following columns:

| Column | Description |
|--------|-------------|
| Type | Style type (FILL, FONT) |
| Mode | Variable mode name (if applicable) |
| Name | Style name from Figma |
| Value | Processed style value (color, gradient, or font specification) |
| Description | Style description from Figma |

### Example Output

```csv
Type,Mode,Name,Value,Description
FILL,,"Primary/Blue/500","rgb(59, 130, 246)","Primary brand color"
FILL,"Theme/Dark","Background","rgb(18, 18, 18)","Dark theme background"
FILL,"Theme/dark","bkg/warning","rgba(248, 194, 79, 255)",""
FILL,,"main gradient","linear-gradient(270deg, rgba(176, 109, 109, 255) 28.37%, rgba(0, 24, 145, 255) 78.37%)","Main linear gradient"
FONT,,"Heading/Large","Inter, 32px, Bold, 120%","Main page headings"
```

## Data Format Specifications

### Color Values (FILL Type)

#### Solid Colors
Solid color values are extracted and converted according to the selected format:

**RGBA Format** (default):
- Format: `rgba(r, g, b, a)` (always includes alpha channel)
- Range: r,g,b: 0-255, a: 0-255 (converted from Figma's 0-1 range)
- Examples: 
  - `rgba(59, 130, 246, 255)` - Opaque blue (alpha 1.0 → 255)
  - `rgba(59, 130, 246, 204)` - 80% opacity blue (alpha 0.8 → 204)

**HEX ARGB Format**:
- Format: `#AARRGGBB` (Alpha-Red-Green-Blue)
- Range: Each component 00-FF (hexadecimal)
- Alpha conversion: Input alpha 0-1 is converted to 0-255 range
- Examples:
  - `#FF3B82F6` - Opaque blue (alpha 1.0 → 255 → FF)
  - `#CC3B82F6` - 80% opacity blue (alpha 0.8 → 204 → CC)

**HEX RGB Format**:
- Format: `#RRGGBB` (Red-Green-Blue, alpha ignored)
- Range: Each component 00-FF (hexadecimal)
- Examples:
  - `#3B82F6` - Blue (opacity information lost)
  - `#18A058` - Green

#### Gradient Values
Gradients are processed and converted to CSS-compatible format with color format conversion applied:

**Linear Gradients**:
- Format: `linear-gradient(angle, color1 stop1, color2 stop2, ...)`
- Angle: 0-360 degrees, calculated from Figma transform matrix
- Stop positions: 0-100% with 2 decimal precision
- Example: `linear-gradient(180deg, rgb(59, 130, 246) 0%, rgb(239, 68, 68) 100%)`

**Radial Gradients**:
- Format: `radial-gradient(color1 stop1, color2 stop2, ...)`
- Stop positions: 0-100% with 2 decimal precision
- Example: `radial-gradient(rgb(255, 255, 255) 0%, rgb(0, 0, 0) 100%)`

**Conic Gradients**:
- Format: `conic-gradient(color1 angle1, color2 angle2, ...)`
- Angles: 0-360 degrees with 2 decimal precision
- Example: `conic-gradient(rgb(255, 0, 0) 0deg, rgb(0, 255, 0) 120deg, rgb(0, 0, 255) 240deg)`

**Diamond Gradients**:
- Format: `diamond-gradient (not supported in CSS)`
- Note: Figma-specific gradient type without CSS equivalent

**Special Fill Types**:
- Image fills: `image-fill`
- Video fills: `video-fill`
- Unknown types: Converted to lowercase type name

### Typography Values (FONT Type)

Typography styles are formatted as comma-separated values containing font information:

**Format Structure**: `FontFamily, FontSize, FontWeight[, LineHeight]`

**Font Family**:
- Source: Figma font family name
- Fallback: `Unknown` if not available
- Examples: `Inter`, `Roboto`, `SF Pro Display`

**Font Size**:
- Format: `{size}px` for pixel values
- Special values:
  - `mixed` - When multiple sizes are applied
  - `Variable reference` - When linked to design token
  - `Unknown` - When size cannot be determined
- Range: Typically 8px-128px in design systems
- Examples: `16px`, `24px`, `32px`

**Font Weight**:
- Source: Figma font style/weight
- Common values: `Thin`, `Light`, `Regular`, `Medium`, `SemiBold`, `Bold`, `Black`
- Fallback: `Regular` if not specified
- Note: Exact naming depends on font family specifications

**Line Height** (optional):
- Percentage format: `{value}%` (e.g., `120%`, `150%`)
- Pixel format: `{value}px` (e.g., `24px`, `32px`)
- Numeric format: `{value}` for relative values (e.g., `1.5`, `1.2`)
- Omitted when line height is not specified

**Complete Examples**:
- `Inter, 16px, Regular, 150%` - Body text with percentage line height
- `Roboto, 24px, Bold, 32px` - Heading with pixel line height  
- `SF Pro Display, 32px, Medium` - Heading without line height
- `Inter, Variable reference, Regular, 120%` - Token-based size

### Variable Values (Mode-Aware)

Variables represent design tokens with mode-specific values:

**Mode Format**:
- Structure: `"CollectionName/ModeName"` (quoted in CSV)
- Examples: `"Theme/Light"`, `"Theme/Dark"`, `"Brand/Primary"`
- Empty string for non-variable styles

**Color Variables**:
- Only COLOR type variables are processed
- Each mode generates separate CSV row
- Value follows same color format rules as solid colors
- Same variable name appears multiple times with different modes

**Value Processing**:
- Color values: Processed through same color format conversion
- Range: 0-255 for RGB components, 0-255 for alpha (converted from 0-1 input)
- Supports all three export formats (RGBA, HEX-ARGB, HEX-RGB)

**Example Variable Export**:
```csv
FILL,"Theme/Light","Background","rgba(255, 255, 255, 255)","Background color"
FILL,"Theme/Dark","Background","rgba(18, 18, 18, 255)","Background color"
```

### Data Validation and Limits

**Color Component Ranges**:
- RGB values: 0-255 (8-bit)
- Alpha values: 
  - RGBA format: 0-255 (converted from Figma's 0-1 range)
  - HEX ARGB format: 00-FF hexadecimal (converted from 0-1 input)
- Gradient stops: 0-100% position
- Gradient angles: 0-360 degrees

**String Length Limits**:
- Style names: No enforced limit (Figma constraint)
- Descriptions: No enforced limit (Figma constraint)
- Mode names: Typically under 100 characters
- Font family names: Usually under 50 characters

**Processing Boundaries**:
- Gradient stops: Minimum 2, maximum depends on Figma
- Font size range: 0.1px - 1000px (Figma limits)
- Line height: 0.1 - 10.0 for relative values
- Percentage line height: 1% - 1000%

## Development Notes

### Local Styles Only
The plugin focuses exclusively on local styles within the current Figma file, ensuring fast performance and avoiding external dependencies.

### Variable Mode Support
Color variables are processed with full mode awareness, generating separate entries for each mode with readable collection/mode names.

## Requirements

- Figma Desktop App or Browser Version
- File with local styles, text styles, or color variables
- No external dependencies or authentication required

## Version Compatibility

Compatible with current (2025) Figma Plugin API. The plugin uses async methods and gracefully handles API availability checks.
