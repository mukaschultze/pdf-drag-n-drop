import { Component, OnDestroy, OnInit } from "@angular/core";
import { SafeResourceUrl } from "@angular/platform-browser";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { BehaviorSubject, Observable, Observer, Subscription } from "rxjs";
import { debounceTime, filter, map, mergeMap, pairwise, shareReplay, startWith, switchMapTo, tap } from "rxjs/operators";
import { payload } from "../payload.json";
import { report } from "../report.json";
import { NodesService } from "./services/nodes.service.js";
import { PdfBuilder } from "./services/pdf-builder.service";
import { ReportsService } from "./services/reports.service.js";

(pdfMake as any).vfs = pdfFonts.pdfMake.vfs; // Fixes "File 'Roboto-Regular.ttf' not found in virtual file system"

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {

    public pdfSrc: Observable<Blob>;
    public pdfSrcUrl: Observable<SafeResourceUrl>;
    public viewer = new BehaviorSubject<"iframe" | "pdf-viewer" | "ng2-pdfjs-viewer">("iframe");

    private subscriptions = new Subscription();

    constructor(
        private pdfBuilder: PdfBuilder,
        private nodes: NodesService,
        private reports: ReportsService,
    ) { }

    public get availableNodes() {
        return this.nodes.getAvailableNodes();
    }

    public ngOnInit() {

        this.pdfBuilder.setCurrentPdf(report as any);

        this.pdfSrc = this.pdfBuilder.outputTemplate.pipe(
            debounceTime(150),
            switchMapTo(this.buildPdf()),
            shareReplay(1),
        );

        this.pdfSrcUrl = this.pdfSrc.pipe(
            map((blob) => URL.createObjectURL(blob)),
            startWith(undefined),
            pairwise(),
            tap(([prev, current]) => URL.revokeObjectURL(prev)), // Release the URL to prevent memory leaks
            filter(([prev, current]) => !!current),
            map(([prev, current]) => current),
            shareReplay(1),
        );

    }

    public ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    public buildPdf(): Observable<Blob> {
        return this.pdfBuilder.outputTemplate.pipe(
            tap(() => console.time("Build PDF components")),
            mergeMap((template) => this.reports.generateReport(template, payload)),
            tap(() => console.timeEnd("Build PDF components")),
            mergeMap((source) => new Observable((observer: Observer<Blob>) => {

                // console.log(JSON.stringify(source, null, 2));

                source = {
                    ...source,
                    footer: (currentPage, pageCount) => `${currentPage} of ${pageCount}`,
                };

                console.time("Build PDF file");
                const pdf = pdfMake.createPdf(source);

                pdf.getBuffer((buffer) => {
                    console.timeEnd("Build PDF file");
                    console.log(`PDF generated with ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

                    // const base64 = buffer.toString("base64");
                    // const dataURL = `data:application/pdf;base64, ${base64}`;
                    // this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(dataURL);

                    const blob = new Blob([buffer], { type: "application/pdf" });

                    observer.next(blob);
                    observer.complete();
                });
            })),
        );
    }
}
