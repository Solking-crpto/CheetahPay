/// <reference types="vite/client" />

declare module 'qrcode' {
  export interface QRCodeToStringOptions {
    type?: 'svg' | 'utf8';
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    width?: number;
  }
  export function toString(
    text: string,
    options?: QRCodeToStringOptions,
    callback?: (error: Error | null, string: string) => void
  ): Promise<string>;
  export function toDataURL(
    text: string,
    options?: unknown,
    callback?: (error: Error | null, url: string) => void
  ): Promise<string>;
}
