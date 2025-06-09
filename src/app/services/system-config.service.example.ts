/**
 * EXAMPLE USAGE OF SYSTEM CONFIGURATION SERVICE
 * 
 * This file demonstrates how to use the SystemConfigService
 * in various scenarios within your Angular components.
 */

import { Component, OnInit } from '@angular/core';
import { SystemConfigService, SystemConfiguration, RequiredDocumentsConfig } from './system-config.service';

@Component({
    selector: 'app-config-example',
    template: `
    <div class="config-example">
      <h2>System Configuration Examples</h2>
      
      <!-- Document Type Dropdown Example -->
      <div class="form-group">
        <label>Document Type:</label>
        <select [(ngModel)]="selectedDocumentType">
          <option value="">Select document type...</option>
          <option *ngFor="let option of documentOptions" [value]="option.value">
            {{option.label}}
          </option>
        </select>
      </div>

      <!-- Grouped Document Types -->
      <div class="form-group">
        <label>Document Type (Grouped):</label>
        <select [(ngModel)]="selectedDocumentType">
          <option value="">Select document type...</option>
          <optgroup *ngFor="let group of groupedDocuments | keyvalue" [label]="group.key">
            <option *ngFor="let option of group.value" [value]="option.value">
              {{option.label}}
            </option>
          </optgroup>
        </select>
      </div>

      <!-- Configuration List -->
      <div class="config-list">
        <h3>All Configurations</h3>
        <div *ngFor="let config of configurations" class="config-item">
          <strong>{{config.configKey}}:</strong> {{config.configValue}}
          <small>{{config.description}}</small>
        </div>
      </div>
    </div>
  `
})
export class ConfigExampleComponent implements OnInit {
    configurations: SystemConfiguration[] = [];
    documentOptions: { value: string; label: string }[] = [];
    groupedDocuments: { [category: string]: { value: string; label: string }[] } = {};
    selectedDocumentType = '';

    constructor(private configService: SystemConfigService) { }

    async ngOnInit() {
        await this.loadConfigurations();
        await this.loadDocumentTypes();
    }

    /**
     * Example 1: Load all configurations
     */
    async loadConfigurations() {
        try {
            const response = await this.configService.getAllConfigurations().toPromise();
            if (response && response.code === 1000) {
                this.configurations = response.data;
            }
        } catch (error) {
            console.error('Error loading configurations:', error);
        }
    }

    /**
     * Example 2: Load and use required documents configuration
     */
    async loadDocumentTypes() {
        try {
            const documentsMap = await this.configService.getRequiredDocuments();
            this.documentOptions = this.configService.generateDocumentTypeOptions(documentsMap);
            this.groupedDocuments = this.configService.groupDocumentsByCategory(documentsMap);
        } catch (error) {
            console.error('Error loading document types:', error);
        }
    }

    /**
     * Example 3: Get specific configuration values
     */
    async getSpecificConfigs() {
        // Get email configuration
        const smtpHost = await this.configService.getConfigValue('email.smtp.host', 'localhost');
        const smtpPort = await this.configService.getConfigValueAsNumber('email.smtp.port', 587);

        // Get security settings
        const minPasswordLength = await this.configService.getConfigValueAsNumber('security.password.min_length', 8);
        const maintenanceMode = await this.configService.getConfigValueAsBoolean('system.maintenance_mode', false);

        console.log('SMTP Host:', smtpHost);
        console.log('SMTP Port:', smtpPort);
        console.log('Min Password Length:', minPasswordLength);
        console.log('Maintenance Mode:', maintenanceMode);
    }

    /**
     * Example 4: Create new configuration
     */
    async createNewConfig() {
        const success = await this.configService.setConfigValue(
            'app.max_file_size',
            '10485760', // 10MB in bytes
            'Maximum file upload size in bytes'
        );

        if (success) {
            console.log('Configuration created successfully');
            await this.loadConfigurations(); // Reload list
        }
    }

    /**
     * Example 5: Update existing configuration
     */
    async updateConfig() {
        const success = await this.configService.setConfigValue(
            'loan.max_amount',
            '1000000000', // 1 billion VND
            'Maximum loan amount in VND'
        );

        if (success) {
            console.log('Configuration updated successfully');
        }
    }

    /**
     * Example 6: Update document types
     */
    async updateDocumentTypes() {
        const newDocumentTypes: RequiredDocumentsConfig = {
            "ID_CARD": "CMND/CCCD",
            "PASSPORT": "Hộ chiếu",
            "DRIVER_LICENSE": "Bằng lái xe",
            "HOUSEHOLD_BOOK": "Sổ hộ khẩu",
            "MARRIAGE_CERTIFICATE": "Giấy kết hôn",
            "INCOME_CERTIFICATE": "Giấy xác nhận thu nhập",
            "BANK_STATEMENT": "Sao kê ngân hàng",
            "TAX_DECLARATION": "Tờ khai thuế",
            "PROPERTY_CERTIFICATE": "Giấy chứng nhận quyền sở hữu nhà đất",
            "VEHICLE_REGISTRATION": "Đăng ký xe",
            "COLLATERAL_EVALUATION": "Báo cáo thẩm định tài sản bảo đảm",
            "BUSINESS_LICENSE": "Giấy phép kinh doanh",
            "EQUIPMENT_PURCHASE_CONTRACT": "Hợp đồng mua thiết bị"
        };

        const success = await this.configService.updateRequiredDocuments(newDocumentTypes);
        if (success) {
            console.log('Document types updated successfully');
            await this.loadDocumentTypes(); // Reload document types
        }
    }

