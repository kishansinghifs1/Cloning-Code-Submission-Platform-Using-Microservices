import { Request, Response } from 'express';

// import JavaExecutor from '../containers/javaExecutor';
// import PythonExecutor from '../containers/pythonExecutor';
// import CppExecutor from '../containers/runCpp';
// import { CodeExecutorStrategy } from '../types/types';


import { CreateSubmissionDto } from '../dtos/CreateSubmissionDto';


export function addSubmission(req: Request, res: Response) {
    const submissionDto = req.body as CreateSubmissionDto;
    return res.status(201).json({
        success: true,
        error: {},
        message: 'Successfully collected the submission',
        data: submissionDto
    });
}





//This is just the sample submission controller for testing the correct run of each container 
// export async function sampleSubmission(req: Request, res: Response) {
//     const { code, inputCase, outputCase, language } = req.body;
//     let codeExecutor: CodeExecutorStrategy | null = null;

//     if (language === "CPP") {
//         codeExecutor = new CppExecutor();
//     } else if (language === "PYTHON") {
//         codeExecutor = new PythonExecutor();
//     } else {
//         codeExecutor = new JavaExecutor();
//     }

//     try {
//         const response = await codeExecutor.execute(code, inputCase, outputCase);
//         return res.status(200).json({
//             success: true,
//             data: response
//         });
//     } catch (error) {
//         console.error("Error in sampleSubmission:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Something went wrong",
//             error: error instanceof Error ? error.message : String(error)
//         });
//     }
// }