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
      { path: 'notification-list', component: NotificationListComponent },
      { path: 'approved-loan-detail', component: ApprovedLoanDetailComponent },
      { path: 'user-profile', component: UserProfileComponent }]
  },
  { path: '404', component: PageNotFoundComponent },
  { path: '**', redirectTo: '/404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
