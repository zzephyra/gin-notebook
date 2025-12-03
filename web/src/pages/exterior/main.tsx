import { AISection } from "@/components/exterior/ai-section/main";
import { CollaborationSection } from "@/components/exterior/collaborate/main";
import { Features } from "@/components/exterior/feature/main";
import { Footer } from "@/components/exterior/footer/main";
import { Hero } from "@/components/exterior/hero/main";
import { Navbar } from "@/components/exterior/navbar/main";
import { OpenSourceSection } from "@/components/exterior/open-source.tsx/main";
import { GithubDataContext } from "@/contexts/GithubContent";
import { getGithubDataRequest, GithubRepoDataType } from "@/features/api/metrics";
import { useEffect, useState } from "react";

export default function HomePage() {
    var [githubData, setGithubData] = useState<GithubRepoDataType | null>(null);
    useEffect(() => {
        getGithubDataRequest().then(res => {
            setGithubData(res.data);
        })
    }, []);

    return (
        <main className="min-h-screen bg-background">
            <GithubDataContext.Provider value={githubData}>
                <Navbar />
                <Hero />
                <Features />
                <AISection />
                <CollaborationSection />
                <OpenSourceSection />
                <Footer />
            </GithubDataContext.Provider>
        </main>
    );
}