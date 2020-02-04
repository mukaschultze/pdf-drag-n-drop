import { Injectable } from "@angular/core";
import { forkJoin, from, Observable, of } from "rxjs";
import { map, mergeMap, mergeMapTo, shareReplay, take, tap } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class CacheService {

    private readonly CACHE_PREFIX = "pdf-builder-";
    private readonly CACHE_VERSION = 1;

    private readonly cacheKey = `${this.CACHE_PREFIX}${this.CACHE_VERSION}`;
    private cacheStorage: Observable<Cache>; // new ReplaySubject<Cache>(1);

    constructor() {
        this.cacheStorage = from(caches.open(this.cacheKey)).pipe(
            tap(() => this.deleteOldCaches().subscribe()),
            take(1),
            shareReplay(1),
        );
    }

    public getData(url: string): Observable<Response> {
        return this.getCachedData(url).pipe(
            mergeMap((cachedData) => {
                if (cachedData) {
                    console.log("Retrieved cached data");
                    return of(cachedData);
                }

                console.log("Fetching fresh data");

                return this.addToCache(url).pipe(
                    mergeMapTo(this.getCachedData(url)),
                );
            }),
        );
    }

    public addToCache(url: string): Observable<void> {
        return this.cacheStorage.pipe(
            mergeMap((cache) => cache.add(url)),
        );
    }

    public getCachedData(url: string): Observable<Response | undefined> {
        return this.cacheStorage.pipe(
            mergeMap((cache) => cache.match(url)),
            map((response) => (!!response && response.ok) ? response : undefined),
        );
    }

    public deleteOldCaches(): Observable<{ key: string, deleted: boolean }[]> {
        return from(caches.keys()).pipe(
            mergeMap((keys) => forkJoin(
                keys.filter((k) => k.startsWith(this.CACHE_PREFIX)) // Is ours
                    .filter((k) => this.cacheKey !== k) // Is not current cache
                    .map((key) => from(caches.delete(key)).pipe(
                        map((deleted) => ({ key, deleted })),
                    )),
            )),
        );
    }

}
