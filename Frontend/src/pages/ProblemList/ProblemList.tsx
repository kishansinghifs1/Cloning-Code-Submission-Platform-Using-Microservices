import { useEffect, useState } from "react";
import CollapsableTopicProblem from "./CollapsableTopicProblems";
import { ProblemData } from "../../types/problem.types";
import * as problemService from "../../services/api/problemService";
import { parseApiError } from "../../utils/errorHandler";

type Topic = {
    topic: string;
    topicId: string;
    problems: ProblemData[];
}

function ProblemList() {
    const [problemsByTopic, setProblemsByTopic] = useState<Topic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProblems();
    }, []);

    const fetchProblems = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const problems = await problemService.getAllProblems();

            // Group problems by topic/category
            const grouped = groupProblemsByTopic(problems);
            setProblemsByTopic(grouped);
        } catch (err) {
            const apiError = parseApiError(err);
            setError(apiError.message);
            console.error("Failed to fetch problems:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const groupProblemsByTopic = (problems: ProblemData[]): Topic[] => {
        const topicMap = new Map<string, ProblemData[]>();

        problems.forEach(problem => {
            // Group by difficulty since category/topic doesn't exist in schema
            const topic = problem.difficulty ? problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1) : "General";
            if (!topicMap.has(topic)) {
                topicMap.set(topic, []);
            }
            topicMap.get(topic)?.push(problem);
        });

        return Array.from(topicMap.entries()).map(([topic, probs]) => ({
            topic,
            topicId: topic.toLowerCase().replace(/\s+/g, '-'),
            problems: probs
        }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center w-[100vw] h-[calc(100vh-57px)]">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="text-lg">Loading problems...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center w-[100vw] h-[calc(100vh-57px)]">
                <div className="alert alert-error max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 className="font-bold">Error loading problems</h3>
                        <div className="text-xs">{error}</div>
                    </div>
                    <button className="btn btn-sm" onClick={fetchProblems}>Retry</button>
                </div>
            </div>
        );
    }

    if (problemsByTopic.length === 0) {
        return (
            <div className="flex justify-center items-center w-[100vw] h-[calc(100vh-57px)]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">No problems available</h2>
                    <p className="text-gray-500">Check back later for new problems!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center w-[100vw]">
            <div className="topic-list flex flex-col w-[60%] mt-4">
                {problemsByTopic.map((topic: Topic) =>
                    <CollapsableTopicProblem
                        topicName={topic.topic}
                        key={topic.topicId}
                        problems={topic.problems}
                    />
                )}
            </div>
        </div>
    );
}

export default ProblemList;