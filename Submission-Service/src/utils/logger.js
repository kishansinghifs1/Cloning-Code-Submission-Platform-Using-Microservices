class Logger {
    constructor(context = 'SubmissionService') {
        this.context = context;
    }

    log(message, data = null) {
        this._log('INFO', message, data);
    }

    info(message, data = null) {
        this._log('INFO', message, data);
    }

    warn(message, data = null) {
        this._log('WARN', message, data);
    }

    error(message, error = null, data = null) {
        this._log('ERROR', message, { error, ...data });
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            this._log('DEBUG', message, data);
        }
    }

    _log(level, message, data) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            context: this.context,
            message,
            ...(data && { data })
        };

        if (level === 'ERROR') {
            console.error(JSON.stringify(logEntry));
        } else if (level === 'WARN') {
            console.warn(JSON.stringify(logEntry));
        } else {
            console.log(JSON.stringify(logEntry));
        }
    }
}

module.exports = Logger;
