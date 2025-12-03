import axiosClient from "@/lib/api/client"
import { githubMetricApi } from "./routes"

export interface GithubRepoDataType {
    forks_count: number
    subscribers_count: number
    stargazers_count: number
    default_branch: number
    git_url: string
    html_url: string
    allow_forking: boolean
    [key: string]: any
}

export async function getGithubDataRequest() {
    try {
        const res = await axiosClient.get(githubMetricApi, {})
        return res.data
    } catch (err: any) {
        return err.response.data || {
            code: 500,
            error: "Update note failed"
        }
    }
}