    /**
     * Example 7: Get configurations by prefix
     */
    async getConfigsByPrefix() {
        const groupedConfigs = await this.configService.getConfigurationsByPrefix();
        console.log('Email configs:', groupedConfigs['email']);
        console.log('Security configs:', groupedConfigs['security']);
        console.log('Loan configs:', groupedConfigs['loan']);
    }

    /**
     * Example 8: Validate configuration key
     */
    validateKeyExample() {
        const validKeys = [
            'email.smtp.host',
            'security.password.min_length',
            'loan.max_amount'
        ];

        const invalidKeys = [
            '', // Empty
            'a'.repeat(101), // Too long
            '123invalid', // Starts with number
            'invalid@key', // Invalid character
            '.invalid' // Starts with dot
        ];

        validKeys.forEach(key => {
            console.log(`${key}: ${this.configService.validateConfigKey(key) ? 'VALID' : 'INVALID'}`);
        });

        invalidKeys.forEach(key => {
            console.log(`${key}: ${this.configService.validateConfigKey(key) ? 'VALID' : 'INVALID'}`);
        });
    }
}

/**
 * COMMON CONFIGURATION PATTERNS
 */

// 1. Email Configuration
export const EMAIL_CONFIGS = {
    SMTP_HOST: 'email.smtp.host',
    SMTP_PORT: 'email.smtp.port',
    SMTP_USERNAME: 'email.smtp.username',
    SMTP_PASSWORD: 'email.smtp.password',
    FROM_ADDRESS: 'email.from.address',
    FROM_NAME: 'email.from.name'
};

// 2. Security Configuration  
export const SECURITY_CONFIGS = {
    PASSWORD_MIN_LENGTH: 'security.password.min_length',
    SESSION_TIMEOUT: 'security.session.timeout',
    MAX_LOGIN_ATTEMPTS: 'security.max_login_attempts',
    LOCKOUT_DURATION: 'security.lockout_duration',
    JWT_EXPIRY: 'security.jwt.expiry'
};

// 3. Business Configuration
export const BUSINESS_CONFIGS = {
    LOAN_MAX_AMOUNT: 'loan.max_amount',
    LOAN_MIN_AMOUNT: 'loan.min_amount',
    DEFAULT_INTEREST_RATE: 'loan.default_interest_rate',
    MAX_LOAN_TERM: 'loan.max_term_months',
    PROCESSING_FEE_RATE: 'loan.processing_fee_rate'
};

// 4. System Configuration
export const SYSTEM_CONFIGS = {
    MAINTENANCE_MODE: 'system.maintenance_mode',
    MAX_FILE_SIZE: 'system.max_file_size',
    ALLOWED_FILE_TYPES: 'system.allowed_file_types',
    BACKUP_SCHEDULE: 'system.backup_schedule',
    LOG_LEVEL: 'system.log_level'
};

/**
 * UTILITY SERVICE FOR COMMON CONFIG OPERATIONS
 */
export class ConfigUtilityService {
    constructor(private configService: SystemConfigService) { }

    async getEmailConfig() {
        return {
            host: await this.configService.getConfigValue(EMAIL_CONFIGS.SMTP_HOST, 'localhost'),
            port: await this.configService.getConfigValueAsNumber(EMAIL_CONFIGS.SMTP_PORT, 587),
            username: await this.configService.getConfigValue(EMAIL_CONFIGS.SMTP_USERNAME),
            fromAddress: await this.configService.getConfigValue(EMAIL_CONFIGS.FROM_ADDRESS),
            fromName: await this.configService.getConfigValue(EMAIL_CONFIGS.FROM_NAME, 'Loan Management System')
        };
    }

    async getSecurityConfig() {
        return {
            passwordMinLength: await this.configService.getConfigValueAsNumber(SECURITY_CONFIGS.PASSWORD_MIN_LENGTH, 8),
            sessionTimeout: await this.configService.getConfigValueAsNumber(SECURITY_CONFIGS.SESSION_TIMEOUT, 3600),
            maxLoginAttempts: await this.configService.getConfigValueAsNumber(SECURITY_CONFIGS.MAX_LOGIN_ATTEMPTS, 5),
            lockoutDuration: await this.configService.getConfigValueAsNumber(SECURITY_CONFIGS.LOCKOUT_DURATION, 900)
        };
    }

    async getBusinessConfig() {
        return {
            maxLoanAmount: await this.configService.getConfigValueAsNumber(BUSINESS_CONFIGS.LOAN_MAX_AMOUNT, 1000000000),
            minLoanAmount: await this.configService.getConfigValueAsNumber(BUSINESS_CONFIGS.LOAN_MIN_AMOUNT, 1000000),
            defaultInterestRate: await this.configService.getConfigValueAsNumber(BUSINESS_CONFIGS.DEFAULT_INTEREST_RATE, 12.0),
            maxLoanTerm: await this.configService.getConfigValueAsNumber(BUSINESS_CONFIGS.MAX_LOAN_TERM, 60),
            processingFeeRate: await this.configService.getConfigValueAsNumber(BUSINESS_CONFIGS.PROCESSING_FEE_RATE, 1.0)
        };
    }

    async isMaintenanceMode(): Promise<boolean> {
        return await this.configService.getConfigValueAsBoolean(SYSTEM_CONFIGS.MAINTENANCE_MODE, false);
    }

    async getMaxFileSize(): Promise<number> {
        return await this.configService.getConfigValueAsNumber(SYSTEM_CONFIGS.MAX_FILE_SIZE, 10485760); // 10MB default
    }
}
