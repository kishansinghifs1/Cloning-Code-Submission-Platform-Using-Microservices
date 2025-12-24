import { PYTHON_IMAGE } from '../utils/constants';
import { AbstractExecutor } from './AbstractExecutor';


class PythonExecutor extends AbstractExecutor {
    protected imageName = PYTHON_IMAGE;

    protected fetchCommand(code: string, inputTestCase: string): string {
        return `echo '${code.replace(/'/g, "'\\''")}' > test.py && echo '${inputTestCase.replace(/'/g, "'\\''")}' | python3 test.py`;
    }
}

export default PythonExecutor;