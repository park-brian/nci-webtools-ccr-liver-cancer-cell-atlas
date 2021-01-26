drop table if exists `malignant_cell_gene_expression_$GENE`;
create table `malignant_cell_gene_expression_$GENE`
(
    id bigint, 
    malignant_cell_id bigint,
    value double
);

drop table if exists `nonmalignant_cell_gene_expression_$GENE`;
create table `nonmalignant_cell_gene_expression_$GENE`
(
    id bigint, 
    nonmalignant_cell_id bigint,
    value double
);

drop table if exists `t_cell_gene_expression_$GENE`;
create table `t_cell_gene_expression_$GENE`
(
    id bigint, 
    t_cell_id bigint,
    value double
);