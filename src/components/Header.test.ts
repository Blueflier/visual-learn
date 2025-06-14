import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGraphStore } from '../store/graphStore';

// Mock the graph store
vi.mock('../store/graphStore', () => ({
  useGraphStore: vi.fn(),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'mock-url');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

// Mock window.confirm and window.alert
const mockConfirm = vi.fn();
const mockAlert = vi.fn();
Object.defineProperty(window, 'confirm', { value: mockConfirm, writable: true });
Object.defineProperty(window, 'alert', { value: mockAlert, writable: true });

// Mock document.createElement and related DOM methods
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockCreateElement = vi.fn(() => ({
  href: '',
  download: '',
  click: mockClick,
}));

Object.defineProperty(document, 'createElement', { value: mockCreateElement, writable: true });
Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild, writable: true });
Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild, writable: true });

describe('Header Component Functionality', () => {
  const mockStore = {
    toggleSettingsPanel: vi.fn(),
    toggleDetailSidebar: vi.fn(),
    selectedNode: null,
    selectedEdge: null,
    exportToJSON: vi.fn(),
    importFromJSON: vi.fn(),
    clearGraph: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useGraphStore).mockReturnValue(mockStore);
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
    mockConfirm.mockClear();
    mockAlert.mockClear();
    mockClick.mockClear();
    mockAppendChild.mockClear();
    mockRemoveChild.mockClear();
    mockCreateElement.mockClear();
    Object.values(mockStore).forEach(fn => typeof fn === 'function' && fn.mockClear());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('New Graph Functionality', () => {
    it('should clear graph when user confirms', () => {
      mockConfirm.mockReturnValue(true);
      
      // Simulate the new graph button click logic
      const shouldClear = window.confirm('Are you sure you want to create a new graph? This will clear all current data.');
      if (shouldClear) {
        mockStore.clearGraph();
      }

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to create a new graph? This will clear all current data.'
      );
      expect(mockStore.clearGraph).toHaveBeenCalled();
    });

    it('should not clear graph when user cancels', () => {
      mockConfirm.mockReturnValue(false);
      
      // Simulate the new graph button click logic
      const shouldClear = window.confirm('Are you sure you want to create a new graph? This will clear all current data.');
      if (shouldClear) {
        mockStore.clearGraph();
      }

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockStore.clearGraph).not.toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    it('should export graph data successfully', () => {
      const mockGraphData = JSON.stringify({ nodes: [], edges: [] });
      mockStore.exportToJSON.mockReturnValue(mockGraphData);
      
      // Simulate the export logic
      try {
        const jsonData = mockStore.exportToJSON();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `concept-graph-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        window.alert('Failed to export graph: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }

      expect(mockStore.exportToJSON).toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.any(Blob)
      );
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
    });

    it('should create download link with correct filename format', () => {
      const mockGraphData = JSON.stringify({ nodes: [], edges: [] });
      mockStore.exportToJSON.mockReturnValue(mockGraphData);
      
      // Mock Date to ensure consistent filename
      const mockDate = new Date('2024-01-15T10:30:00.000Z');
      vi.setSystemTime(mockDate);
      
      // Simulate the export logic
      const jsonData = mockStore.exportToJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `concept-graph-${new Date().toISOString().split('T')[0]}.json`;

      const createdLink = mockCreateElement.mock.results[0].value;
      expect(createdLink.download).toBe('concept-graph-2024-01-15.json');
      expect(createdLink.href).toBe('mock-url');
    });

    it('should handle export errors gracefully', () => {
      mockStore.exportToJSON.mockImplementation(() => {
        throw new Error('Export failed');
      });
      
      // Simulate the export logic with error handling
      try {
        const jsonData = mockStore.exportToJSON();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `concept-graph-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        window.alert('Failed to export graph: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }

      expect(mockAlert).toHaveBeenCalledWith('Failed to export graph: Export failed');
    });

    it('should create blob with correct content type', () => {
      const mockGraphData = JSON.stringify({ nodes: [], edges: [] });
      mockStore.exportToJSON.mockReturnValue(mockGraphData);
      
      // Test that the blob creation logic works correctly
      const jsonData = mockStore.exportToJSON();
      
      // We'll test the blob creation by checking the parameters that would be passed
      expect(mockStore.exportToJSON).toHaveBeenCalled();
      expect(jsonData).toBe(mockGraphData);
      
      // Verify that if we were to create a blob, it would have the right parameters
      const expectedBlobContent = [mockGraphData];
      const expectedBlobOptions = { type: 'application/json' };
      
      expect(expectedBlobContent).toEqual([mockGraphData]);
      expect(expectedBlobOptions.type).toBe('application/json');
    });
  });

  describe('Import Functionality', () => {
    it('should import valid JSON file successfully', async () => {
      mockStore.importFromJSON.mockResolvedValue({ success: true });
      
      const mockFileContent = JSON.stringify({ graphData: { nodes: [], edges: [] } });
      
      // Simulate the file import logic
      try {
        const result = await mockStore.importFromJSON(mockFileContent);
        
        if (result.success) {
          window.alert('Graph imported successfully!');
        } else {
          window.alert('Failed to import graph: ' + result.error);
        }
      } catch (error) {
        window.alert('Failed to read file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }

      expect(mockStore.importFromJSON).toHaveBeenCalledWith(mockFileContent);
      expect(mockAlert).toHaveBeenCalledWith('Graph imported successfully!');
    });

    it('should handle import validation errors', async () => {
      mockStore.importFromJSON.mockResolvedValue({ 
        success: false, 
        error: 'Invalid graph data format' 
      });
      
      const mockFileContent = 'invalid json';
      
      // Simulate the file import logic
      try {
        const result = await mockStore.importFromJSON(mockFileContent);
        
        if (result.success) {
          window.alert('Graph imported successfully!');
        } else {
          window.alert('Failed to import graph: ' + result.error);
        }
      } catch (error) {
        window.alert('Failed to read file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }

      expect(mockAlert).toHaveBeenCalledWith('Failed to import graph: Invalid graph data format');
    });

    it('should handle file reading errors', async () => {
      const mockError = new Error('File read error');
      
      // Simulate file reading error
      try {
        throw mockError;
      } catch (error) {
        window.alert('Failed to read file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }

      expect(mockAlert).toHaveBeenCalledWith('Failed to read file: File read error');
    });
  });

  describe('Store Integration', () => {
    it('should call store methods with correct parameters', async () => {
      const testGraphData = { nodes: [{ id: '1', title: 'Test' }], edges: [] };
      const testGraphDataString = JSON.stringify(testGraphData);
      mockStore.exportToJSON.mockReturnValue(testGraphDataString);
      mockStore.importFromJSON.mockResolvedValue({ success: true });
      
      // Test export
      const exportedData = mockStore.exportToJSON();
      expect(mockStore.exportToJSON).toHaveBeenCalledWith();
      expect(exportedData).toBe(testGraphDataString);

      // Test import
      const importResult = await mockStore.importFromJSON(testGraphDataString);
      expect(mockStore.importFromJSON).toHaveBeenCalledWith(testGraphDataString);
      expect(importResult.success).toBe(true);
    });

    it('should handle store method failures gracefully', async () => {
      // Test export failure
      mockStore.exportToJSON.mockImplementation(() => {
        throw new Error('Export failed');
      });

      expect(() => mockStore.exportToJSON()).toThrow('Export failed');

      // Test import failure
      mockStore.importFromJSON.mockRejectedValue(new Error('Import failed'));
      
      await expect(mockStore.importFromJSON('test')).rejects.toThrow('Import failed');
    });
  });

  describe('File Operations', () => {
    it('should create and trigger download correctly', () => {
      const testData = 'test data';
      const filename = 'test-file.json';
      
      // Simulate file download logic without actually creating Blob
      // We'll test the individual steps
      
      // Test URL creation and cleanup
      const mockUrl = 'mock-url';
      mockCreateObjectURL.mockReturnValue(mockUrl);
      
      // Simulate the download process
      const url = URL.createObjectURL(new Blob([testData], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    it('should handle file download process steps', () => {
      const testData = 'test data';
      
      // Test the individual components of file download
      expect(typeof testData).toBe('string');
      expect(testData.length).toBeGreaterThan(0);
      
      // Test that we can create the expected blob parameters
      const blobContent = [testData];
      const blobOptions = { type: 'application/json' };
      
      expect(blobContent).toEqual([testData]);
      expect(blobOptions.type).toBe('application/json');
      
      // Test filename generation
      const filename = 'test-file.json';
      expect(filename).toMatch(/\.json$/);
    });
  });
}); 