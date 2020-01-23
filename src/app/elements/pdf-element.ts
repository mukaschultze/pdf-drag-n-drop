import { Type } from "@angular/core";
import { from, Observable } from "rxjs";
import { defaultIfEmpty, map, mergeMap, toArray } from "rxjs/operators";

export abstract class PdfElement {

    public children: PdfElement[] = [];

    public abstract key(): string;

    public abstract label(): string;

    public abstract allowedChildElements(): Type<PdfElement>[];

    public abstract build(): Observable<any>;

    protected getBuildedChildren(): Observable<PdfElement[]> {
        return from(this.children).pipe(
            mergeMap((child, idx) => child.build().pipe(
                map((builded) => ({ builded, idx })),
            )),
            toArray(),
            map((arr) => arr
                .sort((a, b) => a.idx - b.idx)
                .map((a) => a.builded),
            ),
            defaultIfEmpty([]),
        );
    }

}
