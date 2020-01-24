import { map, tap } from "rxjs/operators";
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

    public build() {
        return this.getBuildedChildren().pipe(
            tap((t) => console.log(t)),
            map((children) => ({ table: { body: children } })),
        );
        // return this.getBuildedChildren().pipe(
        //     map((children) => [
        //         { text: this.text },
        //         ...children,
        //     ]),
        // );
    }

    // public constructor(    ) { super(); }

    private rowCount = () => this.children.length;
    private columnCount = () => Math.max(...this.children.map((c) => c.children.length));

}
