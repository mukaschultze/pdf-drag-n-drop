import { from } from "rxjs";
import { defaultIfEmpty, map, mergeMap, toArray } from "rxjs/operators";
import { ReportPayload, ReportProperty } from "../services/reports.service";
import { PdfImage } from "./image";
import { PdfList } from "./list";
import { PdfElement } from "./pdf-element";
import { PdfText } from "./text";

export class PdfFor extends PdfElement {

    constructor(
        private arrayProp: ReportProperty,
    ) { super(); }

    public key = () => "for";

    public label = () => `Loop de "${this.arrayProp.name}"`;

    public allowedChildElements() {
        return [
            PdfText,
            PdfList,
            PdfImage,
        ];
    }

    public build(payload?: ReportPayload) {

        let prop = this.getProperty(this.arrayProp, payload) as [] || [undefined];

        if (!Array.isArray(prop)) {
            console.error(`Payload property "${this.arrayProp.name}" is not an array`);
            prop = [];
        }

        return from(prop).pipe(
            mergeMap((payloadItem, idx) => this.getBuildedChildren(payloadItem).pipe(
                map((builded) => builded.length === 1 ? builded[0] : builded),
                map((builded) => ({ builded, idx })),
            )),
            toArray(),
            map((arr) => arr
                .sort((a, b) => a.idx - b.idx)
                .map((a) => a.builded),
            ),
            defaultIfEmpty([]),
            map((loop) => ({ loop })),
        );
    }

}
