import { map } from "rxjs/operators";
import { ReportPayload } from "../services/reports.service";
import { PdfImage } from "./image";
import { PdfElement } from "./pdf-element";
import { PdfText } from "./text";

export class PdfColumns extends PdfElement {

    public key = () => "columns";

    public label = () => `${this.children.length} Colunas`;

    public allowedChildElements() {
        return [
            PdfText,
            PdfImage,
        ];
    }

    public build(payload?: ReportPayload) {
        return this.getBuildedChildren(payload).pipe(
            map((columns) => ({ columns })),
        );

    }

}
