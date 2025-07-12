export type UploadMethod = 'qiniu' | 'local';

export type UploadFile = {
    name: string;
    size: string;
    uid: string;
    url?: string;
    [key: string]: any;
}

export interface UploadOptions {
    method: UploadMethod;
    sizeLimit?: number; // Optional size limit in bytes
    file: File;
    domain?: string; // For Qiniu, the domain to access the file
    accept?: string; // File type to accept, e.g., 'image/*', 'video/*', etc.
}