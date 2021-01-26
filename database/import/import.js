const assert = require('assert');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const sqlite = require('better-sqlite3');
const csvReader = require('csv-reader');
const { 
    databaseFilepath, 
    malignantCellsFilepath, 
    nonmalignantCellsFilepath, 
    tCellsFilepath 
} = require('minimist')(
    process.argv.slice(2), 
    {
        alias: {
            'database-file': 'databaseFilepath',
            'malignant-cells-file': 'malignantCellsFilepath',
            'nonmalignant-cells-file': 'nonmalignantCellsFilepath',
            't-cells-file': 'tCellsFilepath',
            'df': 'databaseFilepath',
            'mcf': 'malignantCellsFilepath',
            'ncf': 'nonmalignantCellsFilepath',
            'tcf': 'tCellsFilepath',
        }
    }
);

if (!(
    databaseFilepath && 
    malignantCellsFilepath && 
    nonmalignantCellsFilepath && 
    tCellsFilepath 
)) {
    console.log(`Usage: node import.js
        --df  | --database-file "filepath"
        --mcf | --malignant-cells-file "filepath"
        --ncf | --nonmalignant-cells-file "filepath"
        --tcf | --t-cells-file "filepath"
    `);
    process.exit(1);
}

(async function main() {
    await loadFiles({ databaseFilepath, malignantCellsFilepath, nonmalignantCellsFilepath, tCellsFilepath });
    process.exit(0);
})();

function createTimestamp(formatter = v => `${v / 1000}s`) {
    const startTime = new Date().getTime();
    let checkpointTime = new Date().getTime();
    return () => {
        const now = new Date().getTime();
        const times = [now - startTime, now - checkpointTime];
        checkpointTime = now;
        return times.map(formatter);
    }
}

async function loadFiles({ databaseFilepath, malignantCellsFilepath, nonmalignantCellsFilepath, tCellsFilepath }) {
    if (fs.existsSync(databaseFilepath))
        fs.unlinkSync(databaseFilepath);

    const getTimestamp = createTimestamp();
    const db = new sqlite(databaseFilepath);
    const mainTablesSql = await fsp.readFile(path.resolve(__dirname, '../schema/tables/main.sql'), 'utf-8');
    const mainIndexesSql = await fsp.readFile(path.resolve(__dirname, '../schema/indexes/main.sql'), 'utf-8');

    db.exec('BEGIN TRANSACTION');
    db.exec(mainTablesSql);

    const files = [
        {
            filepath: malignantCellsFilepath,
            expectedHeaders: ['dim1', 'dim2', 'ident'],
            insertStmt: db.prepare(`
                insert into malignant_cell("id", "x", "y", "case") 
                values (?, ?, ?, ?)
            `),
            insertGeneExpressionStmt: db.prepare(`
                insert into malignant_cell_gene_expression("malignant_cell_id", "gene", "value") 
                values (?, ?, ?)
            `),
            insertGeneCountStmt: db.prepare(`
                insert into malignant_cell_gene_count("gene", "count") 
                select gene, count(*) from malignant_cell_gene_expression
                where value > 0
                group by gene
            `),
        },
        {
            filepath: nonmalignantCellsFilepath,
            expectedHeaders: ['dim1', 'dim2', 'cellType_7types'],
            insertStmt: db.prepare(`
                insert into nonmalignant_cell("id", "x", "y", "type") 
                values (?, ?, ?, ?)
            `),
            insertGeneExpressionStmt: db.prepare(`
                insert into nonmalignant_cell_gene_expression("nonmalignant_cell_id", "gene", "value") 
                values (?, ?, ?)
            `),
            insertGeneCountStmt: db.prepare(`
                insert into nonmalignant_cell_gene_count("gene", "count") 
                select gene, count(*) from nonmalignant_cell_gene_expression
                where value > 0
                group by gene
            `),
        },
        {
            filepath: tCellsFilepath,
            expectedHeaders: ['dim1', 'dim2', 'cellType'],
            insertStmt: db.prepare(`
                insert into t_cell("id", "x", "y", "type") 
                values (?, ?, ?, ?)
            `),
            insertGeneExpressionStmt: db.prepare(`
                insert into t_cell_gene_expression("t_cell_id", "gene", "value") 
                values (?, ?, ?)
            `),
            insertGeneCountStmt: db.prepare(`
                insert into t_cell_gene_count("gene", "count") 
                select gene, count(*) from t_cell_gene_expression
                where value > 0
                group by gene
            `),
        },
    ];

    for (const {filepath, expectedHeaders, insertStmt, insertGeneExpressionStmt, insertGeneCountStmt} of files) {
        const csvStream = fs.createReadStream(filepath, 'utf8').pipe(new csvReader());
        let id = 0;
        let genes = [];

        console.log(`[${getTimestamp()}] Started import: ${filepath}`);

        for await (const line of csvStream) {
            const headerValues = line.slice(0, expectedHeaders.length);
            const geneValues = line.slice(expectedHeaders.length);

            if (id === 0) {
                genes = geneValues;
                assert.deepStrictEqual(headerValues, expectedHeaders);
            } else {
                insertStmt.run([id, ...headerValues]);
                for (let i = 0; i < genes.length; i ++)
                    insertGeneExpressionStmt.run([id, genes[i], geneValues[i]])
            }

            if (id % 1e2 === 0)
                console.log(`[${getTimestamp()}] Imported ${id} records`);
            
            id++;
        }
        
        console.log(`[${getTimestamp()}] Imported ${id} records, calculating counts`);
        insertGeneCountStmt.run();

        console.log(`[${getTimestamp()}] Calculated counts, finished import: ${filepath}\n`);
    }

    console.log(`[${getTimestamp()}] Imported all records, creating indexes`);
    db.exec(mainIndexesSql);

    console.log(`[${getTimestamp()}] Finished all imports`);

    db.exec('COMMIT');
}
