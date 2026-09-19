import morgan from 'morgan';

// Formatted HTTP logger
export const httpLogger = morgan(':method :url :status :res[content-length] - :response-time ms');
