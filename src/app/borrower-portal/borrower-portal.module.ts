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
import { ApplicationDetailComponent } from './application-detail/application-detail.component';

// Import NG-ZORRO modules if needed by borrower components
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

@NgModule({
    declarations: [
        LoanProductListComponent,
        LoanApplicationFormComponent,
        ApplicationListComponent,
        NotificationListComponent,
        ApprovedLoanDetailComponent,
        UserProfileComponent,
        ApplicationDetailComponent
    ], imports: [
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
        NzAlertModule,
        NzPaginationModule,
        NzIconModule,
        NzDropDownModule,
        NzSliderModule,
        NzMessageModule,
        NzUploadModule,
        NzToolTipModule,
        NzBadgeModule], exports: [
            LoanProductListComponent,
            LoanApplicationFormComponent,
            ApplicationListComponent,
            NotificationListComponent,
            ApprovedLoanDetailComponent,
            UserProfileComponent,
            ApplicationDetailComponent
        ]
})
export class BorrowerPortalModule { }
