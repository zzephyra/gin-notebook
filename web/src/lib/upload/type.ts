export type UploadMethod = 'qiniu' | 'local';

export type UploadFile = {
    name: string;
    size: string;
    uid: string;
    url?: string;
    [key: string]: any;
}


export type UploadResult = {
    url: string;
    key: string;
    raw: any;
};

export type UploadEvent =
    | { type: 'progress'; progress: any }   // 透传 SDK 的进度对象
    | { type: 'error'; error: any }
    | { type: 'complete'; result: UploadResult };


export type UploadController = {
    /** 订阅事件：返回取消订阅函数 */
    on: (handler: (e: UploadEvent) => void) => () => void;
    /** 取消上传（调用 SDK 的 abort） */
    cancel: () => void;
    /** 等待上传完成（resolve: UploadResult；reject: Error） */
    promise: Promise<UploadResult>;
};


export type UploadOptions = {
    file: File;
    accept?: string;          // 例如: "image/*,application/pdf"
    /** 如果不传，将使用系统设置：settings.system.maximun_size（单位 MB，默认 30MB） */
    sizeLimitMB?: number;
    /** 仅当 storage_driver='qiniu' 时需要：不传则从系统设置取 */
    domain?: string;          // 例如 "cdn.xxx.com"
    /**七牛参数*/
    forceDirect?: boolean;    // 直传/分片
    filename?: string;        // 最终文件名（不传则 UUID + 原后缀）
    signal?: AbortSignal;     // 外部取消
    /** 可选：便捷回调（也可用 on() 订阅） */
    onProgress?: (p: any) => void;
    onError?: (err: any) => void;
    onComplete?: (r: UploadResult) => void;
};