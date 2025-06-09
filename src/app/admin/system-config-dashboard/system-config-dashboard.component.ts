import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  SystemConfigService,
  SystemConfiguration,
  CreateSystemConfigRequest,
  UpdateSystemConfigRequest,
  RequiredDocumentsConfig
} from '../../services/system-config.service';

interface ConfigGroup {
  prefix: string;
  displayName: string;
  configs: SystemConfiguration[];
  color: string;
  icon: string;
  description: string;
}

interface ConfigFormData {
  configKey: string;
  configValue: string;
  description: string;
}

@Component({
  selector: 'app-system-config-dashboard',
  templateUrl: './system-config-dashboard.component.html',
  styleUrls: ['./system-config-dashboard.component.css']
})
export class SystemConfigDashboardComponent implements OnInit {

  // Data properties
  configurations: SystemConfiguration[] = [];
  configGroups: ConfigGroup[] = [];
  requiredDocuments: RequiredDocumentsConfig = {};
  documentOptions: { value: string; label: string }[] = [];

  // UI state properties
  isLoading = false;
  error: string | null = null;

  // Modal states
  isCreateModalOpen = false;
  isEditModalOpen = false;
  isDocumentModalOpen = false;
  isDeleteModalOpen = false;
  isEmailPreviewModalOpen = false;
  isEmailTemplateEditorModalOpen = false;

  // Accordion states
  expandedConfigs: { [key: string]: boolean } = {};

  // Document management
  isEditingDocuments = false;
  newDocumentKey = '';
  newDocumentValue = '';
  parsedDocuments: { [key: string]: string } = {};

  // Email HTML sanitization
  sanitizedEmailHtml: SafeHtml = '';
  emailTemplatePreviewHtml: SafeHtml = '';

  // Form data
  createForm: ConfigFormData = { configKey: '', configValue: '', description: '' };
  editForm: ConfigFormData = { configKey: '', configValue: '', description: '' };
  emailTemplateForm: ConfigFormData = { configKey: '', configValue: '', description: '' };
  selectedConfig: SystemConfiguration | null = null;

  // Validation
  formErrors: { [key: string]: string } = {};

  constructor(
    private configService: SystemConfigService,
    private sanitizer: DomSanitizer
  ) { }

  async ngOnInit() {
    await this.loadConfigurations();
    await this.loadRequiredDocuments();
  }

