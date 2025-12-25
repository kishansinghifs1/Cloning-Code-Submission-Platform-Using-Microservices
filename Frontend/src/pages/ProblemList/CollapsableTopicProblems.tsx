import { Link } from 'react-router-dom';
import { ProblemData } from "../../types/problem.types";

function CollapsableTopicProblem({ topicName, problems }: { topicName: string, problems: ProblemData[] }) {
    return (
        <div className="collapse bg-stone-700 my-4 px-2">
            <input type="radio" name="my-accordion-1" />
            <div className="collapse-title text-xl font-medium flex justify-between">
                <div>
                    {topicName}
                </div>
                <div>
                    <progress className="progress w-56" value={Math.round(Math.random() * 100)} max="100"></progress>
                </div>
            </div>
            <div className="collapse-content">
                <div className="flex flex-col gap-2">
                    {problems.map((problem: ProblemData) => (
                        <Link
                            key={problem._id}
                            to={`/problems/${problem._id}`}
                            className="flex justify-between items-center p-2 hover:bg-base-200 rounded transition-colors"
                        >
                            <span>{problem.title}</span>
                            <span className={`badge badge-sm ${problem.difficulty === 'easy' ? 'badge-success' :
                                    problem.difficulty === 'medium' ? 'badge-warning' :
                                        'badge-error'
                                }`}>
                                {problem.difficulty}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default CollapsableTopicProblem;