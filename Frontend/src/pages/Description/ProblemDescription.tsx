import { useState, useEffect, DragEvent } from 'react';
import { useParams } from 'react-router-dom';
import AceEditor from 'react-ace';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';

import "../../imports/AceBuildImports";
import Languages from '../../constants/Languages';
import Themes from '../../constants/Themes';

import { useAuth } from '../../context/AuthContext';
import * as problemService from '../../services/api/problemService';
import * as submissionService from '../../services/api/submissionService';
import { parseApiError } from '../../utils/errorHandler';
import { ProblemData } from '../../types/problem.types';
import { Submission } from '../../types/submission.types';
import { usePolling } from '../../hooks/usePolling';

type languageSupport = {
    languageName: string,
    value: string
}

type themeStyle = {
    themeName: string,
    value: string
}

function ProblemDescription() {
    const { problemId } = useParams<{ problemId: string }>();
    const { user, isAuthenticated } = useAuth();

    // Problem data
    const [problem, setProblem] = useState<ProblemData | null>(null);
    const [isLoadingProblem, setIsLoadingProblem] = useState(true);
    const [problemError, setProblemError] = useState<string | null>(null);

    // Editor state
    const [activeTab, setActiveTab] = useState('statement');
    const [testCaseTab, setTestCaseTab] = useState('input');
    const [leftWidth, setLeftWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('');
    const [theme, setTheme] = useState('monokai');

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
    const [submissionOutput, setSubmissionOutput] = useState<string>('');

    // Fetch problem on mount
    useEffect(() => {
        if (problemId) {
            fetchProblem();
        }
    }, [problemId]);

    // Update code when problem loads or language changes
    useEffect(() => {
        if (problem) {
            const stub = problem.codeStubs.find(s => s.language === language);
            if (stub) {
                setCode(stub.userSnippet || '');
            }
        }
    }, [problem, language]);

    const fetchProblem = async () => {
        try {
            setIsLoadingProblem(true);
            setProblemError(null);
            const problemData = await problemService.getProblem(problemId!);
            setProblem(problemData);
        } catch (err) {
            const apiError = parseApiError(err);
            setProblemError(apiError.message);
            console.error("Failed to fetch problem:", err);
        } finally {
            setIsLoadingProblem(false);
        }
    };

    // Polling hook for submission status
    const { startPolling, stopPolling, data: submissionStatus } = usePolling(
        async () => {
            if (currentSubmission?._id) {
                return await submissionService.getSubmission(currentSubmission._id);
            }
            return null;
        },
        {
            interval: 2000,
            maxAttempts: 30,
            shouldStopPolling: (data) => {
                return data?.status === 'COMPLETED' || data?.status === 'FAILED';
            },
            onSuccess: (data) => {
                handleSubmissionComplete(data);
            },
            onError: (error) => {
                console.error("Polling error:", error);
                setSubmissionOutput('Error checking submission status');
            }
        }
    );

    const handleSubmission = async () => {
        if (!user || !problem) {
            setSubmitError('Please login to submit code');
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmitError(null);
            setSubmissionOutput('Submitting code...');

            const submission = await submissionService.createSubmission({
                code,
                language,
                userId: user._id,
                problemId: problem._id
            });

            setCurrentSubmission(submission);
            setSubmissionOutput(`Submission created! Status: ${submission.status}`);

            // Start polling for results
            startPolling();
        } catch (error) {
            const apiError = parseApiError(error);
            setSubmitError(apiError.message);
            setSubmissionOutput(`Error: ${apiError.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmissionComplete = (submission: Submission) => {
        stopPolling();
        setCurrentSubmission(submission);

        let output = `\n=== Submission Results ===\n`;
        output += `Status: ${submission.overallStatus || 'PENDING'}\n`;
        output += `Total Test Cases: ${submission.totalTestCases || 0}\n`;
        output += `Passed: ${submission.passedTestCases || 0}\n`;
        output += `Failed: ${submission.failedTestCases || 0}\n`;

        if (submission.executionTime) {
            output += `Execution Time: ${submission.executionTime}ms\n`;
        }

        if (submission.testResults && submission.testResults.length > 0) {
            output += `\n--- Test Results ---\n`;
            submission.testResults.forEach((result, idx) => {
                output += `\nTest ${idx + 1}: ${result.status}\n`;
                if (result.status === 'FAILED') {
                    output += `  Expected: ${result.expectedOutput}\n`;
                    output += `  Got: ${result.actualOutput}\n`;
                }
                if (result.errorMessage) {
                    output += `  Error: ${result.errorMessage}\n`;
                }
            });
        }

        setSubmissionOutput(output);
    };

    const startDragging = (e: DragEvent<HTMLDivElement>) => {
        setIsDragging(true);
        e.preventDefault();
    }

    const stopDragging = () => {
        if (isDragging) {
            setIsDragging(false);
        }
    }

    const onDrag = (e: DragEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        const newLeftWidth = (e.clientX / window.innerWidth) * 100;
        if (newLeftWidth > 10 && newLeftWidth < 90) {
            setLeftWidth(newLeftWidth);
        }
    }

    const isActiveTab = (tabName: string) => {
        if (activeTab === tabName) {
            return 'tab tab-active';
        } else {
            return 'tab'
        }
    }

    const isInputTabActive = (tabName: string) => {
        if (testCaseTab === tabName) {
            return 'tab tab-active';
        } else {
            return 'tab';
        }
    }

    // Loading state
    if (isLoadingProblem) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-57px)]">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="text-lg">Loading problem...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (problemError || !problem) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-57px)]">
                <div className="alert alert-error max-w-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <h3 className="font-bold">Error loading problem</h3>
                        <div className="text-xs">{problemError || 'Problem not found'}</div>
                    </div>
                    <button className="btn btn-sm" onClick={fetchProblem}>Retry</button>
                </div>
            </div>
        );
    }

    const sanitizedMarkdown = DOMPurify.sanitize(problem.description);

    return (
        <div
            className='flex w-screen h-[calc(100vh-57px)]'
            onMouseMove={onDrag}
            onMouseUp={stopDragging}
        >
            <div className='leftPanel h-full overflow-auto' style={{ width: `${leftWidth}%` }}>
                <div role="tablist" className="tabs tabs-boxed w-3/5">
                    <a onClick={() => setActiveTab('statement')} role="tab" className={isActiveTab("statement")}>Problem Statement</a>
                    <a onClick={() => setActiveTab('editorial')} role="tab" className={isActiveTab("editorial")}>Editorial</a>
                    <a onClick={() => setActiveTab('submissions')} role="tab" className={isActiveTab("submissions")}>Submissions</a>
                </div>

                <div className='markdownViewer p-[20px] basis-1/2'>
                    {activeTab === 'statement' && (
                        <div>
                            <h1 className="text-3xl font-bold mb-4">{problem.title}</h1>
                            <span className={`badge ${problem.difficulty === 'easy' ? 'badge-success' :
                                    problem.difficulty === 'medium' ? 'badge-warning' :
                                        'badge-error'
                                }`}>
                                {problem.difficulty.toUpperCase()}
                            </span>
                            <div className="mt-4">
                                <ReactMarkdown rehypePlugins={[rehypeRaw]} className="prose">
                                    {sanitizedMarkdown}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                    {activeTab === 'editorial' && (
                        <ReactMarkdown rehypePlugins={[rehypeRaw]} className="prose">
                            {problem.editorial || 'No editorial available yet.'}
                        </ReactMarkdown>
                    )}
                    {activeTab === 'submissions' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Your Submissions</h2>
                            <p className="text-gray-500">Submission history coming soon...</p>
                        </div>
                    )}
                </div>
            </div>

            <div className='divider cursor-col-resize w-[5px] bg-slate-200 h-full' onMouseDown={startDragging}></div>

            <div className='rightPanel h-full overflow-auto flex flex-col' style={{ width: `${100 - leftWidth}%` }}>
                <div className='flex gap-x-1.5 justify-start items-center px-4 py-2 basis-[5%]'>
                    <div>
                        <button
                            className={`btn btn-success btn-sm ${isSubmitting ? 'loading' : ''}`}
                            onClick={handleSubmission}
                            disabled={isSubmitting || !isAuthenticated}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                    <div>
                        <button className="btn btn-warning btn-sm">Run Code</button>
                    </div>
                    <div>
                        <select
                            className="select select-info w-full select-sm max-w-xs"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            {Languages.map((lang: languageSupport) => (
                                <option key={lang.value} value={lang.value}> {lang.languageName} </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            className="select select-info w-full select-sm max-w-xs"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                        >
                            {Themes.map((t: themeStyle) => (
                                <option key={t.value} value={t.value}> {t.themeName} </option>
                            ))}
                        </select>
                    </div>
                </div>

                {submitError && (
                    <div className="alert alert-error mx-4 mb-2">
                        <span>{submitError}</span>
                    </div>
                )}

                <div className="flex flex-col editor-console grow-[1]">
                    <div className='editorContainer grow-[1]'>
                        <AceEditor
                            mode={language}
                            theme={theme}
                            value={code}
                            onChange={(e: string) => setCode(e)}
                            name='codeEditor'
                            className='editor'
                            style={{ width: '100%' }}
                            setOptions={{
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true,
                                showLineNumbers: true,
                                fontSize: 16
                            }}
                            height='100%'
                        />
                    </div>

                    {/* Console output */}
                    <div className="collapse bg-base-200 rounded-none">
                        <input type="checkbox" className="peer" defaultChecked />
                        <div className="collapse-title bg-primary text-primary-content peer-checked:bg-secondary peer-checked:text-secondary-content">
                            Console
                        </div>
                        <div className="collapse-content bg-primary text-primary-content peer-checked:bg-secondary peer-checked:text-secondary-content">
                            <div role="tablist" className="tabs tabs-boxed w-3/5 mb-4">
                                <a onClick={() => setTestCaseTab('input')} role="tab" className={isInputTabActive('input')}>Input</a>
                                <a onClick={() => setTestCaseTab('output')} role="tab" className={isInputTabActive('output')}>Output</a>
                            </div>

                            {testCaseTab === 'input' ? (
                                <textarea
                                    rows={4}
                                    cols={70}
                                    className='bg-neutral text-white rounded-md resize-none p-2 font-mono'
                                    placeholder="Enter test input here..."
                                />
                            ) : (
                                <pre className='bg-neutral text-white rounded-md p-2 font-mono whitespace-pre-wrap max-h-64 overflow-auto'>
                                    {submissionOutput || 'No output yet. Submit your code to see results.'}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProblemDescription;
