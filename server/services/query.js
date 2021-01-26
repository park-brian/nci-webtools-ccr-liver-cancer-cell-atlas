
function getSchema(database) {
    // enable read-only mode
    database.pragma('query_only = ON');

    const tables = database.prepare(
        `SELECT tbl_name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY tbl_name ASC`
    ).raw().all();

    return tables.map(table => ({
        table,
        columns: database.prepare(
            `pragma table_info('${table}')`
        ).all()
    }));
}

function query(database, params) {
    // enable read-only mode
    database.pragma('query_only = ON');

    let { table, offset, limit, order, orderBy, columns } = params;

    // validate provided table
    const isValidTable = database.prepare(
        `SELECT COUNT(*) FROM sqlite_master
        WHERE tbl_name = :table AND type = 'table'`
    ).pluck().get({ table }) === 1;

    if (!table || !isValidTable)
        throw new Error('Please provide a valid table to search within');

    // retrieve column metadata
    const columnNames = database.prepare(
        `pragma table_info('${table}')`
    ).all().map(c => c.name);

    // determine filters
    const filters = Object.entries(params)
        .filter(([key]) => key.startsWith('_'))
        .map(([_key, value]) => {
            // {'column:filter_type': value}
            const [key, type] = _key.split(':');
            return [key.replace(/^_/, ''), value, type || 'eq'];
        })
        .filter(([key]) => columnNames.includes(key));

    // map filters to an object containing {placeholder: value} props
    let queryParams = {};
    filters.forEach(([key, value, type]) => {
        if (type === 'like') {
            queryParams[`${key}_${type}`] = `%${value}%`;
        } else if (['in', 'between'].includes(type)) {
            value.split(',').forEach((val, i) => 
                queryParams[`${key}_${type}_${i}`] = val);
        } else {
            queryParams[`${key}_${type}`] = value;
        }
    });

    console.log(queryParams);
    console.log(filters);

    // columns, table, order, and orderBy must be sanitized/validated
    // since thbey can not be bound parameters
    columns = !columns
        ? columnNames
        : columns.split(',')
            .map(s => s.trim())
            .filter(column => columnNames.includes(column));

    if (!/^(asc|desc)$/i.test(order))
        order = 'asc';

    if (!columnNames.includes(orderBy))
        orderBy = columns[0];

    offset = +offset || 0;
    limit = +limit || 100;

    let conditions = filters.length
        ? `WHERE ${filters.map(([key, value, type]) => `
                ${key} 
                ${{ // operator
                    like: 'LIKE',
                    between: 'BETWEEN',
                    in: 'IN',
                    eq: '=',
                    gt: '>',
                    gte: '>=',
                    lt: '<',
                    lte: '<=',
                }[type] || '='} 
                ${{ // placeholder
                    in: `(${value.split(',').map((_, i) => `:${key}_${type}_${i}`)})`,
                    between: value.split(',').map((_, i) => `:${key}_${type}_${i}`).join(' AND ')
                }[type] || `:${key}_${type}`}
            `).join(' AND ')}`
        : '';

    const queryColumns = columns.map(c => `"${c}"`).join(',');

    console.log(`SELECT DISTINCT ${queryColumns}
    FROM ${table} ${conditions}
    ORDER BY ${orderBy} ${order}
    LIMIT :limit
    OFFSET :offset`)
    const statement = database.prepare(
        `SELECT DISTINCT ${queryColumns}
        FROM ${table} ${conditions}
        ORDER BY ${orderBy} ${order}
        LIMIT :limit
        OFFSET :offset`
    );

    return {
        orderBy,
        order,
        offset,
        limit,
        filters: Object.fromEntries(filters.map(([key, value, type]) => 
            [`_${key}:${type}`, value])),
        columns: statement
            .columns()
            .map(c => c.name),
        count: database
            .prepare(`SELECT COUNT(*) FROM (
                SELECT DISTINCT ${queryColumns} FROM ${table} ${conditions}
            )`)
            .pluck()
            .get(queryParams),
        records: statement
            .all({ offset, limit, ...queryParams }),
    };
}

module.exports = {
    getSchema,
    query,
}