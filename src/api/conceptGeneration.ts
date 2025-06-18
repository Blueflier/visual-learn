import type { ConceptNode, ConceptEdge, ConceptType } from '../types';
import { defaultLLMManager } from './llm';

/**
 * Configuration for concept generation
 */
export interface ConceptGenerationConfig {
  /** Maximum number of concepts to generate */
  maxConcepts?: number;
  /** Focus topic for generation */
  focusTopic: string;
  /** Context from existing nodes to avoid duplicates */
  existingConcepts?: string[];
  /** Mode of generation */
  mode: 'learning' | 'brainstorming';
  /** Depth level for sub-concepts */
  depth?: 'core' | 'detailed' | 'comprehensive';
}

/**
 * Response from LLM for concept generation
 */
export interface GeneratedConceptResponse {
  concepts: GeneratedConcept[];
  topic: string;
  mode: string;
}

/**
 * A single generated concept
 */
export interface GeneratedConcept {
  title: string;
  explanation: string;
  keywords: string[];
  conceptType: ConceptType;
  relationships: string[];
  importance: number; // 0-1 scale for layout prioritization
}

/**
 * Raw concept data from LLM response (before validation)
 */
interface RawConceptData {
  title?: unknown;
  explanation?: unknown;
  keywords?: unknown;
  conceptType?: unknown;
  relationships?: unknown;
  importance?: unknown;
  [key: string]: unknown;
}

/**
 * Service for LLM-powered concept generation and expansion
 */
export class ConceptGenerationService {
  private llmManager = defaultLLMManager;

  /**
   * Generate related concepts for intelligent radial layout
   */
  async generateRelatedConcepts(config: ConceptGenerationConfig): Promise<GeneratedConceptResponse> {
    const prompt = this.buildConceptGenerationPrompt(config);
    
    try {
      const response = await this.llmManager.generateContent(prompt, {
        maxTokens: 2000,
        temperature: 0.7,
        systemPrompt: this.getSystemPrompt(config.mode),
      });

      return this.parseConceptResponse(response.content, config);
    } catch (error) {
      console.error('Failed to generate concepts:', error);
      throw new Error('Concept generation failed. Please check your LLM configuration.');
    }
  }

  /**
   * Generate sub-concepts for expansion when user clicks expand
   */
  async expandConcept(
    parentConcept: ConceptNode, 
    existingConcepts: ConceptNode[],
    mode: 'learning' | 'brainstorming' = 'learning',
    maxConcepts: number = 5
  ): Promise<GeneratedConceptResponse> {
    const config: ConceptGenerationConfig = {
      focusTopic: parentConcept.title,
      existingConcepts: existingConcepts.map(c => c.title),
      maxConcepts,
      mode,
      depth: 'detailed'
    };

    const prompt = this.buildExpansionPrompt(parentConcept, config);
    
    try {
      const response = await this.llmManager.generateContent(prompt, {
        maxTokens: 1500,
        temperature: 0.6,
        systemPrompt: this.getSystemPrompt(mode),
      });

      return this.parseConceptResponse(response.content, config);
    } catch (error) {
      console.error('Failed to expand concept:', error);
      throw new Error('Concept expansion failed. Please check your LLM configuration.');
    }
  }

  /**
   * Build the main concept generation prompt
   */
  private buildConceptGenerationPrompt(config: ConceptGenerationConfig): string {
    const { focusTopic, mode, maxConcepts = 8, existingConcepts = [] } = config;
    
    const basePrompt = mode === 'learning' 
      ? this.buildLearningPrompt(focusTopic, maxConcepts)
      : this.buildBrainstormingPrompt(focusTopic, maxConcepts);

    const existingConceptsText = existingConcepts.length > 0 
      ? `\n\nEXISTING CONCEPTS TO AVOID DUPLICATING:\n${existingConcepts.join(', ')}`
      : '';

    return basePrompt + existingConceptsText + this.getOutputFormatInstructions();
  }

  /**
   * Build learning-focused prompt for educational concept mapping
   */
  private buildLearningPrompt(topic: string, maxConcepts: number): string {
    return `Generate ${maxConcepts} key concepts that someone learning about "${topic}" should understand. 

Focus on creating a comprehensive learning path with:
1. Fundamental concepts (Field, Theory) that are essential prerequisites
2. Core algorithms and methods they need to learn
3. Important tools and technologies in this domain
4. Key figures who shaped this field

For "${topic}", think about what concepts would be most directly related and important for building understanding. Prioritize concepts by their importance to learning the topic (1.0 = absolutely essential, 0.7 = very important, 0.5 = useful to know).`;
  }

  /**
   * Build brainstorming-focused prompt for problem solving
   */
  private buildBrainstormingPrompt(topic: string, maxConcepts: number): string {
    return `Generate ${maxConcepts} key concepts for brainstorming solutions to: "${topic}"

Think about this as a problem-solving session. Include:
1. Root causes and contributing factors (Theory, Field)
2. Potential solution approaches and methods (Algorithm, Theory) 
3. Tools, technologies, and resources that could help (Tool)
4. Experts or stakeholders who should be involved (Person)
5. Related domains that might provide insights (Field)

For "${topic}", prioritize concepts by their directness to solving the problem (1.0 = direct solutions, 0.8 = enabling factors, 0.6 = supporting elements, 0.4 = related considerations).`;
  }

