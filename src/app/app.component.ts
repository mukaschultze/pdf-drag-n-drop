import { Component, OnDestroy, OnInit, Type } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { Observable, Observer, of, Subscription } from "rxjs";
import { debounceTime, mergeMap, pairwise, shareReplay, startWith, switchMapTo, tap } from "rxjs/operators";
import { PdfColumns } from "./elements/columns";
import { PdfContent } from "./elements/content";
import { DocDefinition } from "./elements/doc-definition";
import { PdfImage } from "./elements/image";
import { PdfList } from "./elements/list";
import { PdfElement } from "./elements/pdf-element";
import { PdfText } from "./elements/text";
import { PdfGeneratorService } from "./services/pdf-generator.service";

pdfMake.vfs = pdfFonts.pdfMake.vfs; // Fixes "File 'Roboto-Regular.ttf' not found in virtual file system"

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {

    public pdfSrc?: SafeResourceUrl;
    public docDefinition = new DocDefinition();

    public pdfElements: Type<PdfElement>[] = [
        // PdfContent,
        PdfColumns,
        PdfText,
        PdfImage,
        PdfList,
    ];

    private subscriptions = new Subscription();

    constructor(
        private pdfService: PdfGeneratorService,
        private sanitizer: DomSanitizer,
    ) { }

    public ngOnInit() {

        const columns = new PdfColumns();
        const content = new PdfContent();
        const list = new PdfList();

        this.pdfService.addChildNode(this.docDefinition, content);
        this.pdfService.addChildNode(content, new PdfText("Imagens abaixo"));

        this.pdfService.addChildNode(content, columns);
        this.pdfService.addChildNode(columns, new PdfImage("https://picsum.photos/200/300"));
        this.pdfService.addChildNode(columns, new PdfImage("https://picsum.photos/150/350"));
        this.pdfService.addChildNode(columns, new PdfImage("https://picsum.photos/200/200"));

        for (let i = 0; i < 200; i++) {
            this.pdfService.addChildNode(content, columns);
            this.pdfService.addChildNode(content, new PdfText("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."));
        }

        this.pdfService.addChildNode(content, new PdfText("Imagens acima"));

        this.pdfService.addChildNode(content, list);
        this.pdfService.addChildNode(list, new PdfText("Item número 1"));
        this.pdfService.addChildNode(list, new PdfText("Item número 1"));
        this.pdfService.addChildNode(list, new PdfText("Item número 2"));
        this.pdfService.addChildNode(list, new PdfText("Item número 3"));

        this.pdfService.setCurrentPdf(this.docDefinition);

        const latestBuiltPdf = this.pdfService.currentPdf.pipe(
            debounceTime(1000), // 1sec
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

    public getKeyForType(type: Type<PdfElement>) {
        return new type().key();
    }

    public getLabelForType(type: Type<PdfElement>) {
        return new type().label();
    }

    public buildPdf(): Observable<string> {
        return of(undefined).pipe(
            tap(() => console.time("Build PDF components")),
            mergeMap(() => this.docDefinition.build()),
            tap(() => console.timeEnd("Build PDF components")),
            mergeMap((source) => new Observable((observer: Observer<string>) => {

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
