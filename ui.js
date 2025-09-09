// Simple Vanilla JS for Figma Plugin UI
console.log('UI script loading...');

let currentStyles = [];
let currentCSV = '';

// Filter state
let filters = {
  colors: true,
  typography: true,
  variables: true
};

// Track initialization
let initialized = false;

// Initialize when DOM loads or immediately if already loaded
function initializeUI() {
  if (initialized) {
    console.log('UI already initialized, skipping');
    return;
  }
  
  console.log('Initializing UI...');
  console.log('Document ready state:', document.readyState);
  
  try {
    setupEventListeners();
    loadStyles();
    initialized = true;
    console.log('UI initialization complete');
  } catch (error) {
    console.error('Error during UI initialization:', error);
  }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  console.log('DOM is loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  console.log('DOM already loaded, initializing immediately');
  initializeUI();
}

function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Check if required elements exist
  const loadingElement = document.getElementById('loading');
  const mainContent = document.getElementById('main-content');
  const csvOutput = document.getElementById('csv-output');
  
  console.log('Elements found:', {
    loading: !!loadingElement,
    mainContent: !!mainContent,
    csvOutput: !!csvOutput
  });
  
  // Filter checkboxes
  const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
  console.log('Filter checkboxes found:', filterCheckboxes.length);
  
  filterCheckboxes.forEach((checkbox, index) => {
    console.log(`Setting up listener for checkbox ${index}:`, checkbox.dataset.filter);
    
    checkbox.addEventListener('click', function() {
      console.log('Filter checkbox clicked:', this.dataset.filter);
      
      const filterType = this.dataset.filter;
      const input = this.querySelector('input');
      
      // Toggle state
      filters[filterType] = !filters[filterType];
      input.checked = filters[filterType];
      
      // Update visual state
      this.classList.toggle('active', filters[filterType]);
      
      console.log('Filter updated:', filterType, '=', filters[filterType]);
      
      // Update CSV
      updateCSV();
    });
  });
  
  console.log('Event listeners setup complete');
}

function loadStyles() {
  console.log('Loading styles...');
  showLoading(true);
  
  // Add timeout fallback to prevent infinite loading
  const loadingTimeout = setTimeout(() => {
    console.log('Loading timeout reached, falling back to mock data');
    fallbackToMockData();
  }, 3000);
  
  // Store timeout so we can clear it later
  window.currentLoadingTimeout = loadingTimeout;
  
  // Check if we're in plugin environment
  if (typeof window !== 'undefined' && window.parent && window.parent.postMessage) {
    console.log('In plugin environment, requesting styles');
    try {
      window.parent.postMessage({ pluginMessage: { type: 'get-styles' } }, '*');
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message to plugin:', error);
      clearTimeout(loadingTimeout);
      fallbackToMockData();
    }
  } else {
    console.log('Not in plugin environment, using mock data');
    clearTimeout(loadingTimeout);
    fallbackToMockData();
  }
}

function fallbackToMockData() {
  // Mock data for development/demo
  const mockStyles = [
    {
      id: '1',
      name: 'Primary/Blue/500',
      type: 'FILL',
      description: 'Primary brand color',
      value: 'rgb(59, 130, 246)',
      source: 'LOCAL'
    },
    {
      id: '2',
      name: 'Gray/Neutral/600',
      type: 'FILL', 
      description: 'Secondary text color',
      value: 'rgb(75, 85, 99)',
      source: 'LOCAL'
    },
    {
      id: '6',
      name: 'Heading/Large',
      type: 'TEXT',
      description: 'Main page headings',
      value: 'Inter, 32px, Bold, 120%',
      source: 'LOCAL'
    },
    {
      id: '7',
      name: 'Body/Regular',
      type: 'TEXT',
      description: 'Main body text',
      value: 'Inter, 16px, Regular, 150%',
      source: 'LOCAL'
    },
    {
      id: '11',
      name: 'Spacing/Base',
      type: 'VARIABLE',
      description: 'Base spacing unit',
      value: '8px',
      source: 'LOCAL'
    }
  ];
  
  setTimeout(() => {
    handleStylesData(mockStyles);
    showNotification('Using demo data - plugin not connected', 'success');
  }, 1000);
}

