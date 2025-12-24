import { JAVA_IMAGE } from '../utils/constants';
import { AbstractExecutor } from './AbstractExecutor';

class JavaExecutor extends AbstractExecutor {
    protected imageName = JAVA_IMAGE;

    protected fetchCommand(code: string, inputTestCase: string): string {
        return `echo '${code.replace(/'/g, "'\\''")}' > Main.java && javac Main.java && echo '${inputTestCase.replace(/'/g, "'\\''")}' | java Main`;
    }
}

export default JavaExecutor;