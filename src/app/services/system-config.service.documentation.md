# System Configuration Service Documentation

## Tổng quan

`SystemConfigService` là một Angular service được thiết kế để quản lý các cấu hình hệ thống thông qua API `/system-configurations`. Service này cung cấp đầy đủ các tính năng CRUD và các utility methods để làm việc với cấu hình hệ thống một cách dễ dàng.

## Cài đặt và Import

```typescript
import { SystemConfigService, SystemConfiguration, RequiredDocumentsConfig } from './services/system-config.service';

// Inject vào component
constructor(private configService: SystemConfigService) {}
```

## Interfaces chính

### SystemConfiguration
```typescript
interface SystemConfiguration {
  configId: number;
  configKey: string;
  configValue: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

### CreateSystemConfigRequest
```typescript
interface CreateSystemConfigRequest {
  configKey: string;
  configValue: string;
  description?: string;
}
```

### RequiredDocumentsConfig
```typescript
interface RequiredDocumentsConfig {
  [key: string]: string; // Document type key -> Document name mapping
}
```

## Các phương thức chính

### 1. CRUD Operations

#### Tạo cấu hình mới
```typescript
async createConfig() {
  const newConfig = {
    configKey: 'email.smtp.host',
    configValue: 'smtp.gmail.com',
    description: 'SMTP server hostname for email sending'
  };
  
  const response = await this.configService.createConfiguration(newConfig).toPromise();
  if (response.code === 1000) {
    console.log('Configuration created:', response.data);
  }
}
```

#### Lấy tất cả cấu hình
```typescript
async loadAllConfigs() {
  const response = await this.configService.getAllConfigurations().toPromise();
  if (response.code === 1000) {
    this.configurations = response.data;
  }
}
```

#### Lấy cấu hình theo key
```typescript
async getSpecificConfig() {
  const response = await this.configService.getConfigurationByKey('email.smtp.host').toPromise();
  if (response.code === 1000) {
    console.log('SMTP Host:', response.data.configValue);
  }
}
```

#### Cập nhật cấu hình
```typescript
async updateConfig() {
  const updateData = {
    configKey: 'email.smtp.host',
    configValue: 'new-smtp.example.com',
    description: 'Updated SMTP server hostname'
  };
  
  const response = await this.configService.updateConfiguration(configId, updateData).toPromise();
  if (response.code === 1000) {
    console.log('Configuration updated');
  }
}
```

#### Xóa cấu hình
```typescript
async deleteConfig() {
  const response = await this.configService.deleteConfiguration(configId).toPromise();
  if (response.code === 1000) {
    console.log('Configuration deleted');
  }
}
```

### 2. Utility Methods

#### Lấy giá trị cấu hình với fallback
```typescript
// Lấy giá trị string
const smtpHost = await this.configService.getConfigValue('email.smtp.host', 'localhost');

// Lấy giá trị number
const smtpPort = await this.configService.getConfigValueAsNumber('email.smtp.port', 587);

// Lấy giá trị boolean
const maintenanceMode = await this.configService.getConfigValueAsBoolean('system.maintenance_mode', false);
```

#### Set giá trị cấu hình (tạo mới hoặc cập nhật)
```typescript
// Tự động tạo mới nếu chưa tồn tại, hoặc cập nhật nếu đã có
const success = await this.configService.setConfigValue(
  'loan.max_amount',
  '1000000000',
  'Maximum loan amount in VND'
);