  /**
   * Load all configurations and parse special ones
   */
  async loadConfigurations() {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await this.configService.getAllConfigurations().toPromise();
      if (response && response.code === 1000) {
        this.configurations = response.data;
        this.groupConfigurations();
        this.parseRequiredDocuments();
      } else {
        this.error = 'Không thể tải danh sách cấu hình';
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      this.error = 'Lỗi kết nối khi tải dữ liệu cấu hình';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Parse required documents configuration
   */
  parseRequiredDocuments() {
    const requiredDocsConfig = this.configurations.find(config =>
      config.configKey === 'required_documents'
    );

    if (requiredDocsConfig) {
      try {
        this.parsedDocuments = JSON.parse(requiredDocsConfig.configValue);
      } catch (error) {
        console.error('Error parsing required documents:', error);
        this.parsedDocuments = {};
      }
    }
  }

  /**
   * Load required documents configuration
   */
  async loadRequiredDocuments() {
    try {
      this.requiredDocuments = await this.configService.getRequiredDocuments();
      this.documentOptions = this.configService.generateDocumentTypeOptions(this.requiredDocuments);
    } catch (error) {
      console.error('Error loading required documents:', error);
    }
  }

  /**
   * Group configurations by prefix
   */
  groupConfigurations() {
    const grouped = this.configurations.reduce((acc, config) => {
      const prefix = config.configKey.split('.')[0];
      if (!acc[prefix]) {
        acc[prefix] = [];
      }
      acc[prefix].push(config);
      return acc;
    }, {} as { [key: string]: SystemConfiguration[] });

    this.configGroups = Object.entries(grouped).map(([prefix, configs]) => ({
      prefix,
      displayName: this.getGroupDisplayName(prefix),
      configs,
      color: this.getGroupColor(prefix),
      icon: this.getGroupIcon(prefix),
      description: this.getGroupDescription(prefix)
    }));
  }

  /**
   * Get display name for configuration group
   */
  getGroupDisplayName(prefix: string): string {
    const groupNames: { [key: string]: string } = {
      'email': 'Email',
      'security': 'Bảo mật',
      'loan': 'Khoản vay',
      'system': 'Hệ thống',
      'required_documents': 'Tài liệu yêu cầu',
      'app': 'Ứng dụng',
      'database': 'Cơ sở dữ liệu',
      'api': 'API',
      'notification': 'Thông báo',
      'payment': 'Thanh toán'
    };
    return groupNames[prefix] || prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }

  /**
   * Get color for configuration group
   */
  getGroupColor(prefix: string): string {
    const colors: { [key: string]: string } = {
      'email': 'from-blue-500 to-blue-600',
      'security': 'from-red-500 to-red-600',
      'loan': 'from-green-500 to-green-600',
      'system': 'from-purple-500 to-purple-600',
      'required_documents': 'from-orange-500 to-orange-600',
      'app': 'from-indigo-500 to-indigo-600',
      'database': 'from-teal-500 to-teal-600',
      'api': 'from-pink-500 to-pink-600',
      'notification': 'from-yellow-500 to-yellow-600',
      'payment': 'from-emerald-500 to-emerald-600'
    };
    return colors[prefix] || 'from-gray-500 to-gray-600';
  }

  /**
   * Get icon for configuration group
   */
  getGroupIcon(prefix: string): string {
    const icons: { [key: string]: string } = {
      'email': 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      'security': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      'loan': 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      'system': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      'required_documents': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    };
    return icons[prefix] || 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z';
  }

  /**
   * Get description for configuration group
   */
  getGroupDescription(prefix: string): string {
    const descriptions: { [key: string]: string } = {
      'email': 'Cấu hình máy chủ email và gửi thông báo',
      'security': 'Các thiết lập bảo mật và xác thực',
      'loan': 'Cấu hình nghiệp vụ khoản vay',
      'system': 'Cấu hình hệ thống chung',
      'required_documents': 'Danh sách tài liệu yêu cầu',
      'app': 'Cấu hình ứng dụng',
      'database': 'Cấu hình cơ sở dữ liệu',
      'api': 'Cấu hình API và endpoints',
      'notification': 'Cấu hình thông báo',
      'payment': 'Cấu hình thanh toán'
    };
    return descriptions[prefix] || `Cấu hình nhóm ${prefix}`;
  }

  /**
   * Toggle accordion expansion
   */
  toggleAccordion(configKey: string) {
    this.expandedConfigs[configKey] = !this.expandedConfigs[configKey];
  }

  /**
   * Check if accordion is expanded
   */
  isExpanded(configKey: string): boolean {
    return !!this.expandedConfigs[configKey];
  }

  /**
   * Check if config is email template
   */
  isEmailTemplate(configKey: string): boolean {
    return configKey.startsWith('email_');
  }

  /**
   * Check if config is required documents
   */
  isRequiredDocuments(configKey: string): boolean {
    return configKey === 'required_documents';
  }

  /**
   * Start editing documents
   */
  startEditingDocuments() {
    this.isEditingDocuments = true;
  }

  /**
   * Save documents configuration
   */
  async saveDocuments() {
    const requiredDocsConfig = this.configurations.find(config =>
      config.configKey === 'required_documents'
    );

    if (requiredDocsConfig) {
      const updatedValue = JSON.stringify(this.parsedDocuments);

      try {
        const response = await this.configService.updateConfiguration(
          requiredDocsConfig.configId,
          {
            configKey: requiredDocsConfig.configKey,
            configValue: updatedValue,
            description: requiredDocsConfig.description || ''
          }
        ).toPromise();

        if (response && response.code === 1000) {
          await this.loadConfigurations();
          this.isEditingDocuments = false;
        } else {
          this.error = 'Không thể cập nhật danh sách tài liệu';
        }
      } catch (error) {
        console.error('Error updating documents:', error);
        this.error = 'Lỗi khi cập nhật danh sách tài liệu';
      }
    }
  }

  /**
   * Cancel editing documents
   */
  cancelEditingDocuments() {
    this.isEditingDocuments = false;
    this.newDocumentKey = '';
    this.newDocumentValue = '';
    this.parseRequiredDocuments();
  }

  /**
   * Add new document type
   */
  addNewDocument() {
    if (this.newDocumentKey && this.newDocumentValue) {
      this.parsedDocuments[this.newDocumentKey.toUpperCase()] = this.newDocumentValue;
      this.newDocumentKey = '';
      this.newDocumentValue = '';
    }
  }

  /**
   * Remove document type
   */
  removeDocument(key: string) {
    if (confirm(`Bạn có chắc muốn xóa loại tài liệu "${this.parsedDocuments[key]}"?`)) {
      delete this.parsedDocuments[key];
    }
  }

  /**
   * Open email preview in new tab/window
   */
  openEmailPreview(config: SystemConfiguration) {
    if (config.configValue) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(config.configValue);
        newWindow.document.close();
      }
    }
  }

