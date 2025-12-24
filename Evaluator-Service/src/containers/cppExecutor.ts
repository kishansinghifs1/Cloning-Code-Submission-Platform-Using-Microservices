import { CPP_IMAGE } from '../utils/constants';
import { AbstractExecutor } from './AbstractExecutor';


class CppExecutor extends AbstractExecutor {
    protected imageName = CPP_IMAGE;

    protected fetchCommand(code: string, inputTestCase: string): string {
        return `echo '${code.replace(/'/g, "'\\''")}' > main.cpp && g++ main.cpp -o main && echo '${inputTestCase.replace(/'/g, "'\\''")}' | ./main`;
    }
}

export default CppExecutor;
