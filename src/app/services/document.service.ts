import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Document {
    id: number;
    loanApplication: {
        id: number;
        status: string;
        userId: number;
        userEmail: string;
        productId: number;
        productName: string;
    };
    documentType: string;
    fileName: string;
    uploadedAt: string;
}

export interface DocumentResponse {
    code: number;
    data: {
        content: Document[];
        pageable: any;
        totalElements: number;
        totalPages: number;
        last: boolean;
        first: boolean;
        empty: boolean;
        numberOfElements: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    getApplicationDocuments(applicationId: number): Observable<DocumentResponse> {
        return this.http.get<DocumentResponse>(`${this.apiUrl}/documents/application?applicationId=${applicationId}`);
    }

    uploadDocument(applicationId: number, documentType: string, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        formData.append('applicationId', applicationId.toString());

        return this.http.post(`${this.apiUrl}/files/upload`, formData);
    }    /**
     * Lưu thông tin document sau khi upload file thành công
     * @param applicationId ID của đơn đăng ký vay
     * @param documentType Loại tài liệu
     * @param fileName Tên file đã upload thành công
     * @returns Observable response từ API
     */
    saveDocument(applicationId: number, documentType: string, fileName: string): Observable<any> {
        const payload = {
            applicationId: applicationId,
            documentType: documentType,
            fileName: fileName
        };
        return this.http.post(`${this.apiUrl}/documents`, payload);
    }

    /**
     * Cập nhật thông tin document sau khi upload file thành công
     * @param applicationId ID của đơn đăng ký vay
     * @param documentType Loại tài liệu
     * @param fileName Tên file đã upload thành công
     * @returns Observable response từ API
     */
    updateDocument(applicationId: number, documentType: string, fileName: string): Observable<any> {
        const payload = {
            applicationId: applicationId,
            documentType: documentType,
            fileName: fileName
        };
        return this.http.patch(`${this.apiUrl}/documents`, payload);
    }

    getDocumentUrl(fileName: string): string {
        return `${this.apiUrl}/uploads/${fileName}`;
    }
}
