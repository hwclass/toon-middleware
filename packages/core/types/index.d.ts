export type ClientTypeValue = 'LLM' | 'regular';

export interface ConversionResult<T = unknown> {
  success: boolean;
  data: T | null;
  error?: string | null;
  originalSize?: number;
  convertedSize?: number;
  compressionRatio?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface SavingsBreakdown {
  tokens: number;
  percentage: number;
  cost: number;
  spaceEfficiency: number;
}

export interface PricingConfig {
  per1K: number;
  timestamp?: string;
}

export interface SavingsCalculation {
  original: {
    tokens: number;
    size: number;
  };
  converted: {
    tokens: number;
    size: number;
  };
  savings: SavingsBreakdown;
  metrics: {
    compressionRatio: number;
    tokensPerByte: {
      json: number;
      toon: number;
    };
  };
  pricing: PricingConfig;
  calculatedAt: string;
}

export interface TokenEstimationOptions {
  charsPerToken?: number;
  unicodeMultiplier?: number;
  jsonOverhead?: number;
}

export interface OptimizationOptions {
  trimStrings?: boolean;
  maxStringLength?: number;
  dedupeArrays?: boolean;
  sortKeys?: boolean;
  compactBooleans?: boolean;
}

export interface ClientDetectionOptions {
  confidenceThreshold?: number;
  clock?: () => string;
}

export interface ClientDetectionInput {
  headers?: Record<string, string>;
  userAgent?: string;
  customDetectors?: Array<(input: { headers: Record<string, string>; userAgent: string; options?: ClientDetectionOptions }) => { isLLM?: boolean; isRegular?: boolean; confidence?: number }>;
  confidenceThreshold?: number;
  clock?: () => string;
}

export interface ClientDetectionResult {
  type: ClientTypeValue;
  confidence: number;
  scores: {
    LLM: number;
    regular: number;
  };
  matchedPatterns: string[];
  detectedAt: string;
  source: string;
}

