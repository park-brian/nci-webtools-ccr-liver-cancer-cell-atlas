drop table if exists "malignant_cell";
create table "malignant_cell"
(
    "id" integer primary key autoincrement, 
    "x" double, 
    "y" double, 
    "case" text
);

drop table if exists "nonmalignant_cell";
create table "nonmalignant_cell"
(
    "id" integer primary key autoincrement, 
    "x" double, 
    "y" double, 
    "type" text
);

drop table if exists "t_cell";
create table "t_cell"
(
    "id" integer primary key autoincrement, 
    "x" double, 
    "y" double, 
    "type" text
);

drop table if exists "malignant_cell_gene_expression";
create table "malignant_cell_gene_expression"
(
    "id" integer primary key autoincrement, 
    "malignant_cell_id" bigint,
    "gene" text,
    "value" double
);

drop table if exists "nonmalignant_cell_gene_expression";
create table "nonmalignant_cell_gene_expression"
(
    "id" integer primary key autoincrement, 
    "nonmalignant_cell_id" bigint,
    "gene" text,
    "value" double
);

drop table if exists "t_cell_gene_expression";
create table "t_cell_gene_expression"
(
    "id" integer primary key autoincrement, 
    "t_cell_id" bigint,
    "gene" text,
    "value" double
);

drop table if exists "malignant_cell_gene_count";
create table "malignant_cell_gene_count"
(
    "id" integer primary key autoincrement, 
    "gene" text,
    "count" int
);

drop table if exists "nonmalignant_cell_gene_count";
create table "nonmalignant_cell_gene_count"
(
    "id" integer primary key autoincrement, 
    "gene" text,
    "count" int
);

drop table if exists "t_cell_gene_count";
create table "t_cell_gene_count"
(
    "id" integer primary key autoincrement, 
    "gene" text,
    "count" int
);
