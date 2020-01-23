import * as pdfMake from "pdfmake/build/pdfmake";
import { forkJoin, Observable, Observer } from "rxjs";
import { map, mapTo, shareReplay, tap } from "rxjs/operators";
import { PdfElement } from "./pdf-element";

export class PdfImage extends PdfElement {

    private static cache: Observable<string>[] = [];

    public constructor(
        public url: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAMAAABOo35HAAAAM1BMVEXp7vG6vsHW2t3Z3uHFys3i5+nDx8rCx8rm6+69wcTT2Nve4+bQ1djLz9K/w8bj6Ovg5egGh/fpAAACkElEQVR42uzBgQAAAACAoP2pF6kCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABm5w50YwWBKAxzHHcXUNy+/9PeW9t0EhcLpMVG5/xv4JeogHEYY4yxHzSlB/oVxujdVXqO6F0Y3DW6LTig5K6QX3BIs7tACQf15k7fE/vxRtwUcVjnfyUmrAW59eot4aPJnb071qLr2II1cWfvccCF3IlFrI+IRSxiFeqP5YeUxhQnYhWxngmfPYRY32NJgJY8sXJY+f3P3RNrF0uwaSTWHpYP2DYQawdrxkvBEyuPFfCaECuLNSFTIlYWa0CmhysVJ4tYMzKFohXCRKw6rAggTPawmm5DtVq1zGG1PeDVatWyhtW4dFCrVcsaVv2iVK1UyxhWw3ZHrVTLFlbLRlqtVMsWVu6IpmylWraw6g//IpDRsoVVPFZWq6yWLSzn/DDrB4tKK9UyhqU1WKkWscpWqkWsspVqEatspVrEKlupFrHUqqxlEcs3WqmWPSxZbo1WqmUNSwDVUqtKLVtYAqiWWlVrWcISYKMV0VLwdrAE2GhFtGUHS4CNVgSx3pNdK9WKINaa7FmpVgSx8hci2LTMIFYeS/AasfJYAmLVYgmIVYslIFYtloBYtVgCYtViCYhViyUgVi2WgFjVWDOxiEWsYsRqiFgNEashYjVErIaI1RCxGuqMNQ2/2rWxyvFPVmIRyxGrIWL9Yff+82l9uApWwqfW0K37ZUbgDjiq4E6fD/gmTqL+m3nB4fzTgv83onNXeby/53NatNorBnRuPP+b8CsvaexXms8/r5sxxhhjjDH2rz04JAAAAAAQ9P+1MywAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKMAbHYmDBuDihQAAAAASUVORK5CYII=",
    ) { super(); }

    public addImageToVFS(url: string): Observable<string> {
        return this.getBase64ImageFromURL(url).pipe(
            tap((imageBase64) => {
                imageBase64 = imageBase64.substring(imageBase64.indexOf(","));
                pdfMake.vfs[this.url] = imageBase64;
            }),
            mapTo(url), // return the key to the VFS
        );
    }

    public getBase64ImageFromURL(url: string): Observable<string> {

        if (!!PdfImage.cache[url]) {
            return PdfImage.cache[url];
        }

        const obs = new Observable((observer: Observer<string>) => {
            // create an image object
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url;
            if (!img.complete) {
                // This will call another method that will create image from url
                img.onload = () => {
                    observer.next(this.getBase64Image(img));
                    observer.complete();
                };
                img.onerror = (err) => {
                    observer.error(err);
                };
            } else {
                observer.next(this.getBase64Image(img));
                observer.complete();
            }
        }).pipe(
            shareReplay(1),
        );

        PdfImage.cache[url] = obs;
        return obs;
    }

    public getBase64Image(img: HTMLImageElement) {
        // We create a HTML canvas object that will create a 2d image
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        // This will draw image
        ctx.drawImage(img, 0, 0);
        // Convert the drawn image to Data URL
        return canvas.toDataURL("image/png");
    }

    public key = () => "image";

    public label = () => `Imagem (${(this.url || "Vazia").substring(0, 30)})`;

    public allowedChildElements() {
        return [
            // PdfText,
            PdfImage,
        ];
    }

    public build() {
        return forkJoin(
            this.addImageToVFS(this.url),
            this.getBuildedChildren(),
        ).pipe(
            map(([image, children]) => ({
                image,
                ...children,
            })),
        );

    }

}
