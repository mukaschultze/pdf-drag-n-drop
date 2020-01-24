import { map } from "rxjs/operators";
import { ReportPayload } from "../services/reports.service";
import { PdfImage } from "./image";
import { PdfElement } from "./pdf-element";
import { PdfText } from "./text";

export class PdfList extends PdfElement {

    public key = () => "ol";

    public label = () => `Lista com ${this.children.length} elementos`;

    public allowedChildElements() {
        return [
            PdfText,
            PdfImage,
        ];
    }

    public build(payload?: ReportPayload) {
        return this.getBuildedChildren(payload).pipe(
            map((children) => ({ ol: children })),
        );
    }

}
