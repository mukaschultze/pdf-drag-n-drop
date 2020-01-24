import { map } from "rxjs/operators";
import { ReportPayload } from "../services/reports.service";
import { PdfElement } from "./pdf-element";
import { PdfTableColumn } from "./table-col";
import { PdfTableRow } from "./table-row";

export class PdfTable extends PdfElement {

    public constructor(content: PdfElement[][]) {
        super();

        for (const row of content) {
            const rowElement = new PdfTableRow();
            this.children.push(rowElement);
            for (const col of row) {
                const colElement = new PdfTableColumn();

                rowElement.children.push(colElement);
                colElement.children.push(col);
            }
        }

    }

    public key = () => "table";

    public label = () => `Tabela ${this.rowCount()}x${this.columnCount()}`;

    public allowedChildElements() {
        return [
            PdfTableRow,
        ];
    }

    public build(payload?: ReportPayload) {
        return this.getBuildedChildren(payload).pipe(
            map((children) => ({ table: { body: children } })),
        );
    }

    private rowCount = () => this.children.length;
    private columnCount = () => Math.max(...this.children.map((c) => c.children.length));

}
