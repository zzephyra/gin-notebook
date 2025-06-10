import { getUploadPolicy } from '@/features/api/upload'
import { store } from '@/store'
import * as qiniu from 'qiniu-js'
import * as React from 'react'
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

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
        console.log("上传文件", uploadFile)
        if (!uploadFile) {
            return
        }

        completeInfo.current = null
        setProgress(null)
        setError(null)

        if (uploadTask) {
            console.log("正在上传中")
            return uploadTask.start()
        }

        const uploadConfig: qiniu.UploadConfig = {
            apiServerUrl: "https://api.qiniu.com", // 七牛云的上传地址
            tokenProvider: async () => {
                let res = await getUploadPolicy()
                return res?.token
            },
        }
        console.log("获取上传配置", uploadConfig)
        const fileData: qiniu.FileData = {
            type: 'file',
            data: uploadFile,
        }
        console.log("获取文件数据", fileData)
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
            console.log("上传完成", result)
            completeInfo.current = result || ''
            setUploadFile(null)
            setUploadTask(null)
            onFinishCallbackRef.current?.(result)
        })
        console.log("获取上传任务", newUploadTask)
        setUploadTask(newUploadTask)
        console.log("开始上传文件", uploadFile)
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

    return { start, stop, replaceFile, UploadSate, progress, error, completeInfo, getFileLink }
}