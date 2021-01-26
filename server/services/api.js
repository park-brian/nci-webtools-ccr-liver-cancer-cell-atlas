const express = require('express');
const compression = require('compression');
const sqlite = require('better-sqlite3');
const config = require('../config');
const logger = require('./logger');
const { getSchema, query } = require('./query');

const apiRouter = express.Router();

const database = new sqlite(config.database, {
    verbose: message => logger.debug(message)
});
const schema = getSchema(database);

// parse json requests
apiRouter.use(express.json());

// compress all responses
apiRouter.use(compression());

// add cache-control headers to GET requests
apiRouter.use((request, response, next) => {
    if (request.method === 'GET')
        response.set(`Cache-Control', 'public, max-age=${60 * 60}`);
    next();
});

// healthcheck route
apiRouter.get('/ping', (request, response) => {
    response.json(true)
});

// retrieves schema for all tables
apiRouter.get('/schema', (request, response) => {
    response.json(schema);
});

// handle query submission
apiRouter.get('/query', (request, response) => {
    const params = request.query;
    const results = query(database, params);
    if (params.format === 'csv') {
        response.setHeader('Content-Disposition', `attachment; filename="${params.filename || 'export.csv'}"`);
        let columns = results.columns.filter(column => column !== '_rowid');
        let rows = [columns].concat(results.records.map(record => columns.map(c => record[c])));
        response.end(rows.map(row => row.map(cell => `"${cell}"`).join(",")).join('\r\n'));
    } else {
        response.json(results);
    }
});

module.exports = { apiRouter };