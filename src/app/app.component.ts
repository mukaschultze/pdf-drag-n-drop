import { Component, OnInit } from "@angular/core";
import { SafeResourceUrl } from "@angular/platform-browser";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { BehaviorSubject, Observable, Observer } from "rxjs";
import { debounceTime, filter, map, mergeMap, pairwise, shareReplay, startWith, switchMap, take, tap } from "rxjs/operators";
import { payload } from "../payload.json";
import { report } from "../report.json";
import { RootPDF } from "./elements/band.js";
import { PdfBuilder } from "./services/pdf-builder.service";
import { ReportsService } from "./services/reports.service.js";
import { localStorageSubject } from "./util.js";

(pdfMake as any).vfs = pdfFonts.pdfMake.vfs; // Fixes "File 'Roboto-Regular.ttf' not found in virtual file system"

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {

    public pdfTemplate: Observable<RootPDF>;
    public pdfDefinition: Observable<pdfMake.TDocumentDefinitions>;
    public pdfBlob: Observable<Blob>;
    public pdfBuilding = new BehaviorSubject<boolean>(true);
    public pdfUrl: Observable<SafeResourceUrl>;

    public viewer = localStorageSubject<"iframe" | "pdf-viewer" | "ng2-pdfjs-viewer">("pdf-viewer", "iframe");
    public theme = localStorageSubject<"dark-theme" | "light-theme">("app-theme", "dark-theme");

    constructor(
        private pdfBuilder: PdfBuilder,
        private reports: ReportsService,
    ) {
        this.theme.pipe(
            startWith(undefined),
            pairwise(),
        ).subscribe(([oldTheme, newTheme]) => {
            const body = document.getElementsByTagName("body").item(0);

            body.classList.remove(oldTheme);
            body.classList.add(newTheme);
        });
    }

    public ngOnInit() {

        this.pdfBuilder.setCurrentPdf(report as any);

        this.pdfTemplate = this.pdfBuilder.outputTemplate;

        this.pdfDefinition = this.pdfTemplate.pipe(
            debounceTime(150),
            mergeMap((template) => this.reports.generateReport(template, payload)),
            shareReplay(1),
        );

        this.pdfBlob = this.pdfDefinition.pipe(
            switchMap((def) => this.buildPdf(def)),
            shareReplay(1),
        );

        this.pdfUrl = this.pdfBlob.pipe(
            map((blob) => URL.createObjectURL(blob)),
            startWith(undefined),
            pairwise(),
            tap(([prev, current]) => URL.revokeObjectURL(prev)), // Release the URL to prevent memory leaks
            filter(([prev, current]) => !!current),
            map(([prev, current]) => current),
            shareReplay(1),
        );

    }

    public buildPdf(definition: pdfMake.TDocumentDefinitions): Observable<Blob> {
        return new Observable((observer: Observer<Blob>) => {

            definition = {
                ...definition,
                footer: (currentPage, pageCount) => `${currentPage} of ${pageCount}`,
            };

            console.time("Build PDF file");
            const pdf = pdfMake.createPdf(definition);

            pdf.getBuffer((buffer) => {
                console.timeEnd("Build PDF file");
                console.log(`PDF generated with ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

                // const base64 = buffer.toString("base64");
                // const dataURL = `data:application/pdf;base64, ${base64}`;
                // this.pdfBlob = this.sanitizer.bypassSecurityTrustResourceUrl(dataURL);

                const blob = new Blob([buffer], { type: "application/pdf" });

                observer.next(blob);
                observer.complete();

                this.pdfBuilding.next(false);
            });
        });
    }

    public changeTheme() {
        this.theme.next(
            this.theme.value === "dark-theme" ? "light-theme" : "dark-theme",
        );
    }

    public log(obs: Observable<any>, prefix?: string) {
        obs.pipe(
            take(1),
        ).subscribe((val) => console.log(prefix || val, prefix && val));
    }
}
