import { GithubRepoDataType } from "@/features/api/metrics";
import { createContext, useContext } from "react";

export const GithubDataContext = createContext<GithubRepoDataType | null>(null);

export const useGithubData = () => useContext(GithubDataContext);
