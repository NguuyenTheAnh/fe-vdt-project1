import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { registerLocaleData } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import vi from '@angular/common/locales/vi';
import { NZ_I18N, vi_VN } from 'ng-zorro-antd/i18n';
import { NZ_CONFIG, NzConfig } from 'ng-zorro-antd/core/config';
import { ApiInterceptor } from './services/api.interceptor';
import { BorrowerPortalModule } from './borrower-portal/borrower-portal.module';
// Import các module của NG-ZORRO
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { LoginPageComponent } from './login-page/login-page.component';
import { RegisterPageComponent } from './register-page/register-page.component';
import { HomePageComponent } from './borrower-portal/home-page/home-page.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { MainDashboardComponent } from './admin/main-dashboard/main-dashboard.component';
import { UserListDashboardComponent } from './admin/user-list-dashboard/user-list-dashboard.component';
import { LoanProductListDashboardComponent } from './admin/loan-product-list-dashboard/loan-product-list-dashboard.component';
import { LoanApplicationListDashboardComponent } from './admin/loan-application-list-dashboard/loan-application-list-dashboard.component';
import { DisbursementDashboardComponent } from './admin/disbursement-dashboard/disbursement-dashboard.component';
import { ReportDashboardComponent } from './admin/report-dashboard/report-dashboard.component';
import { DisbursementReportComponent } from './admin/report-dashboard/disbursement-report/disbursement-report.component';
import { SystemConfigDashboardComponent } from './admin/system-config-dashboard/system-config-dashboard.component';
import { AdminSidebarComponent } from './layout/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from './layout/admin-header/admin-header.component';
import { RoleDashboardComponent } from './admin/role-dashboard/role-dashboard.component';
import { AccessDeniedComponent } from './admin/access-denied/access-denied.component';
import { ModalContainerComponent } from './layout/modal-container/modal-container.component';
registerLocaleData(vi);

@NgModule({
  declarations: [
    AppComponent,
    LoginPageComponent,
    RegisterPageComponent,
    HomePageComponent,
    PageNotFoundComponent,
    HeaderComponent,
    FooterComponent,
    MainDashboardComponent,
    UserListDashboardComponent,
    LoanProductListDashboardComponent,
    LoanApplicationListDashboardComponent,
    DisbursementDashboardComponent,
    ReportDashboardComponent,
    DisbursementReportComponent,
    SystemConfigDashboardComponent,
    AdminSidebarComponent,
    AdminHeaderComponent, RoleDashboardComponent,
    AccessDeniedComponent,
    ModalContainerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    BorrowerPortalModule,
    // NG-ZORRO modules
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzInputModule,
    NzCheckboxModule,
    NzIconModule,
    NzNotificationModule,
    NzSelectModule,
    NzLayoutModule,
    NzMenuModule,
    NzTableModule,
    NzDropDownModule,
    NzCardModule,
    NzModalModule,
    NzToolTipModule,
    NzTabsModule,
    NzSpinModule,
    NzAlertModule,
    NzBadgeModule,
    NzPopconfirmModule,
    NzDividerModule,
    NzStepsModule, NzPopoverModule,
    NzAvatarModule, NzUploadModule,
    NzMessageModule, NzSliderModule,
    NzRadioModule,
    NzSwitchModule,
    NzPaginationModule
  ],
  providers: [
    { provide: NZ_I18N, useValue: vi_VN },
    {
      provide: NZ_CONFIG,
      useValue: {
        notification: {
          nzTop: 24, // Khoảng cách từ trên xuống
          nzMaxStack: 7, // Số thông báo tối đa hiển thị
          nzZIndex: 9999 // z-index cao để hiển thị trên header
        }
      } as NzConfig
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
