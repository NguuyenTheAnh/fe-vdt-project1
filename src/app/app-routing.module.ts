import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './borrower-portal/home-page/home-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { RegisterPageComponent } from './register-page/register-page.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { LoanProductListComponent } from './borrower-portal/loan-product-list/loan-product-list.component';
import { LoanApplicationFormComponent } from './borrower-portal/loan-application-form/loan-application-form.component';
import { ApplicationListComponent } from './borrower-portal/application-list/application-list.component';
import { NotificationListComponent } from './borrower-portal/notification-list/notification-list.component';
import { ApprovedLoanDetailComponent } from './borrower-portal/approved-loan-detail/approved-loan-detail.component';
import { UserProfileComponent } from './borrower-portal/user-profile/user-profile.component';
import { AuthGuard } from './guards/auth.guard';
import { ApplicationDetailComponent } from './borrower-portal/application-detail/application-detail.component';
import { MainDashboardComponent } from './admin/main-dashboard/main-dashboard.component';
import { UserListDashboardComponent } from './admin/user-list-dashboard/user-list-dashboard.component';
import { LoanProductListDashboardComponent } from './admin/loan-product-list-dashboard/loan-product-list-dashboard.component';
import { LoanApplicationListDashboardComponent } from './admin/loan-application-list-dashboard/loan-application-list-dashboard.component';
import { DisbursementDashboardComponent } from './admin/disbursement-dashboard/disbursement-dashboard.component';
import { ReportDashboardComponent } from './admin/report-dashboard/report-dashboard.component';
import { SystemConfigDashboardComponent } from './admin/system-config-dashboard/system-config-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  {
    path: 'borrower-portal', canActivate: [AuthGuard], children: [
      { path: 'loan-product-list', component: LoanProductListComponent },
      { path: 'loan-application-form', component: LoanApplicationFormComponent },
      { path: 'application-list', component: ApplicationListComponent },
      { path: 'application-list/:id', component: ApplicationDetailComponent },
      { path: 'notification-list', component: NotificationListComponent },
      { path: 'approved-loan-detail', component: ApprovedLoanDetailComponent },
      { path: 'user-profile', component: UserProfileComponent }]
  },
  {
    path: 'admin', canActivate: [AuthGuard], children: [
      { path: 'main-dashboard', component: MainDashboardComponent },
      { path: 'user-list', component: UserListDashboardComponent },
      { path: 'loan-product-list', component: LoanProductListDashboardComponent },
      { path: 'loan-application-list', component: LoanApplicationListDashboardComponent },
      { path: 'disbursement', component: DisbursementDashboardComponent },
      { path: 'report', component: ReportDashboardComponent },
      { path: 'system-config', component: SystemConfigDashboardComponent },
    ]
  },
  { path: '404', component: PageNotFoundComponent },
  { path: '**', redirectTo: '/404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
