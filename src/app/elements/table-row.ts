import { ReportPayload } from "../services/reports.service";
import { PdfColumns } from "./columns";
import { PdfElement } from "./pdf-element";

export class PdfTableRow extends PdfElement {

    public key = () => "table-row";

    public label = () => `Linha`;

    public allowedChildElements() {
        return [
            PdfColumns,
        ];
    }

    public build(payload?: ReportPayload) {
        return this.getBuildedChildren(payload);
    }

}
