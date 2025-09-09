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
FONT,,"Heading/Large","Inter, 32px, Bold, 120%","Main page headings"
```

## Technical Implementation

### Plugin Architecture
- **Modern Async API**: Uses Figma's latest async methods for improved performance
- **Error Handling**: Comprehensive error catching with user-friendly messages
- **Fallback Support**: Graceful degradation for different Figma API availability

### Style Processing
- **Paint Style Extraction**: Handles all paint types including complex gradients
- **Text Style Processing**: Extracts complete typography information
- **Variable Resolution**: Processes color variables with proper mode mapping

### Color Format Conversion
- **RGB to HEX**: Accurate conversion with alpha channel support
- **Gradient Parsing**: Regex-based color extraction and reformatting
- **Format Preservation**: Maintains original format for unsupported types

### User Interface
- **Accordion Design**: Collapsible sections for better space utilization
- **Figma Theme Integration**: Uses Figma's native color tokens
- **Responsive Layout**: Adapts to different plugin window sizes
- **Accessibility**: Proper focus management and keyboard shortcuts

## Plugin Configuration

### Manifest Details
- **API Version**: Uses modern Figma Plugin API
- **Permissions**: Read access to local styles and variables
- **UI Dimensions**: 500x600px with theme color support

### File Structure
- `manifest.json`: Plugin configuration and metadata
- `code.ts`: Main plugin logic and Figma API integration
- `ui.html`: User interface with embedded CSS and JavaScript

## Development Notes

### Local Styles Only
The plugin focuses exclusively on local styles within the current Figma file, ensuring fast performance and avoiding external dependencies.

### Variable Mode Support
Color variables are processed with full mode awareness, generating separate entries for each mode with readable collection/mode names.

### Performance Optimization
- Async processing prevents UI blocking
- Efficient data structures for large style collections
- Minimal API calls with proper error boundaries

## Requirements

- Figma Desktop App or Browser Version
- File with local styles, text styles, or color variables
- No external dependencies or authentication required

## Version Compatibility

Compatible with current Figma Plugin API. The plugin uses modern async methods and gracefully handles API availability checks.
