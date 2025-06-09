import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface definitions for System Configuration API
export interface SystemConfiguration {
  configId: number;
  configKey: string;
  configValue: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSystemConfigRequest {
  configKey: string;
  configValue: string;
  description?: string;
}

export interface UpdateSystemConfigRequest {
  configKey: string;
  configValue: string;
  description?: string;
}

export interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

// Special configuration types
export interface RequiredDocumentsConfig {
  [key: string]: string; // Document type key -> Document name mapping
}

@Injectable({
  providedIn: 'root'
})
export class SystemConfigService {
  private apiUrl = `${environment.apiUrl}/system-configurations`;

  constructor(private http: HttpClient) { }

  /**
   * Get HTTP headers with authorization
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Create a new system configuration
   * @param config Configuration data to create
   * @returns Observable<ApiResponse<SystemConfiguration>>
   */
  createConfiguration(config: CreateSystemConfigRequest): Observable<ApiResponse<SystemConfiguration>> {
    return this.http.post<ApiResponse<SystemConfiguration>>(
      this.apiUrl,
      config,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all system configurations
   * @returns Observable<ApiResponse<SystemConfiguration[]>>
   */
  getAllConfigurations(): Observable<ApiResponse<SystemConfiguration[]>> {
    return this.http.get<ApiResponse<SystemConfiguration[]>>(
      this.apiUrl,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get system configuration by ID
   * @param configId Configuration ID
   * @returns Observable<ApiResponse<SystemConfiguration>>
   */
  getConfigurationById(configId: number): Observable<ApiResponse<SystemConfiguration>> {
    return this.http.get<ApiResponse<SystemConfiguration>>(
      `${this.apiUrl}/${configId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get system configuration by key
   * @param configKey Configuration key
   * @returns Observable<ApiResponse<SystemConfiguration>>
   */
  getConfigurationByKey(configKey: string): Observable<ApiResponse<SystemConfiguration>> {
    const encodedKey = encodeURIComponent(configKey);
    return this.http.get<ApiResponse<SystemConfiguration>>(
      `${this.apiUrl}/key/${encodedKey}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update system configuration
   * @param configId Configuration ID
   * @param config Updated configuration data
   * @returns Observable<ApiResponse<SystemConfiguration>>
   */
  updateConfiguration(configId: number, config: UpdateSystemConfigRequest): Observable<ApiResponse<SystemConfiguration>> {
    return this.http.put<ApiResponse<SystemConfiguration>>(
      `${this.apiUrl}/${configId}`,
      config,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete system configuration
   * @param configId Configuration ID
   * @returns Observable<ApiResponse<null>>
   */
  deleteConfiguration(configId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/${configId}`,
      { headers: this.getHeaders() }
    );
  }

  // Special helper methods for specific configurations

  /**
   * Get required documents configuration and parse JSON value
   * @returns Promise<RequiredDocumentsConfig>
   */
  async getRequiredDocuments(): Promise<RequiredDocumentsConfig> {
    try {
      const response = await this.getConfigurationByKey('required_documents').toPromise();
      if (response && response.code === 1000) {
        return JSON.parse(response.data.configValue);
      }
      throw new Error('Failed to fetch required documents configuration');
    } catch (error) {
      console.error('Error fetching required documents:', error);
      return {}; // Return empty object as fallback
    }
  }

  /**
   * Update required documents configuration
   * @param documentsMap Document type mapping
   * @returns Promise<boolean>
   */
  async updateRequiredDocuments(documentsMap: RequiredDocumentsConfig): Promise<boolean> {
    try {
      // First get the current configuration to get the ID
      const currentConfig = await this.getConfigurationByKey('required_documents').toPromise();
      if (currentConfig && currentConfig.code === 1000) {
        const updateRequest: UpdateSystemConfigRequest = {
          configKey: 'required_documents',
          configValue: JSON.stringify(documentsMap),
          description: 'Danh sách các loại tài liệu có thể yêu cầu cho đơn vay - Key-Value mapping của document types'
        };

        const response = await this.updateConfiguration(currentConfig.data.configId, updateRequest).toPromise();
        return response?.code === 1000;
      }
      return false;
    } catch (error) {
      console.error('Error updating required documents:', error);
      return false;
    }
  }

  /**
   * Get configuration value by key with fallback
   * @param configKey Configuration key
   * @param fallbackValue Fallback value if config not found
   * @returns Promise<string>
   */
  async getConfigValue(configKey: string, fallbackValue: string = ''): Promise<string> {
    try {
      const response = await this.getConfigurationByKey(configKey).toPromise();
      if (response && response.code === 1000) {
        return response.data.configValue;
      }
      return fallbackValue;
    } catch (error) {
      console.error(`Error fetching config ${configKey}:`, error);
      return fallbackValue;
    }
  }

  /**
   * Get configuration value as number
   * @param configKey Configuration key
   * @param fallbackValue Fallback number value
   * @returns Promise<number>
   */
  async getConfigValueAsNumber(configKey: string, fallbackValue: number = 0): Promise<number> {
    const value = await this.getConfigValue(configKey, fallbackValue.toString());
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallbackValue : parsed;
  }

  /**
   * Get configuration value as boolean
   * @param configKey Configuration key
   * @param fallbackValue Fallback boolean value
   * @returns Promise<boolean>
   */
  async getConfigValueAsBoolean(configKey: string, fallbackValue: boolean = false): Promise<boolean> {
    const value = await this.getConfigValue(configKey, fallbackValue.toString());
    return value.toLowerCase() === 'true';
  }

  /**
   * Set configuration value (update if exists, create if not)
   * @param configKey Configuration key
   * @param configValue Configuration value
   * @param description Optional description
   * @returns Promise<boolean>
   */
  async setConfigValue(configKey: string, configValue: string, description?: string): Promise<boolean> {
    try {
      // Try to get existing configuration
      const existingConfig = await this.getConfigurationByKey(configKey).toPromise();

      if (existingConfig && existingConfig.code === 1000) {
        // Update existing
        const updateRequest: UpdateSystemConfigRequest = {
          configKey,
          configValue,
          description: description || existingConfig.data.description
        };
        const response = await this.updateConfiguration(existingConfig.data.configId, updateRequest).toPromise();
        return response?.code === 1000;
      } else {
        // Create new
        const createRequest: CreateSystemConfigRequest = {
          configKey,
          configValue,
          description
        };
        const response = await this.createConfiguration(createRequest).toPromise();
        return response?.code === 1000;
      }
    } catch (error) {
      console.error(`Error setting config ${configKey}:`, error);
      return false;
    }
  }

  /**
   * Generate options array for document type dropdowns
   * @param documentsMap Document type mapping
   * @returns Array of option objects
   */
  generateDocumentTypeOptions(documentsMap: RequiredDocumentsConfig): { value: string; label: string }[] {
    return Object.entries(documentsMap).map(([key, value]) => ({
      value: key,
      label: value
    }));
  }

  /**
   * Group documents by category for better organization
   * @param documentsMap Document type mapping
   * @returns Grouped documents by category
   */
  groupDocumentsByCategory(documentsMap: RequiredDocumentsConfig): { [category: string]: { value: string; label: string }[] } {
    const categories: { [category: string]: { value: string; label: string }[] } = {
      'Tài liệu cá nhân': [],
      'Tài liệu tài chính': [],
      'Tài liệu bảo đảm': [],
      'Tài liệu khác': []
    };

    Object.entries(documentsMap).forEach(([key, value]) => {
      const option = { value: key, label: value };

      // Categorize based on document type key
      if (key.includes('ID_') || key.includes('HOUSEHOLD_') || key.includes('MARRIAGE_')) {
        categories['Tài liệu cá nhân'].push(option);
      } else if (key.includes('INCOME_') || key.includes('BANK_') || key.includes('TAX_')) {
        categories['Tài liệu tài chính'].push(option);
      } else if (key.includes('COLLATERAL_') || key.includes('PROPERTY_') || key.includes('VEHICLE_')) {
        categories['Tài liệu bảo đảm'].push(option);
      } else {
        categories['Tài liệu khác'].push(option);
      }
    });

    return categories;
  }

  /**
   * Validate configuration key format
   * @param configKey Configuration key to validate
   * @returns boolean
   */
  validateConfigKey(configKey: string): boolean {
    // Key should be max 100 characters and follow naming convention
    if (!configKey || configKey.length > 100) {
      return false;
    }

    // Check for valid characters (letters, numbers, dots, underscores, hyphens)
    const validKeyPattern = /^[a-zA-Z][a-zA-Z0-9._-]*$/;
    return validKeyPattern.test(configKey);
  }

  /**
   * Get all configurations grouped by prefix
   * @returns Promise<{[prefix: string]: SystemConfiguration[]}>
   */
  async getConfigurationsByPrefix(): Promise<{ [prefix: string]: SystemConfiguration[] }> {
    try {
      const response = await this.getAllConfigurations().toPromise();
      if (response && response.code === 1000) {
        const grouped: { [prefix: string]: SystemConfiguration[] } = {};

        response.data.forEach(config => {
          const prefix = config.configKey.split('.')[0];
          if (!grouped[prefix]) {
            grouped[prefix] = [];
          }
          grouped[prefix].push(config);
        });

        return grouped;
      }
      return {};
    } catch (error) {
      console.error('Error fetching configurations by prefix:', error);
      return {};
    }
  }
}
