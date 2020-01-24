import { Injectable } from "@angular/core";
import * as pdfMake from "pdfmake/build/pdfmake";
import { Observable } from "rxjs";
import { PdfElement } from "../elements/pdf-element";

export type ReportPayload = any;

export interface ReportProperty {
    name: string;
    type: string;
}

@Injectable({ providedIn: "root" })
export class ReportsService {

    public generateReport(template: PdfElement, payload?: ReportPayload): Observable<pdfMake.TDocumentDefinitions> {
        return template.build(payload);
    }

}
