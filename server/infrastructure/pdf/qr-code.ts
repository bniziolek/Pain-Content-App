/**
 * Architecture: Infrastructure layer. QR code generation utility for PDFs.
 */

import QRCode from 'qrcode';

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export async function generateQRCodeDataUrl(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions = {
    width: 200,
    margin: 1,
    color: {
      dark: '#0F766E',
      light: '#ffffff',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    color: {
      ...defaultOptions.color,
      ...options.color,
    },
  };

  return QRCode.toDataURL(data, {
    width: mergedOptions.width,
    margin: mergedOptions.margin,
    color: mergedOptions.color,
  });
}

export function buildLookupUrl(code: string, baseUrl?: string): string {
  const base = baseUrl || getBaseUrl();
  return `${base}/lookup?code=${encodeURIComponent(code)}`;
}

export function getBaseUrl(): string {
  return process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'https://driverpath.com';
}