  /**
   * Build expansion prompt for sub-concepts
   */
  private buildExpansionPrompt(parentConcept: ConceptNode, config: ConceptGenerationConfig): string {
    const { maxConcepts = 5, mode } = config;
    
    const contextText = mode === 'learning' 
      ? `expanding learning about "${parentConcept.title}"`
      : `exploring solutions related to "${parentConcept.title}"`;

    return `Generate ${maxConcepts} sub-concepts for ${contextText}.

PARENT CONCEPT:
Title: ${parentConcept.title}
Type: ${parentConcept.conceptType || 'Theory'}
Explanation: ${parentConcept.explanation}
Keywords: ${parentConcept.keywords.join(', ')}

Generate concepts that dive deeper into this topic. Include specific subtopics, methods, applications, or components that fall under this parent concept.${this.getOutputFormatInstructions()}`;
  }

  /**
   * Get system prompt based on mode
   */
  private getSystemPrompt(mode: 'learning' | 'brainstorming'): string {
    if (mode === 'learning') {
      return `You are an expert educator creating concept maps for learning. Focus on pedagogical relationships and learning prerequisites. Ensure concepts build upon each other logically.`;
    } else {
      return `You are a creative problem-solving facilitator. Think broadly about solutions, root causes, stakeholders, and innovative approaches. Consider cross-disciplinary perspectives.`;
    }
  }

  /**
   * Get output format instructions
   */
  private getOutputFormatInstructions(): string {
    return `

RESPOND WITH VALID JSON ONLY:
{
  "concepts": [
    {
      "title": "Concept Name",
      "explanation": "Clear, concise explanation suitable for the target audience",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "conceptType": "Field|Theory|Algorithm|Tool|Person",
      "relationships": ["how it relates to the main topic"],
      "importance": 0.8
    }
  ]
}

REQUIREMENTS:
- Each concept must have 2-4 relevant keywords
- Explanations should be 1-2 sentences, clear and accessible
- ConceptType must be exactly one of: Field, Theory, Algorithm, Tool, Person
- Importance score from 0.1 to 1.0 (higher = more central to topic)
- Relationships should describe connection to main topic
- Avoid duplicating the provided existing concepts
- Ensure JSON is valid and parseable`;
  }

  /**
   * Parse LLM response into structured concepts
   */
  private parseConceptResponse(content: string, config: ConceptGenerationConfig): GeneratedConceptResponse {
    try {
      // Extract JSON from response (handle cases where LLM adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.concepts || !Array.isArray(parsed.concepts)) {
        throw new Error('Invalid response format: missing concepts array');
      }

      // Validate and clean up each concept
      const concepts: GeneratedConcept[] = parsed.concepts
        .map((concept: RawConceptData) => this.validateAndCleanConcept(concept))
        .filter((concept: GeneratedConcept | null) => concept !== null) as GeneratedConcept[];

      return {
        concepts,
        topic: config.focusTopic,
        mode: config.mode
      };
    } catch (error) {
      console.error('Failed to parse concept response:', error);
      throw new Error('Failed to parse LLM response. Please try again.');
    }
  }

  /**
   * Validate and clean up a single concept
   */
  private validateAndCleanConcept(concept: RawConceptData): GeneratedConcept | null {
    if (!concept || typeof concept !== 'object') return null;
    
    // Required fields
    if (!concept.title || typeof concept.title !== 'string') return null;
    if (!concept.explanation || typeof concept.explanation !== 'string') return null;
    
    // Validate concept type
    const validTypes: ConceptType[] = ['Field', 'Theory', 'Algorithm', 'Tool', 'Person'];
    const conceptType: ConceptType = validTypes.includes(concept.conceptType as ConceptType) 
      ? concept.conceptType as ConceptType
      : 'Theory'; // Default fallback

    // Clean up arrays
    const keywords = Array.isArray(concept.keywords) 
      ? concept.keywords.filter((k: unknown) => typeof k === 'string' && k.trim().length > 0)
      : [];
    
    const relationships = Array.isArray(concept.relationships)
      ? concept.relationships.filter((r: unknown) => typeof r === 'string' && r.trim().length > 0)
      : [];

    // Validate importance score
    const importance = typeof concept.importance === 'number' 
      ? Math.max(0.1, Math.min(1.0, concept.importance))
      : 0.5;

    return {
      title: concept.title.trim(),
      explanation: concept.explanation.trim(),
      keywords: keywords.slice(0, 6), // Limit to 6 keywords max
      conceptType,
      relationships: relationships.slice(0, 3), // Limit to 3 relationships max
      importance
    };
  }

  /**
   * Convert generated concepts to ConceptNode format
   */
  public convertToConceptNodes(
    generated: GeneratedConceptResponse, 
    startingId: number = 1,
    centerPosition: { x: number; y: number } = { x: 400, y: 300 }
  ): ConceptNode[] {
    return generated.concepts.map((concept, index) => ({
      id: `generated-${startingId + index}`,
      title: concept.title,
      explanation: concept.explanation,
      keywords: concept.keywords,
      conceptType: concept.conceptType,
      position: {
        x: centerPosition.x + (Math.random() - 0.5) * 200,
        y: centerPosition.y + (Math.random() - 0.5) * 200,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      resources: [],
    }));
  }

  /**
   * Generate connection edges between concepts based on relationships
   */
  public generateConceptEdges(
    concepts: ConceptNode[],
    rootConceptId: string
  ): ConceptEdge[] {
    const edges: ConceptEdge[] = [];
    
    concepts.forEach(concept => {
      if (concept.id !== rootConceptId) {
        // Connect each concept to the root
        edges.push({
          id: `edge-${rootConceptId}-${concept.id}`,
          source: rootConceptId,
          target: concept.id,
          label: 'related to'
        });
      }
    });

    return edges;
  }
}

// Default instance
export const conceptGenerationService = new ConceptGenerationService(); 