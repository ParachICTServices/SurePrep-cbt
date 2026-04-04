import { apiClient } from '../apiClient';

export interface Package {
  id: string;
  name: string;
  credits: number;
  bonus: number;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePackageRequest {
  name: string;
  credits: number;
  bonus: number;
  price: number;
}

export interface UpdatePackageRequest {
  name?: string;
  credits?: number;
  bonus?: number;
  price?: number;
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