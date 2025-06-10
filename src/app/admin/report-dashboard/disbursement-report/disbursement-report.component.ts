import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReportService, DisbursedAmountByTime, ApiResponse } from '../../../services/report.service';
import { Subject, takeUntil, interval, startWith } from 'rxjs';

interface DisbursementStats {
    totalDisbursed: number;
    totalTransactions: number;
    averageDaily: number;
    peakDay: DisbursedAmountByTime | null;
}

interface DateRangeOption {
    label: string;
    value: string;
    days: number;
}

@Component({
    selector: 'app-disbursement-report',
    templateUrl: './disbursement-report.component.html',
    styleUrls: ['./disbursement-report.component.css']
})
export class DisbursementReportComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // Data properties
    disbursedData: DisbursedAmountByTime[] = [];
    disbursementStats: DisbursementStats = {
        totalDisbursed: 0,
        totalTransactions: 0,
        averageDaily: 0,
        peakDay: null
    };

    // Loading and error states
    isLoading = false;
    error: string | null = null;

    // Date range controls
    selectedDateRange = 'month';
    customStartDate = '';
    customEndDate = '';
    showCustomDateRange = false;

    // Chart data
    chartData: any = null;
    chartOptions: any = {};

    // Auto-refresh
    autoRefresh = false;
    refreshInterval = 5; // minutes

    // Date range options
    dateRangeOptions: DateRangeOption[] = [
        { label: 'Hôm nay', value: 'today', days: 1 },
        { label: '7 ngày qua', value: 'week', days: 7 },
        { label: '30 ngày qua', value: 'month', days: 30 },
        { label: 'Quý này', value: 'quarter', days: 90 },
        { label: 'Năm nay', value: 'year', days: 365 },
        { label: 'Tùy chọn', value: 'custom', days: 0 }
    ];

    constructor(private reportService: ReportService) { }

    ngOnInit(): void {
        this.initializeComponent();
        this.setupAutoRefresh();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initializeComponent(): void {
        this.setupChartOptions();
        this.loadDisbursementData();
    }

    private setupAutoRefresh(): void {
        // Auto-refresh every 5 minutes if enabled
        interval(this.refreshInterval * 60 * 1000)
            .pipe(
                startWith(0),
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                if (this.autoRefresh && !this.isLoading) {
                    this.loadDisbursementData();
                }
            });
    }

    private setupChartOptions(): void {
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Số tiền đã giải ngân theo thời gian',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => {
                            const value = context.parsed.y;
                            return `${context.dataset.label}: ${this.formatCurrency(value)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Ngày'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Số tiền (VND)'
                    },
                    ticks: {
                        callback: (value: any) => {
                            return this.formatCurrencyShort(Number(value));
                        }
                    }
                }
            }
        };
    }

    loadDisbursementData(): void {
        if (this.isLoading) return;

        this.isLoading = true;
        this.error = null;

        const { startDate, endDate } = this.getDateRange();

        if (!this.reportService.validateDateRange(startDate, endDate)) {
            this.error = 'Khoảng thời gian không hợp lệ';
            this.isLoading = false;
            return;
        }

        this.reportService.getDisbursedAmountByTime(startDate, endDate)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: ApiResponse<DisbursedAmountByTime[]>) => {
                    this.handleSuccessResponse(response);
                },
                error: (error) => {
                    this.handleErrorResponse(error);
                },
                complete: () => {
                    this.isLoading = false;
                }
            });
    }

    private handleSuccessResponse(response: ApiResponse<DisbursedAmountByTime[]>): void {
        if (response.code === 1000 && response.data) {
            this.disbursedData = response.data;
            this.calculateStats();
            this.updateChartData();
        } else {
            this.error = response.message || 'Không thể tải dữ liệu';
        }
    }

    private handleErrorResponse(error: any): void {
        console.error('Error loading disbursement data:', error);

        if (error.status === 401) {
            this.error = 'Phiên đăng nhập đã hết hạn';
        } else if (error.status === 403) {
            this.error = 'Bạn không có quyền truy cập dữ liệu này';
        } else if (error.status === 0) {
            this.error = 'Không thể kết nối tới máy chủ';
        } else {
            this.error = 'Có lỗi xảy ra khi tải dữ liệu';
        }
    }

    private calculateStats(): void {
        this.disbursementStats = this.reportService.calculateDisbursementStats(this.disbursedData);
    }

    private updateChartData(): void {
        if (!this.disbursedData || this.disbursedData.length === 0) {
            this.chartData = null;
            return;
        }

        this.chartData = {
            labels: this.disbursedData.map(item => this.formatDate(item.date)),
            datasets: [
                {
                    label: 'Số tiền giải ngân',
                    data: this.disbursedData.map(item => item.totalDisbursedAmount),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Số giao dịch',
                    data: this.disbursedData.map(item => item.disbursedCount * 10000000), // Scale for visibility
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        };

        // Add second y-axis for transaction count
        this.chartOptions.scales.y1 = {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: 'Số giao dịch'
            },
            ticks: {
                callback: (value: any) => {
                    return Math.round(Number(value) / 10000000);
                }
            },
            grid: {
                drawOnChartArea: false
            }
        };
    }

    private getDateRange(): { startDate: string; endDate: string } {
        if (this.selectedDateRange === 'custom') {
            return {
                startDate: this.customStartDate,
                endDate: this.customEndDate
            };
        }

        return this.reportService.getDateRange(this.selectedDateRange as any);
    }

    // Event handlers
    onDateRangeChange(): void {
        this.showCustomDateRange = this.selectedDateRange === 'custom';

        if (this.selectedDateRange !== 'custom') {
            this.loadDisbursementData();
        }
    }

    onCustomDateRangeChange(): void {
        if (this.customStartDate && this.customEndDate) {
            this.loadDisbursementData();
        }
    }

    refreshData(): void {
        this.loadDisbursementData();
    }

    toggleAutoRefresh(): void {
        this.autoRefresh = !this.autoRefresh;
    }

    exportData(): void {
        if (!this.disbursedData || this.disbursedData.length === 0) {
            return;
        }

        const { startDate, endDate } = this.getDateRange();
        const exportData = {
            period: `${startDate} đến ${endDate}`,
            summary: {
                totalDisbursed: this.formatCurrency(this.disbursementStats.totalDisbursed),
                totalTransactions: this.disbursementStats.totalTransactions,
                averageDaily: this.formatCurrency(this.disbursementStats.averageDaily),
                peakDay: this.disbursementStats.peakDay?.date || 'N/A',
                peakAmount: this.disbursementStats.peakDay ?
                    this.formatCurrency(this.disbursementStats.peakDay.totalDisbursedAmount) : 'N/A'
            },
            dailyData: this.disbursedData.map(item => ({
                date: item.date,
                amount: this.formatCurrency(item.totalDisbursedAmount),
                transactions: item.disbursedCount
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `disbursement-report-${startDate}-${endDate}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    // Utility methods
    formatCurrency(amount: number): string {
        return this.reportService.formatCurrency(amount);
    }

    formatCurrencyShort(amount: number): string {
        if (amount >= 1000000000) {
            return (amount / 1000000000).toFixed(1) + 'B';
        } else if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(1) + 'K';
        }
        return amount.toString();
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            month: 'short',
            day: 'numeric'
        });
    }

    formatPercentage(value: number): string {
        return `${value.toFixed(1)}%`;
    }

    getGrowthRateClass(rate: number): string {
        if (rate > 0) return 'text-green-600';
        if (rate < 0) return 'text-red-600';
        return 'text-gray-600';
    }

    getGrowthIcon(rate: number): string {
        if (rate > 0) return '↗';
        if (rate < 0) return '↘';
        return '→';
    }

    getDaysInRange(): number {
        const option = this.dateRangeOptions.find(opt => opt.value === this.selectedDateRange);
        return option?.days || 0;
    }

    getLastUpdateTime(): string {
        return new Date().toLocaleTimeString('vi-VN');
    }
}