if (success) {
  console.log('Configuration saved successfully');
}
```

#### Validate key format
```typescript
const isValid = this.configService.validateConfigKey('email.smtp.host'); // true
const isInvalid = this.configService.validateConfigKey('123invalid'); // false
```

### 3. Special Configurations - Required Documents

#### Lấy danh sách loại tài liệu
```typescript
async loadDocumentTypes() {
  const documentsMap = await this.configService.getRequiredDocuments();
  console.log(documentsMap);
  // Output: { "ID_CARD": "CMND/CCCD", "PASSPORT": "Hộ chiếu", ... }
}
```

#### Cập nhật danh sách loại tài liệu
```typescript
async updateDocumentTypes() {
  const newDocumentTypes = {
    "ID_CARD": "CMND/CCCD",
    "PASSPORT": "Hộ chiếu",
    "DRIVER_LICENSE": "Bằng lái xe",
    "BANK_STATEMENT": "Sao kê ngân hàng"
  };
  
  const success = await this.configService.updateRequiredDocuments(newDocumentTypes);
  if (success) {
    console.log('Document types updated');
  }
}
```

#### Tạo options cho dropdown
```typescript
async setupDocumentDropdown() {
  const documentsMap = await this.configService.getRequiredDocuments();
  this.documentOptions = this.configService.generateDocumentTypeOptions(documentsMap);
  
  // Sử dụng trong template:
  // <option *ngFor="let option of documentOptions" [value]="option.value">
  //   {{option.label}}
  // </option>
}
```

#### Nhóm tài liệu theo danh mục
```typescript
async setupGroupedDocuments() {
  const documentsMap = await this.configService.getRequiredDocuments();
  this.groupedDocuments = this.configService.groupDocumentsByCategory(documentsMap);
  
  // Sử dụng trong template với optgroup:
  // <optgroup *ngFor="let group of groupedDocuments | keyvalue" [label]="group.key">
  //   <option *ngFor="let option of group.value" [value]="option.value">
  //     {{option.label}}
  //   </option>
  // </optgroup>
}
```

### 4. Advanced Features

#### Lấy cấu hình theo prefix
```typescript
async getConfigsByCategory() {
  const groupedConfigs = await this.configService.getConfigurationsByPrefix();
  
  console.log('Email configs:', groupedConfigs['email']);
  console.log('Security configs:', groupedConfigs['security']);
  console.log('Loan configs:', groupedConfigs['loan']);
}
```

## Các pattern cấu hình thường dùng

### Email Configuration
```typescript
const EMAIL_CONFIGS = {
  SMTP_HOST: 'email.smtp.host',
  SMTP_PORT: 'email.smtp.port',
  SMTP_USERNAME: 'email.smtp.username',
  FROM_ADDRESS: 'email.from.address'
};
```

### Security Configuration
```typescript
const SECURITY_CONFIGS = {
  PASSWORD_MIN_LENGTH: 'security.password.min_length',
  SESSION_TIMEOUT: 'security.session.timeout',
  MAX_LOGIN_ATTEMPTS: 'security.max_login_attempts'
};
```

### Business Configuration
```typescript
const BUSINESS_CONFIGS = {
  LOAN_MAX_AMOUNT: 'loan.max_amount',
  LOAN_MIN_AMOUNT: 'loan.min_amount',
  DEFAULT_INTEREST_RATE: 'loan.default_interest_rate'
};
```

## Error Handling

Service tự động handle các lỗi phổ biến và return appropriate values:

```typescript
try {
  const value = await this.configService.getConfigValue('some.key', 'default');
  // Nếu có lỗi, sẽ return 'default' thay vì throw exception
} catch (error) {
  // Chỉ catch những lỗi không dự đoán được
  console.error('Unexpected error:', error);
}
```

## Best Practices

### 1. Key Naming Convention
- Sử dụng cấu trúc phân cấp: `module.component.setting`
- Dùng lowercase với dấu chấm: `email.smtp.host`
- Tránh viết tắt: `password.minimum_length` thay vì `pwd.min_len`

### 2. Value Storage
- Lưu dưới dạng string, parse khi cần
- Sử dụng format chuẩn cho dates (ISO 8601)
- Boolean lưu là "true"/"false"

### 3. Error Handling
- Luôn có fallback values
- Log errors nhưng không throw exceptions
- Validate input trước khi gửi API

### 4. Performance
- Cache frequently used values
- Sử dụng getConfigurationsByPrefix() cho bulk operations
- Avoid nhiều API calls liên tiếp

## Example Component

```typescript
@Component({
  selector: 'app-system-config',
  template: `
    <div class="config-manager">
      <h2>System Configuration</h2>
      
      <!-- Document Type Selector -->
      <select [(ngModel)]="selectedDocType">
        <optgroup *ngFor="let group of groupedDocs | keyvalue" [label]="group.key">
          <option *ngFor="let doc of group.value" [value]="doc.value">
            {{doc.label}}
          </option>
        </optgroup>
      </select>
      
      <!-- Configuration List -->
      <div *ngFor="let config of configs" class="config-item">
        <strong>{{config.configKey}}:</strong> {{config.configValue}}
        <button (click)="editConfig(config)">Edit</button>
        <button (click)="deleteConfig(config.configId)">Delete</button>
      </div>
    </div>
  `
})
export class SystemConfigComponent implements OnInit {
  configs: SystemConfiguration[] = [];
  groupedDocs: any = {};
  selectedDocType = '';

  constructor(private configService: SystemConfigService) {}

  async ngOnInit() {
    await this.loadConfigurations();
    await this.loadDocumentTypes();
  }

  async loadConfigurations() {
    const response = await this.configService.getAllConfigurations().toPromise();
    if (response?.code === 1000) {
      this.configs = response.data;
    }
  }

  async loadDocumentTypes() {
    const documentsMap = await this.configService.getRequiredDocuments();
    this.groupedDocs = this.configService.groupDocumentsByCategory(documentsMap);
  }

  async editConfig(config: SystemConfiguration) {
    const success = await this.configService.setConfigValue(
      config.configKey,
      'new value',
      config.description
    );
    
    if (success) {
      await this.loadConfigurations();
    }
  }

  async deleteConfig(configId: number) {
    const response = await this.configService.deleteConfiguration(configId).toPromise();
    if (response?.code === 1000) {
      await this.loadConfigurations();
    }
  }
}
```

## Testing

Để test service, bạn có thể sử dụng Angular Testing Utils:

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SystemConfigService } from './system-config.service';

describe('SystemConfigService', () => {
  let service: SystemConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(SystemConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate config keys correctly', () => {
    expect(service.validateConfigKey('email.smtp.host')).toBeTruthy();
    expect(service.validateConfigKey('123invalid')).toBeFalsy();
  });
});
```

Service này cung cấp một interface hoàn chình để quản lý system configurations với error handling tốt và nhiều utility methods hữu ích cho việc development.
