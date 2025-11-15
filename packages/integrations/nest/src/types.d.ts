// Type declarations for JavaScript packages

declare module '@toon-middleware/core' {
  export function detectClient(data: any, options?: any): any;
  export function convertToTOON(data: any): { success: boolean; data?: string; error?: string };
  export function convertFromTOON(data: string): { success: boolean; data?: any; error?: string };
  export function calculateSavings(original: string, converted: string, options?: any): any;
}

declare module '@toon-middleware/utils' {
  export const DEFAULT_CONFIG: any;
  export function generateRequestId(): string;
  export function measureDuration(startTime: bigint): number;
  export function toBigIntTime(): bigint;
  export function isJsonSerializable(data: any): boolean;
  export function isLLMConfidenceHigh(clientInfo: any, threshold: number): boolean;
  export function isConvertiblePayload(data: any): boolean;
  export function wantsToonResponse(headers: any): boolean;
}

declare module '@toon-middleware/cache' {
  export class CacheManager {
    constructor(options?: any);
    get(key: string): any;
    set(key: string, value: any): void;
    generateKey(request: any, data: any): string;
    hashData(data: any): string;
  }
}

declare module '@toon-middleware/logger' {
  export const logger: {
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
  };
}
