import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LoanProductListComponent } from './loan-product-list/loan-product-list.component';
import { LoanApplicationFormComponent } from './loan-application-form/loan-application-form.component';
import { ApplicationListComponent } from './application-list/application-list.component';
import { NotificationListComponent } from './notification-list/notification-list.component';
import { ApprovedLoanDetailComponent } from './approved-loan-detail/approved-loan-detail.component';
import { UserProfileComponent } from './user-profile/user-profile.component';

// Import NG-ZORRO modules if needed by borrower components
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@NgModule({
    declarations: [
        LoanProductListComponent,
        LoanApplicationFormComponent,
        ApplicationListComponent,
        NotificationListComponent,
        ApprovedLoanDetailComponent,
        UserProfileComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        // NG-ZORRO modules
        NzButtonModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzCardModule,
        NzModalModule,
        NzSpinModule,
        NzAlertModule
    ], exports: [
        LoanProductListComponent,
        LoanApplicationFormComponent,
        ApplicationListComponent,
        NotificationListComponent,
        ApprovedLoanDetailComponent,
        UserProfileComponent
    ]
})
export class BorrowerPortalModule { }
