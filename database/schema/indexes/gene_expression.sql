create index `malignant_cell_gene_expression_$GENE__malignant_cell_id` 
    on `malignant_cell_gene_expression_$GENE`(`malignant_cell_id`);

create index `nonmalignant_cell_gene_expression_$GENE__nonmalignant_cell_id` 
    on `nonmalignant_cell_gene_expression_$GENE`(`nonmalignant_cell_id`);

create index `t_cell_gene_expression_$GENE__t_cell_id` 
    on `t_cell_gene_expression_$GENE`(`t_cell_id`);
