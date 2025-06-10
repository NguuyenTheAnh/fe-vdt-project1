// Demo usage of Disbursed Amount API in Report Service
// filepath: d:\Web dev\Project_VDT_1\frontend\src\app\services\disbursed-amount-demo.ts

import { ReportService, DisbursedAmountByTime, ApprovedAmountByTime } from './report.service';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DisbursedAmountDemo {

    constructor(private reportService: ReportService) { }

    /**
     * Demo 1: Basic disbursed amount retrieval
     */
    async basicDisbursedAmountDemo() {
        console.log('=== Demo 1: Basic Disbursed Amount ===');

        const { startDate, endDate } = this.reportService.getDateRange('month');
        console.log(`Fetching data from ${startDate} to ${endDate}`);

        try {
            const response = await this.reportService.getDisbursedAmountByTime(startDate, endDate).toPromise();

            if (response?.code === 1000) {
                console.log('✅ Successfully retrieved disbursed amount data');
                console.log('📊 Data points:', response.data.length);

                const stats = this.reportService.calculateDisbursementStats(response.data);
                console.log('📈 Statistics:');
                console.log(`  - Total Disbursed: ${this.reportService.formatCurrency(stats.totalDisbursed)}`);
                console.log(`  - Total Transactions: ${stats.totalTransactions}`);
                console.log(`  - Average Daily: ${this.reportService.formatCurrency(stats.averageDaily)}`);
                console.log(`  - Peak Day: ${stats.peakDay?.date} (${this.reportService.formatCurrency(stats.peakDay?.totalDisbursedAmount || 0)})`);

                return response.data;
            } else {
                console.error('❌ API Error:', response?.message);
                return null;
            }
        } catch (error) {
            console.error('❌ Network Error:', error);
            return null;
        }
    }

    /**
     * Demo 2: Approved vs Disbursed comparison
     */
    async approvedVsDisbursedDemo() {
        console.log('\n=== Demo 2: Approved vs Disbursed Comparison ===');

        const { startDate, endDate } = this.reportService.getDateRange('month');

        try {
            const [approvedResponse, disbursedResponse] = await Promise.all([
                this.reportService.getApprovedAmountByTime(startDate, endDate).toPromise(),
                this.reportService.getDisbursedAmountByTime(startDate, endDate).toPromise()
            ]);

            if (approvedResponse?.code === 1000 && disbursedResponse?.code === 1000) {
                console.log('✅ Successfully retrieved both approved and disbursed data');

                const comparison = this.reportService.compareApprovedVsDisbursed(
                    approvedResponse.data,
                    disbursedResponse.data
                );

                console.log('🔄 Comparison Results:');
                console.log(`  - Total Approved: ${this.reportService.formatCurrency(comparison.totalApproved)}`);
                console.log(`  - Total Disbursed: ${this.reportService.formatCurrency(comparison.totalDisbursed)}`);
                console.log(`  - Disbursement Ratio: ${comparison.disbursementRatio.toFixed(2)}%`);

                // Show daily comparison for first 5 days
                console.log('📅 Daily Comparison (first 5 days):');
                comparison.dailyComparison.slice(0, 5).forEach(day => {
                    console.log(`  ${day.date}: Approved ${this.reportService.formatCurrency(day.approved)}, Disbursed ${this.reportService.formatCurrency(day.disbursed)} (${day.ratio.toFixed(1)}%)`);
                });

                return comparison;
            } else {
                console.error('❌ Failed to retrieve comparison data');
                return null;
            }
        } catch (error) {
            console.error('❌ Network Error:', error);
            return null;
        }
    }

    /**
     * Demo 3: Chart data preparation
     */
    async chartDataDemo() {
        console.log('\n=== Demo 3: Chart Data Preparation ===');

        const { startDate, endDate } = this.reportService.getDateRange('week');

        try {
            const response = await this.reportService.getDisbursedAmountByTime(startDate, endDate).toPromise();

            if (response?.code === 1000) {
                console.log('✅ Preparing chart data');

                // Line chart for disbursed amount
                const lineChartData = this.reportService.processChartData(response.data, 'line', 'disbursed');
                console.log('📊 Line Chart Configuration:');
                console.log('  Labels:', lineChartData.labels);
                console.log('  Dataset Label:', lineChartData.datasets[0].label);
                console.log('  Data Points:', lineChartData.datasets[0].data.length);

                // Demo chart configuration for Chart.js
                const chartConfig = {
                    type: 'line',
                    data: lineChartData,
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Disbursed Amount Over Time'
                            },
                            legend: {
                                display: true
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: (value: number) => this.reportService.formatCurrency(value)
                                }
                            }
                        }
                    }
                };

                console.log('🎨 Chart.js Configuration Ready');
                return chartConfig;
            } else {
                console.error('❌ Failed to prepare chart data');
                return null;
            }
        } catch (error) {
            console.error('❌ Network Error:', error);
            return null;
        }
    }

    /**
     * Demo 4: Growth rate analysis
     */
    async growthRateDemo() {
        console.log('\n=== Demo 4: Growth Rate Analysis ===');

        const { current, previous } = this.reportService.getComparisonDateRanges('month');
        console.log(`Current: ${current.startDate} to ${current.endDate}`);
        console.log(`Previous: ${previous.startDate} to ${previous.endDate}`);

        try {
            const [currentResponse, previousResponse] = await Promise.all([
                this.reportService.getDisbursedAmountByTime(current.startDate, current.endDate).toPromise(),
                this.reportService.getDisbursedAmountByTime(previous.startDate, previous.endDate).toPromise()
            ]);

            if (currentResponse?.code === 1000 && previousResponse?.code === 1000) {
                console.log('✅ Successfully retrieved period comparison data');

                const currentStats = this.reportService.calculateDisbursementStats(currentResponse.data);
                const previousStats = this.reportService.calculateDisbursementStats(previousResponse.data);

                const amountGrowth = this.reportService.calculateGrowthRate(
                    previousStats.totalDisbursed,
                    currentStats.totalDisbursed
                );

                const transactionGrowth = this.reportService.calculateGrowthRate(
                    previousStats.totalTransactions,
                    currentStats.totalTransactions
                );

                console.log('📈 Growth Analysis:');
                console.log(`  - Amount Growth: ${amountGrowth > 0 ? '+' : ''}${amountGrowth.toFixed(2)}%`);
                console.log(`  - Transaction Growth: ${transactionGrowth > 0 ? '+' : ''}${transactionGrowth.toFixed(2)}%`);
                console.log(`  - Current Period: ${this.reportService.formatCurrency(currentStats.totalDisbursed)}`);
                console.log(`  - Previous Period: ${this.reportService.formatCurrency(previousStats.totalDisbursed)}`);

                return {
                    amountGrowth,
                    transactionGrowth,
                    currentStats,
                    previousStats
                };
            } else {
                console.error('❌ Failed to retrieve growth rate data');
                return null;
            }
        } catch (error) {
            console.error('❌ Network Error:', error);
            return null;
        }
    }

    /**
     * Demo 5: Multi-line chart comparison
     */
    async multiLineChartDemo() {
        console.log('\n=== Demo 5: Multi-line Chart (Approved vs Disbursed) ===');

        const { startDate, endDate } = this.reportService.getDateRange('month');

        try {
            const [approvedResponse, disbursedResponse] = await Promise.all([
                this.reportService.getApprovedAmountByTime(startDate, endDate).toPromise(),
                this.reportService.getDisbursedAmountByTime(startDate, endDate).toPromise()
            ]);

            if (approvedResponse?.code === 1000 && disbursedResponse?.code === 1000) {
                console.log('✅ Preparing multi-line chart data');

                const multiLineData = this.reportService.processChartData(
                    [approvedResponse.data, disbursedResponse.data],
                    'multiline'
                );

                console.log('📊 Multi-line Chart Configuration:');
                console.log('  Labels:', multiLineData.labels.length, 'days');
                console.log('  Datasets:', multiLineData.datasets.length);
                console.log('  Dataset 1:', multiLineData.datasets[0].label);
                console.log('  Dataset 2:', multiLineData.datasets[1].label);

                // Chart.js configuration
                const chartConfig = {
                    type: 'line',
                    data: multiLineData,
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Approved vs Disbursed Amount Comparison'
                            },
                            legend: {
                                display: true,
                                position: 'top' as const
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: (value: number) => this.reportService.formatCurrency(value)
                                }
                            }
                        },
                        interaction: {
                            mode: 'index' as const,
                            intersect: false
                        }
                    }
                };

                console.log('🎨 Multi-line Chart.js Configuration Ready');
                return chartConfig;
            } else {
                console.error('❌ Failed to prepare multi-line chart data');
                return null;
            }
        } catch (error) {
            console.error('❌ Network Error:', error);
            return null;
        }
    }

    /**
     * Run all demos
     */
    async runAllDemos() {
        console.log('🚀 Starting Disbursed Amount Service Demo\n');

        await this.basicDisbursedAmountDemo();
        await this.approvedVsDisbursedDemo();
        await this.chartDataDemo();
        await this.growthRateDemo();
        await this.multiLineChartDemo();

        console.log('\n✨ All demos completed!');
    }

    /**
     * Quick test of date range validation
     */
    testDateValidation() {
        console.log('\n=== Date Validation Tests ===');

        const testCases = [
            { start: '2024-01-01', end: '2024-01-31', expected: true },
            { start: '2024-02-01', end: '2024-01-31', expected: false },
            { start: 'invalid-date', end: '2024-01-31', expected: false },
            { start: '2024-01-01', end: 'invalid-date', expected: false }
        ];

        testCases.forEach(testCase => {
            const result = this.reportService.validateDateRange(testCase.start, testCase.end);
            const status = result === testCase.expected ? '✅' : '❌';
            console.log(`${status} ${testCase.start} to ${testCase.end}: ${result} (expected: ${testCase.expected})`);
        });
    }
}

/*
 * USAGE IN COMPONENT:
 * 
 * ```typescript
 * import { DisbursedAmountDemo } from './services/disbursed-amount-demo';
 * 
 * export class TestComponent {
 *   constructor(private demo: DisbursedAmountDemo) {}
 * 
 *   async ngOnInit() {
 *     // Run all demos
 *     await this.demo.runAllDemos();
 *     
 *     // Or run individual demos
 *     const chartConfig = await this.demo.chartDataDemo();
 *     if (chartConfig) {
 *       this.setupChart(chartConfig);
 *     }
 *   }
 * 
 *   testValidation() {
 *     this.demo.testDateValidation();
 *   }
 * }
 * ```
 * 
 * To run in browser console:
 * ```javascript
 * // Get the demo service from Angular injector
 * const demo = window.ng.getComponent(document.querySelector('app-root')).injector.get(DisbursedAmountDemo);
 * demo.runAllDemos();
 * ```
 */
