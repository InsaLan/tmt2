export type SqlAttribute = {
	name: string;
	type: string;
	constraints?: string;
};

export class TableSchema {
	/*
	 * Represents a table in a SQL database.
	 */
	tableName: string;
	attributes: SqlAttribute[];
	primaryKey?: string[];
	tableConstraints?: string[];

	constructor(
		tableName: string,
		attributes: SqlAttribute[],
		primaryKey?: string[],
		tableConstraints?: string[]
	) {
		this.tableName = tableName;
		this.attributes = attributes;
		this.primaryKey = primaryKey;
		this.tableConstraints = tableConstraints;
	}

	generateCreateTableParameters(): string {
		/*
		 * Generates the parameters for a CREATE TABLE SQL statement.
		 */
		const attributes = this.attributes
			.map((att) => `${att.name} ${att.type}${att.constraints ? ` ${att.constraints}` : ''}`)
			.join(', ');

		const primaryKeyDefinition = this.primaryKey
			? `, PRIMARY KEY (${this.primaryKey.join(', ')})`
			: '';

		const tableConstraintsDefinition =
			this.tableConstraints && this.tableConstraints.length > 0
				? `, ${this.tableConstraints.join(', ')}`
				: '';

		return `${this.tableName} (${attributes}${primaryKeyDefinition}${tableConstraintsDefinition});`;
	}
}
