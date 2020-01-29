import { Component, OnDestroy, OnInit, Type } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { Observable, Observer, of, Subscription } from "rxjs";
import { debounceTime, mergeMap, pairwise, shareReplay, startWith, switchMapTo, tap } from "rxjs/operators";
import { payload } from "../payload.json";
import { report } from "../report.json";
import { RootPDF } from "./elements/band.js";
import { PdfElement } from "./elements/pdf-element";
import { PdfGeneratorService } from "./services/pdf-generator.service";
import { ReportsService } from "./services/reports.service.js";

(pdfMake as any).vfs = pdfFonts.pdfMake.vfs; // Fixes "File 'Roboto-Regular.ttf' not found in virtual file system"

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {

    public pdfSrc?: SafeResourceUrl;

    public pdfElements: Type<PdfElement>[] = [
        // PdfContent,
        // PdfColumns,
        // PdfText,
        // PdfImage,
        // PdfList,
    ];

    private subscriptions = new Subscription();

    constructor(
        private pdfService: PdfGeneratorService,
        private reports: ReportsService,
        private sanitizer: DomSanitizer,
    ) { }

    public ngOnInit() {

        this.pdfService.setCurrentPdf(report as any);

        const latestBuiltPdf = this.pdfService.currentPdf.pipe(
            debounceTime(150),
            switchMapTo(this.buildPdf()),
            shareReplay(1),
        );

        this.subscriptions.add(
            latestBuiltPdf.pipe(
                startWith(undefined),
                pairwise(),
            ).subscribe(([prev, current]) => {
                if (!!prev) {
                    (URL || webkitURL).revokeObjectURL(prev);
                }
            }),
        );

        this.subscriptions.add(
            latestBuiltPdf.subscribe((pdfBlob) => this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(pdfBlob)),
        );
    }

    public ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    public buildPdf(): Observable<string> {
        return of(undefined).pipe(
            tap(() => console.time("Build PDF components")),
            mergeMap(() => this.reports.generateReport(report as RootPDF, payload)),
            tap(() => console.timeEnd("Build PDF components")),
            mergeMap((source) => new Observable((observer: Observer<string>) => {

                console.log(JSON.stringify(source, null, 2));

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
                    const blobURL = (URL || webkitURL).createObjectURL(blob);

                    observer.next(blobURL);
                    observer.complete();
                });
            })),
        );
    }
}
