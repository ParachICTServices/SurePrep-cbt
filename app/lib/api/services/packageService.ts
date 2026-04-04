import { apiClient } from '../apiClient';

export interface Package {
  id: string;
  name: string;
  credits: number;
  bonus: number;
  price: number;
  /** Gradient utility string (e.g. `from-emerald-600 to-emerald-700`) or a single CSS color (hex, rgb, hsl). */
  color?: string | null;
  /** Some APIs use British spelling; merged when reading card background. */
  colour?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePackageRequest {
  name: string;
  credits: number;
  bonus: number;
  price: number;
  color?: string | null;
}

export interface UpdatePackageRequest {
  name?: string;
  credits?: number;
  bonus?: number;
  price?: number;
  color?: string | null;
}

const FALLBACK_GRADIENT_BY_ID: Record<string, string> = {
  starter: 'from-emerald-600 to-emerald-700',
  basic: 'from-emerald-600 to-emerald-700',
  premium: 'from-blue-600 to-blue-700',
  ultimate: 'from-purple-600 to-purple-700',
  pro: 'from-amber-600 to-amber-700',
};

function fallbackGradientFromPackageId(packageId: string): string {
  const key = Object.keys(FALLBACK_GRADIENT_BY_ID).find((k) =>
    packageId.toLowerCase().includes(k)
  );
  return key ? FALLBACK_GRADIENT_BY_ID[key] : 'from-slate-600 to-slate-700';
}

/**
 * Background for package cards: uses `pkg.color` from the API when present
 * (Tailwind gradient utilities or a single CSS color), otherwise id-based fallback.
 */
export function getPackageCardBackground(pkg: Package): {
  className: string;
  style?: { backgroundImage: string };
} {
  const raw = (pkg.color ?? pkg.colour)?.trim();
  if (!raw || /[;{}]/.test(raw)) {
    return {
      className: `bg-gradient-to-br ${fallbackGradientFromPackageId(pkg.id)}`,
    };
  }

  if (raw.includes('from-') && raw.includes('to-')) {
    return { className: `bg-gradient-to-br ${raw}` };
  }

  const isHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(raw);
  const isRgb =
    /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(,\s*[\d.]*\s*)?\)$/i.test(raw.replace(/\s/g, ''));
  const isHsl = /^hsla?\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,\s*[\d.]*\s*)?\)$/i.test(
    raw.replace(/\s/g, '')
  );
  const isCssColor = isHex || isRgb || isHsl;

  if (isCssColor) {
    return {
      className: '',
      style: {
        backgroundImage: `linear-gradient(135deg, ${raw}, color-mix(in srgb, ${raw} 72%, black))`,
      },
    };
  }

  return {
    className: `bg-gradient-to-br ${fallbackGradientFromPackageId(pkg.id)}`,
  };
}

class PackageService {
  private readonly basePath = '/payments/packages/admin';
  private readonly userBasePath = '/payments/packages';

  // Admin methods
  async getAllPackages(): Promise<Package[]> {
    const response = await apiClient.get<any>(this.basePath);
    // Handle different response formats as seen in other admin services
    return Array.isArray(response) ? response : (response.data || response.results || []);
  }

  // User methods
  async getUserPackages(): Promise<Package[]> {
    const response = await apiClient.get<any>(this.userBasePath);
    // Handle different response formats as seen in other admin services
    return Array.isArray(response) ? response : (response.data || response.results || []);
  }

  async getPackageById(id: string): Promise<Package> {
    return await apiClient.get<Package>(`${this.basePath}/${id}`);
  }

  async createPackage(packageData: CreatePackageRequest): Promise<Package> {
    return await apiClient.post<Package>(this.basePath, packageData);
  }

  async updatePackage(id: string, packageData: UpdatePackageRequest): Promise<Package> {
    return await apiClient.patch<Package>(`${this.basePath}/${id}`, packageData);
  }

  async deletePackage(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }
}

export const packageService = new PackageService();