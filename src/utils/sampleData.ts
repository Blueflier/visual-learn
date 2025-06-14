import type { ConceptNode, ConceptEdge, ConceptGraph } from '../types';

export const sampleNodes: ConceptNode[] = [
  {
    id: '1',
    title: 'React',
    explanation: 'A JavaScript library for building user interfaces',
    keywords: ['JavaScript', 'UI', 'Library'],
    position: { x: 100, y: 100 },
    conceptType: 'Tool',
    createdAt: new Date(),
    updatedAt: new Date(),
    resources: ['https://react.dev/'],
  },
  {
    id: '2',
    title: 'Components',
    explanation: 'Reusable pieces of UI code that can have their own state.',
    keywords: ['UI', 'Composition'],
    position: { x: 300, y: 50 },
    conceptType: 'Theory',
    createdAt: new Date(),
    updatedAt: new Date(),
    resources: [],
  },
  {
    id: '3',
    title: 'State Management',
    explanation: 'The process of managing the state of an application. In React, this can be done with component state or with external libraries.',
    keywords: ['State', 'Data Flow'],
    position: { x: 300, y: 150 },
    conceptType: 'Theory',
    createdAt: new Date(),
    updatedAt: new Date(),
    resources: ['https://redux.js.org/', 'https://zustand-demo.pmnd.rs/'],
  },
  {
    id: '4',
    title: 'Hooks',
    explanation: 'Functions that let you "hook into" React state and lifecycle features from function components.',
    keywords: ['Functions', 'State', 'Lifecycle'],
    position: { x: 500, y: 100 },
    conceptType: 'Algorithm',
    createdAt: new Date(),
    updatedAt: new Date(),
    resources: ['https://react.dev/reference/react/hooks'],
  }
];

export const sampleEdges: ConceptEdge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    label: 'has'
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    label: 'involves'
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    label: 'can use'
  }
];

export const sampleGraphData: ConceptGraph = {
  nodes: sampleNodes,
  edges: sampleEdges
};

export const generateRandomNode = (id: string): ConceptNode => ({
  id,
  title: `Node ${id}`,
  explanation: `Description for node ${id}`,
  keywords: ['random', 'generated'],
  position: {
    x: Math.random() * 400 + 100,
    y: Math.random() * 400 + 100
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  resources: [],
}); 