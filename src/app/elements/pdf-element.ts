import { Type } from "@angular/core";
import { from, Observable, of } from "rxjs";
import { defaultIfEmpty, flatMap, map, mergeMap, toArray } from "rxjs/operators";
import { ReportPayload, ReportProperty } from "../services/reports.service";

export abstract class PdfElement {

    public children: PdfElement[] = [];

    public abstract key(): string;

    public abstract label(): string;

    public abstract allowedChildElements(): Type<PdfElement>[];

    public abstract build(payload?: ReportPayload): Observable<any>;

    protected getProperty(prop: ReportProperty, payload: ReportPayload): any {
        if (!prop || !payload) { return undefined; }

        return payload[prop.name];
    }

    protected getBuildedChildren(payload): Observable<PdfElement[]> {
        return from(this.children).pipe(
            mergeMap((child, idx) => child.build(payload).pipe(
                map((builded) => ({ builded, idx })),
            )),
            flatMap((c) => {
                return c.builded.loop ?
                    from(c.builded.loop).pipe(map((builded) => ({ builded, idx: c.idx }))) :
                    of(c);
            }),
            toArray(),
            map((arr) => arr
                .sort((a, b) => a.idx - b.idx)
                .map((a) => a.builded),
            ),
            defaultIfEmpty([]),
        );
    }

}
