import { Injectable } from "@angular/core";
import * as pdfMake from "pdfmake/build/pdfmake";
import { Observable, Observer } from "rxjs";
import { finalize, map, mapTo, mergeMap, shareReplay, switchMap, tap } from "rxjs/operators";
import { CacheService } from "./cache.service";

@Injectable({ providedIn: "root" })
export class ImageCacheService {

    public readonly placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAMAAABOo35HAAAAM1BMVEXp7vG6vsHW2t3Z3uHFys3i5+nDx8rCx8rm6+69wcTT2Nve4+bQ1djLz9K/w8bj6Ovg5egGh/fpAAACkElEQVR42uzBgQAAAACAoP2pF6kCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABm5w50YwWBKAxzHHcXUNy+/9PeW9t0EhcLpMVG5/xv4JeogHEYY4yxHzSlB/oVxujdVXqO6F0Y3DW6LTig5K6QX3BIs7tACQf15k7fE/vxRtwUcVjnfyUmrAW59eot4aPJnb071qLr2II1cWfvccCF3IlFrI+IRSxiFeqP5YeUxhQnYhWxngmfPYRY32NJgJY8sXJY+f3P3RNrF0uwaSTWHpYP2DYQawdrxkvBEyuPFfCaECuLNSFTIlYWa0CmhysVJ4tYMzKFohXCRKw6rAggTPawmm5DtVq1zGG1PeDVatWyhtW4dFCrVcsaVv2iVK1UyxhWw3ZHrVTLFlbLRlqtVMsWVu6IpmylWraw6g//IpDRsoVVPFZWq6yWLSzn/DDrB4tKK9UyhqU1WKkWscpWqkWsspVqEatspVrEKlupFrHUqqxlEcs3WqmWPSxZbo1WqmUNSwDVUqtKLVtYAqiWWlVrWcISYKMV0VLwdrAE2GhFtGUHS4CNVgSx3pNdK9WKINaa7FmpVgSx8hci2LTMIFYeS/AasfJYAmLVYgmIVYslIFYtloBYtVgCYtViCYhViyUgVi2WgFjVWDOxiEWsYsRqiFgNEashYjVErIaI1RCxGuqMNQ2/2rWxyvFPVmIRyxGrIWL9Yff+82l9uApWwqfW0K37ZUbgDjiq4E6fD/gmTqL+m3nB4fzTgv83onNXeby/53NatNorBnRuPP+b8CsvaexXms8/r5sxxhhjjDH2rz04JAAAAAAQ9P+1MywAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKMAbHYmDBuDihQAAAAASUVORK5CYII=";

    private cache: { [url: string]: Observable<string> } = {};

    constructor(
        private cacheService: CacheService,
    ) { }

    public addImageToVFS(url: string): Observable<string> {
        return this.getBase64ImageFromURL(url).pipe(
            tap((imageBase64) => {
                imageBase64 = imageBase64.substring(imageBase64.indexOf(","));
                (pdfMake.vfs[url] as any) = imageBase64;
            }),
            mapTo(url), // return the key to the VFS
        );
    }

    public getBase64ImageFromURL(url: string): Observable<string> {

        if (!!this.cache[url]) {
            return this.cache[url];
        }

        const obs = this.cacheService.getData(url).pipe(
            mergeMap((response) => response.blob()),
            map((blob) => URL.createObjectURL(blob)),
            switchMap((blobUrl) => new Observable((observer: Observer<string>) => {

                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = blobUrl;

                if (!img.complete) {
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
                finalize(() => URL.revokeObjectURL(blobUrl)),
            )),
            shareReplay(1),
        );

        this.cache[url] = obs;
        return obs;
    }

    public getBase64Image(img: HTMLImageElement) {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL("image/png");
    }

    public clearCache() {
        Object.keys(this.cache).forEach(
            (k) => {
                delete pdfMake.vfs[k];
                delete this.cache[k];
            },
        );
    }

}
