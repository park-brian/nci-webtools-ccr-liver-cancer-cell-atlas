create index "malignant_cell__case" on "malignant_cell"("case");
create index "nonmalignant_cell__type" on "nonmalignant_cell"("type");
create index "t_cell__type" on "t_cell"("type");

create index "malignant_cell_gene_expression__gene" on "malignant_cell_gene_expression"("gene");
create index "nonmalignant_cell_gene_expression__gene" on "nonmalignant_cell_gene_expression"("gene");
create index "t_cell_gene_expression__gene" on "t_cell_gene_expression"("gene");

create index "malignant_cell_gene_count__gene" on "malignant_cell_gene_count"("gene");
create index "malignant_cell_gene_count__count" on "malignant_cell_gene_count"("count");

create index "nonmalignant_cell_gene_count__gene" on "nonmalignant_cell_gene_count"("gene");
create index "nonmalignant_cell_gene_count__count" on "nonmalignant_cell_gene_count"("count");

create index "t_cell_gene_count__gene" on "t_cell_gene_count"("gene");
create index "t_cell_gene_count__count" on "t_cell_gene_count"("count");