  /**
   * Get object keys for iteration
   */
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  // Modal methods
  openCreateModal() {
    this.createForm = { configKey: '', configValue: '', description: '' };
    this.formErrors = {};
    this.isCreateModalOpen = true;
  }

  openEditModal(config: SystemConfiguration) {
    this.selectedConfig = config;
    this.editForm = {
      configKey: config.configKey,
      configValue: config.configValue,
      description: config.description || ''
    };
    this.formErrors = {};
    this.isEditModalOpen = true;
  }

  openDeleteModal(config: SystemConfiguration) {
    this.selectedConfig = config;
    this.isDeleteModalOpen = true;
  }

  /**
   * Open email template editor modal
   */
  openEmailTemplateEditor(config: SystemConfiguration) {
    this.selectedConfig = config;
    this.emailTemplateForm = {
      configKey: config.configKey,
      configValue: config.configValue,
      description: config.description || ''
    };
    this.updateEmailTemplatePreview();
    this.formErrors = {};
    this.isEmailTemplateEditorModalOpen = true;
  }

  /**
   * Update email template preview
   */
  updateEmailTemplatePreview() {
    if (this.emailTemplateForm.configValue) {
      this.emailTemplatePreviewHtml = this.sanitizer.bypassSecurityTrustHtml(this.emailTemplateForm.configValue);
    } else {
      this.emailTemplatePreviewHtml = '';
    }
  }

  /**
   * Handle email template change
   */
  onEmailTemplateChange() {
    this.updateEmailTemplatePreview();
  }

  /**
   * Get template length
   */
  getTemplateLength(): number {
    return this.emailTemplateForm.configValue ? this.emailTemplateForm.configValue.length : 0;
  }

  /**
   * Get current line (simplified implementation)
   */
  getCurrentLine(): number {
    if (!this.emailTemplateForm.configValue) return 1;
    const lines = this.emailTemplateForm.configValue.substr(0, this.emailTemplateForm.configValue.length).split('\n');
    return lines.length;
  }

  /**
   * Format email template (basic formatting)
   */
  formatEmailTemplate() {
    if (this.emailTemplateForm.configValue) {
      // Basic HTML formatting - you can enhance this with a proper HTML formatter
      let formatted = this.emailTemplateForm.configValue;
      // Simple indentation for HTML tags
      formatted = formatted.replace(/></g, '>\n<');
      formatted = formatted.replace(/^\s+|\s+$/gm, ''); // Remove leading/trailing spaces
      this.emailTemplateForm.configValue = formatted;
      this.updateEmailTemplatePreview();
    }
  }

  /**
   * Refresh preview
   */
  refreshPreview() {
    this.updateEmailTemplatePreview();
  }

