import React, { useCallback, useEffect, useRef } from 'react';
import { useGraphStore } from '../store/graphStore';
import type { ConceptNode, ConceptType } from '../types';

const ContextMenu: React.FC = () => {
  const { 
    contextMenu, 
    closeContextMenu, 
    addNode, 
    graphData
  } = useGraphStore();
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeContextMenu();
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu, closeContextMenu]);

  // Close on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeContextMenu();
      }
    };

    if (contextMenu) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [contextMenu, closeContextMenu]);

  const handleCreateNode = useCallback(async (conceptType: string) => {
    if (!contextMenu) return;

    console.log(`🎯 Creating new ${conceptType} node in ${contextMenu.mode} mode`);
    
    // Generate unique ID
    const existingIds = new Set(graphData.nodes.map(node => node.id));
    let nodeId = `node-${Date.now()}`;
    let counter = 1;
    while (existingIds.has(nodeId)) {
      nodeId = `node-${Date.now()}-${counter}`;
      counter++;
    }

    // Create the new node
    const newNode: ConceptNode = {
      id: nodeId,
      title: `New ${conceptType}`,
      explanation: `A new ${conceptType.toLowerCase()} concept created via context menu.`,
      keywords: [conceptType.toLowerCase(), 'new', 'concept'],
      conceptType: conceptType as ConceptType,
      position: {
        x: contextMenu.x - 100, // Offset from cursor
        y: contextMenu.y - 50,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      resources: [],
      expanded: false,
    };

    // Add context-specific information based on mode and nearby nodes
    if (contextMenu.nearbyNodeId) {
      const nearbyNode = graphData.nodes.find(n => n.id === contextMenu.nearbyNodeId);
      if (nearbyNode) {
        if (contextMenu.mode === 'exploration') {
          newNode.explanation = `A ${conceptType.toLowerCase()} concept related to ${nearbyNode.title}. Expand the connection web around this central idea.`;
        } else {
          newNode.explanation = `A ${conceptType.toLowerCase()} that builds upon or relates to ${nearbyNode.title} in the focused learning path.`;
        }
        newNode.keywords.push('related', nearbyNode.title.toLowerCase().replace(/\s+/g, '-'));
      }
    } else {
      if (contextMenu.mode === 'exploration') {
        newNode.explanation = `An isolated ${conceptType.toLowerCase()} concept ready to be connected in the exploration web.`;
      } else {
        newNode.explanation = `A ${conceptType.toLowerCase()} concept in the focused learning sequence.`;
      }
    }

    addNode(newNode);
    closeContextMenu();

    // TODO: In a real implementation, this would trigger LLM prompting
    // based on the mode and context to generate more sophisticated content
  }, [contextMenu, graphData.nodes, addNode, closeContextMenu]);

  if (!contextMenu) return null;

  const conceptTypes = ['Theory', 'Algorithm', 'Tool', 'Field', 'Person'];

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: contextMenu.x,
        top: contextMenu.y,
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        minWidth: '200px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
          Create New Concept
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
          {contextMenu.mode === 'exploration' ? 'Expand the knowledge web' : 'Add to learning path'}
          {contextMenu.nearbyNodeId && ' near selected node'}
        </div>
      </div>

      {/* Options */}
      <div style={{ padding: '8px 0' }}>
        {conceptTypes.map((type) => (
          <button
            key={type}
            onClick={() => handleCreateNode(type)}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ marginRight: '12px' }}>
              {type === 'Theory' && '💡'}
              {type === 'Algorithm' && '⚙️'}
              {type === 'Tool' && '🔧'}
              {type === 'Field' && '🏛️'}
              {type === 'Person' && '👤'}
            </span>
            <span>{type}</span>
          </button>
        ))}
      </div>

      {/* Cancel option */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '8px' }}>
        <button
          onClick={closeContextMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '8px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#6b7280',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ContextMenu; 