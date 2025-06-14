import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ConceptNode } from '../types';

/**
 * Custom React Flow node component for rendering concept nodes
 */
const ConceptNodeComponent: React.FC<NodeProps> = ({ 
  data, 
  selected 
}) => {
  // Type assertion for our custom data
  const conceptData = data as ConceptNode & { label: string };
  
  const {
    title,
    conceptType,
    difficulty,
    keywords,
    explanation,
  } = conceptData;

  // Get concept type icon
  const getConceptTypeIcon = (type?: string) => {
    switch (type) {
      case 'Field': return '🏛️';
      case 'Theory': return '💡';
      case 'Algorithm': return '⚙️';
      case 'Tool': return '🔧';
      case 'Person': return '👤';
      default: return '📝';
    }
  };

  // Get difficulty color
  const getDifficultyColor = (diff?: string) => {
    switch (diff) {
      case 'Beginner': return '#4ade80';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div 
      className={`concept-node-wrapper ${selected ? 'selected' : ''}`}
      style={{
        minWidth: '180px',
        maxWidth: '250px',
        background: 'white',
        border: `2px solid ${selected ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: '12px',
        boxShadow: selected 
          ? '0 10px 25px rgba(59, 130, 246, 0.3)' 
          : '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header with concept type and difficulty */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: selected ? '#eff6ff' : '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>
            {getConceptTypeIcon(conceptType)}
          </span>
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: '500',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {conceptType || 'Concept'}
          </span>
        </div>
        
        {difficulty && (
          <div
            style={{
              fontSize: '10px',
              fontWeight: '600',
              color: 'white',
              background: getDifficultyColor(difficulty),
              padding: '2px 6px',
              borderRadius: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            }}
          >
            {difficulty}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ padding: '12px' }}>
        {/* Title */}
        <h3 
          style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#1f2937',
            lineHeight: '1.3',
            wordBreak: 'break-word',
          }}
        >
          {title}
        </h3>

        {/* Explanation preview */}
        {explanation && (
          <p 
            style={{
              margin: '0 0 8px 0',
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {explanation}
          </p>
        )}

        {/* Keywords */}
        {keywords && keywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
            {keywords.slice(0, 3).map((keyword: string, index: number) => (
              <span
                key={index}
                style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: '#4b5563',
                  background: '#f3f4f6',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                }}
              >
                {keyword}
              </span>
            ))}
            {keywords.length > 3 && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: '#9ca3af',
                  background: '#f9fafb',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                }}
              >
                +{keywords.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#6b7280',
          border: '2px solid white',
          width: '8px',
          height: '8px',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#6b7280',
          border: '2px solid white',
          width: '8px',
          height: '8px',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#6b7280',
          border: '2px solid white',
          width: '8px',
          height: '8px',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#6b7280',
          border: '2px solid white',
          width: '8px',
          height: '8px',
        }}
      />
    </div>
  );
};

export default ConceptNodeComponent; 