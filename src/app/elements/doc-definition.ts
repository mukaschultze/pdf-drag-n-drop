import { TDocumentDefinitions } from "pdfmake/build/pdfmake";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ReportPayload } from "../services/reports.service";
import { PdfContent } from "./content";
import { PdfElement } from "./pdf-element";

export class DocDefinition extends PdfElement {

    public key = () => "root";

    public label = () => "PDF";

    public allowedChildElements() {
        return [
            PdfContent,
        ];
    }

    public build(payload?: ReportPayload): Observable<TDocumentDefinitions> {
        return this.getBuildedChildren(payload).pipe(
            map((children) => children.reduce((acc, val) => ({
                ...acc,
                ...val,
            }), {}) as TDocumentDefinitions),
        );
    }

}
