import { of } from "rxjs";
import { ReportPayload, ReportProperty } from "../services/reports.service";
import { PdfElement } from "./pdf-element";

export class PdfText extends PdfElement {

    public constructor(
        public property: ReportProperty | string,
    ) { super(); }

    public key = () => "text";

    public label = () => `Texto`;

    public allowedChildElements() {
        return [];
    }

    public build(payload?: ReportPayload) {

        const text = typeof (this.property) === "string" ?
            this.property :
            (this.getProperty(this.property, payload) || this.property.name);

        return of({ text });
    }

}