function handleStylesData(styles, csvData = null) {
  console.log('handleStylesData called with:', styles?.length || 0, 'styles');
  
  // Clear any pending timeout
  if (window.currentLoadingTimeout) {
    clearTimeout(window.currentLoadingTimeout);
    window.currentLoadingTimeout = null;
  }
  
  currentStyles = styles || [];
  console.log('Setting currentStyles to:', currentStyles.length, 'items');
  
  showLoading(false);
  
  if (currentStyles.length > 0) {
    console.log('Updating stats and CSV for', currentStyles.length, 'styles');
    updateStats();
    updateCSV();
    showNotification(`Loaded ${currentStyles.length} styles successfully`, 'success');
  } else {
    console.log('No styles found, updating with empty data');
    updateStats();
    updateCSV();
  }
}

function updateStats() {
  const filteredStyles = getFilteredStyles();
  
  const colorStyles = filteredStyles.filter(s => s.type === 'FILL').length;
  const textStyles = filteredStyles.filter(s => s.type === 'TEXT').length;
  const variableStyles = filteredStyles.filter(s => s.type === 'VARIABLE').length;
  
  document.getElementById('colors-count').textContent = colorStyles;
  document.getElementById('text-count').textContent = textStyles;
  document.getElementById('variables-count').textContent = variableStyles;
}

function getFilteredStyles() {
  return currentStyles.filter(style => {
    if (!filters.colors && style.type === 'FILL') return false;
    if (!filters.typography && style.type === 'TEXT') return false;
    if (!filters.variables && style.type === 'VARIABLE') return false;
    return true;
  });
}

function updateCSV() {
  const filteredStyles = getFilteredStyles();
  const csv = generateCSV(filteredStyles);
  
  currentCSV = csv;
  document.getElementById('csv-output').value = csv;
  
  const rowCount = csv.split('\n').length - 1; // Subtract header row
  document.getElementById('row-count').textContent = 
    rowCount > 0 ? `${rowCount} rows generated` : 'No data';
}

function generateCSV(styles) {
  const headers = ['ID', 'Name', 'Type', 'Description', 'Value', 'Source'];
  const rows = styles.map(style => [
    style.id,
    `"${style.name}"`,
    style.type,
    `"${style.description}"`,
    `"${style.value}"`,
    style.source
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function showLoading(show) {
  console.log('showLoading called with:', show);
  
  const loadingElement = document.getElementById('loading');
  const mainContentElement = document.getElementById('main-content');
  
  if (!loadingElement || !mainContentElement) {
    console.error('Required elements not found:', {
      loading: !!loadingElement,
      mainContent: !!mainContentElement
    });
    return;
  }
  
  console.log('Toggling loading state...');
  loadingElement.classList.toggle('hidden', !show);
  mainContentElement.classList.toggle('hidden', show);
  
  console.log('Loading state updated. Loading visible:', !loadingElement.classList.contains('hidden'));
}

function showNotification(message, type = 'success') {
  // Remove existing notification
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function refreshStyles() {
  loadStyles();
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(currentCSV);
    showNotification('CSV data copied to clipboard', 'success');
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = currentCSV;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showNotification('CSV data copied to clipboard', 'success');
    } catch (e) {
      showNotification('Failed to copy to clipboard', 'error');
    }
    document.body.removeChild(textArea);
  }
}

function downloadCSV() {
  const blob = new Blob([currentCSV], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'figma-styles.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showNotification('CSV file downloaded', 'success');
}

// Listen for messages from plugin code
window.addEventListener('message', function(event) {
  console.log('=== MESSAGE RECEIVED ===');
  console.log('Full event:', event);
  console.log('Event data:', event.data);
  console.log('Event origin:', event.origin);
  
  const data = event.data.pluginMessage || event.data;
  console.log('Extracted data:', data);
  
  if (!data || typeof data !== 'object') {
    console.log('Invalid or missing data, ignoring message');
    return;
  }
  
  const { type, styles, csvData, message } = data;
  console.log('Message type:', type);
  
  if (type === 'styles-data') {
    console.log('Processing styles-data message...');
    handleStylesData(styles, csvData);
  } else if (type === 'error') {
    console.log('Processing error message:', message);
    showLoading(false);
    showNotification(message || 'Error loading styles', 'error');
    fallbackToMockData();
  } else {
    console.log('Unknown message type:', type);
  }
});

console.log('Message listener added to window');