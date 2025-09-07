import { getUploadPolicy } from '@/features/api/upload'
import { UploadController, UploadEvent, UploadOptions } from '@/lib/upload/type';
import { store } from '@/store'
import * as qiniu from 'qiniu-js'
import * as React from 'react'
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
    url: string;
    key: string;
    raw: any;
}

export enum Status {
    Ready, // 准备好了
    Processing, // 上传中
    Finished, // 任务已结束（完成、失败、中断）
    Error // 任务出错
}



export function useUpload() {
    const uploadSetting = store.getState().settings.system
    const [UploadSate, setUploadSate] = React.useState<Status>(Status.Ready)
    const [uploadTask, setUploadTask] = React.useState<qiniu.UploadTask | null>(null)

    const [error, setError] = React.useState<Error | null>(null)
    const completeInfo = React.useRef<any>(null)
    const [progress, setProgress] = React.useState<Partial<qiniu.Progress> | null>(null)
    const [uploadFile, setUploadFile] = React.useState<File | null>(null)
    const onFinishCallbackRef = React.useRef<((params: any) => void) | null>(null)

    const start = () => {
        if (uploadSetting.storage_driver == 'qiniu') {
            qiniuUpload()
        }
    }

    // 开始上传文件
    const qiniuUpload = () => {
        if (!uploadFile) {
            return
        }

        completeInfo.current = null
        setProgress(null)
        setError(null)

        if (uploadTask) {
            return uploadTask.start()
        }

        const uploadConfig: qiniu.UploadConfig = {
            apiServerUrl: "https://api.qiniu.com", // 七牛云的上传地址
            tokenProvider: async () => {
                let res = await getUploadPolicy()
                return res?.token
            },
        }
        const fileData: qiniu.FileData = {
            type: 'file',
            data: uploadFile,
        }
        const newUploadTask = uploadSetting.forceDirect
            ? qiniu.createDirectUploadTask(fileData, uploadConfig)
            : qiniu.createMultipartUploadV2Task(fileData, uploadConfig)

        newUploadTask.onProgress(progress => {
            setUploadSate(Status.Processing)
            setProgress({ ...progress } as any)
        })

        newUploadTask.onError(error => {
            setUploadSate(Status.Error)
            toast.error("Upload failed")
            setError(error || null)
        })

        newUploadTask.onComplete(result => {
            setUploadSate(Status.Finished)
            completeInfo.current = result || ''
            setUploadFile(null)
            setUploadTask(null)
            onFinishCallbackRef.current?.(result)
        })
        setUploadTask(newUploadTask)
        newUploadTask.start()
    }

    const replaceFile = (file: File, callback: (params: any) => void) => {
        const uuid = uuidv4(); // 生成 UUID
        const extension = file.name.substring(file.name.lastIndexOf('.')); // 提取后缀名
        const newFileName = `${uuid}${extension}`;
        var nFile = new File([file], newFileName, {
            type: file.type,
            lastModified: file.lastModified
        })
        onFinishCallbackRef.current = callback

        setUploadFile(nFile)
    }

    const getFileLink = () => {
        if (uploadSetting.storage_driver == 'qiniu') {
            const parseData = JSON.parse(completeInfo.current)
            if (!parseData) {
                return null
            }
            return `${window.location.protocol}//${uploadSetting.qiniu_domain}/${parseData?.key}`
        }
        return null
    }
    const uploadAndGetUrl = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            replaceFile(file, (result) => {
                if (!result) {
                    reject(new Error("Upload failed"));
                    return;
                }

                if (uploadSetting.storage_driver === 'qiniu') {
                    try {
                        const parseData = JSON.parse(result);
                        const url = `${window.location.protocol}//${uploadSetting.qiniu_domain}/${parseData?.key}`;
                        resolve(url);
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(new Error("Unsupported storage driver"));
                }
            });
        });
    };
    // 停止上传文件
    const stop = () => {
        uploadTask?.cancel()
        setUploadSate(Status.Finished)
    }

    React.useEffect(() => {
        if (uploadFile) {
            start()
        }
    }, [uploadFile])

    return { start, stop, replaceFile, UploadSate, progress, error, completeInfo, getFileLink, uploadAndGetUrl }
}


export function startQiniuUpload(
    file: File,
    domain: string,
    opts: Pick<UploadOptions, 'forceDirect' | 'filename' | 'signal' | 'onProgress' | 'onError' | 'onComplete'>
): UploadController {
    const { forceDirect = false, filename, signal, onProgress, onError, onComplete } = opts;

    const uploadConfig: qiniu.UploadConfig = {
        apiServerUrl: 'https://api.qiniu.com',
        tokenProvider: async () => {
            const res = await getUploadPolicy();
            return res?.token;
        },
    };

    // 生成最终文件名（优先 filename，其次 UUID+原后缀）
    const ext = (() => {
        const idx = file.name.lastIndexOf('.');
        return idx >= 0 ? file.name.substring(idx) : '';
    })();
    const finalName = filename ?? `${uuidv4()}${ext}`;

    // 组装最终 File（改名）
    const finalFile = new File([file], finalName, {
        type: file.type,
        lastModified: file.lastModified,
    });

    const fileData: qiniu.FileData = {
        type: 'file',
        data: finalFile,
    };

    const uploadTask = forceDirect
        ? qiniu.createDirectUploadTask(fileData, uploadConfig)
        : qiniu.createMultipartUploadV2Task(fileData, uploadConfig);

    const subscribers = new Set<(e: UploadEvent) => void>();
    const emit = (e: UploadEvent) => subscribers.forEach(fn => fn(e));

    const promise = new Promise<UploadResult>((resolve, reject) => {
        uploadTask.onProgress(progress => {
            onProgress?.(progress);
            emit({ type: 'progress', progress });
        });

        uploadTask.onError(err => {
            onError?.(err);
            emit({ type: 'error', error: err });
            reject(err);
        });

        uploadTask.onComplete(result => {
            if (!result) {
                const err = new Error('Upload failed');
                onError?.(err);
                emit({ type: 'error', error: err });
                reject(err);
                return;
            }
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            const key = parsed?.key ?? finalName;
            const url = `${window.location.protocol}//${domain}/${key}`;
            const ok: UploadResult = { url, key, raw: parsed };
            onComplete?.(ok);
            emit({ type: 'complete', result: ok });
            resolve(ok);
        });

        // 外部取消
        if (signal) {
            if (signal.aborted) {
                try { uploadTask.cancel?.(); } catch { }
                const err = new DOMException('Aborted', 'AbortError');
                onError?.(err);
                emit({ type: 'error', error: err });
                reject(err);
                return;
            }
            const onAbort = () => {
                try { uploadTask.cancel?.(); } catch { }
                const err = new DOMException('Aborted', 'AbortError');
                onError?.(err);
                emit({ type: 'error', error: err });
                reject(err);
            };
            signal.addEventListener('abort', onAbort, { once: true });
        }

        uploadTask.start();
    });

    return {
        on: (handler) => {
            subscribers.add(handler);
            return () => subscribers.delete(handler);
        },
        cancel: () => {
            try { uploadTask.cancel?.(); } catch { }
        },
        promise,
    };
}