  /**
   * Open preview in new tab
   */
  openPreviewInNewTab() {
    if (this.emailTemplateForm.configValue) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(this.emailTemplateForm.configValue);
        newWindow.document.close();
      }
    }
  }

  /**
   * Copy template to clipboard
   */
  copyTemplateToClipboard() {
    if (this.emailTemplateForm.configValue) {
      this.copyToClipboard(this.emailTemplateForm.configValue);
    }
  }

  /**
   * Reset template to original value
   */
  resetTemplate() {
    if (this.selectedConfig) {
      this.emailTemplateForm.configValue = this.selectedConfig.configValue;
      this.updateEmailTemplatePreview();
    }
  }

  /**
   * Save email template
   */
  async saveEmailTemplate() {
    if (!this.validateForm(this.emailTemplateForm) || !this.selectedConfig) return;

    this.isLoading = true;

    try {
      const response = await this.configService.updateConfiguration(
        this.selectedConfig.configId,
        {
          configKey: this.emailTemplateForm.configKey,
          configValue: this.emailTemplateForm.configValue,
          description: this.emailTemplateForm.description
        }
      ).toPromise();

      if (response && response.code === 1000) {
        await this.loadConfigurations();
        this.closeAllModals();
      } else {
        this.error = response?.message || 'Không thể cập nhật email template';
      }
    } catch (error) {
      console.error('Error updating email template:', error);
      this.error = 'Lỗi khi cập nhật email template';
    } finally {
      this.isLoading = false;
    }
  }

  closeAllModals() {
    this.isCreateModalOpen = false;
    this.isEditModalOpen = false;
    this.isDeleteModalOpen = false;
    this.isDocumentModalOpen = false;
    this.isEmailPreviewModalOpen = false;
    this.isEmailTemplateEditorModalOpen = false;
    this.selectedConfig = null;
    this.formErrors = {};
    this.isEditingDocuments = false;
    this.newDocumentKey = '';
    this.newDocumentValue = '';
    this.emailTemplateForm = { configKey: '', configValue: '', description: '' };
    this.emailTemplatePreviewHtml = '';
  }

  /**
   * Validate form data
   */
  validateForm(formData: ConfigFormData): boolean {
    this.formErrors = {};

    if (!formData.configKey.trim()) {
      this.formErrors['configKey'] = 'Tên cấu hình không được để trống';
    } else if (!this.configService.validateConfigKey(formData.configKey)) {
      this.formErrors['configKey'] = 'Tên cấu hình không hợp lệ (tối đa 100 ký tự, chỉ chứa chữ, số, dấu chấm, gạch dưới)';
    }

    if (!formData.configValue.trim()) {
      this.formErrors['configValue'] = 'Giá trị cấu hình không được để trống';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  /**
   * Create new configuration
   */
  async createConfiguration() {
    if (!this.validateForm(this.createForm)) {
      return;
    }

    this.isLoading = true;
    try {
      const response = await this.configService.createConfiguration(this.createForm).toPromise();
      if (response && response.code === 1000) {
        await this.loadConfigurations();
        this.closeAllModals();
      } else {
        this.error = 'Không thể tạo cấu hình mới';
      }
    } catch (error) {
      console.error('Error creating configuration:', error);
      this.error = 'Lỗi khi tạo cấu hình mới';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Update configuration
   */
  async updateConfiguration() {
    if (!this.selectedConfig || !this.validateForm(this.editForm)) {
      return;
    }

    this.isLoading = true;
    try {
      const response = await this.configService.updateConfiguration(
        this.selectedConfig.configId,
        this.editForm
      ).toPromise();

      if (response && response.code === 1000) {
        await this.loadConfigurations();
        this.closeAllModals();
      } else {
        this.error = 'Không thể cập nhật cấu hình';
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      this.error = 'Lỗi khi cập nhật cấu hình';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Delete configuration
   */
  async deleteConfiguration() {
    if (!this.selectedConfig) {
      return;
    }

    this.isLoading = true;
    try {
      const response = await this.configService.deleteConfiguration(this.selectedConfig.configId).toPromise();
      if (response && response.code === 1000) {
        await this.loadConfigurations();
        this.closeAllModals();
      } else {
        this.error = 'Không thể xóa cấu hình';
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      this.error = 'Lỗi khi xóa cấu hình';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Retry loading data
   */
  retryLoad() {
    this.loadConfigurations();
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }

  /**
   * Copy configuration value to clipboard
   */
  copyToClipboard(value: string) {
    navigator.clipboard.writeText(value).then(() => {
      // You can add a toast notification here
      console.log('Đã sao chép vào clipboard');
    });
  }

  /**
   * Export configurations as JSON
   */
  exportConfigurations() {
    const data = JSON.stringify(this.configurations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-configurations-${new Date().getTime()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
