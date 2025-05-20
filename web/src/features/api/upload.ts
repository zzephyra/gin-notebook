import axiosClient from '@/lib/api/client'
import { uploadPolicyApi } from './routes'
import { responseCode } from '../constant/response'
import toast from 'react-hot-toast'
import { store } from '@/store'

export async function getUploadPolicy() {
    try {
        let res = await axiosClient.get(uploadPolicyApi)
        if (res.data.code == responseCode.SUCCESS) {
            return res.data.data
        } else {
            return {}
        }
    } catch (e) {
        toast.error('Get upload policy failed')
        return {}
    }
}
