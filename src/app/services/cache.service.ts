import { Injectable } from "@angular/core";
import { combineLatest, forkJoin, from, Observable, of } from "rxjs";
import { defaultIfEmpty, flatMap, map, mergeMap, shareReplay, switchMap, switchMapTo, take, tap, toArray } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class CacheService {

    private readonly CACHE_PREFIX = "pdf-builder-";
    private readonly CACHE_VERSION = 2;

    private readonly cacheKey = `${this.CACHE_PREFIX}${this.CACHE_VERSION}`;
    private cacheStorage: Observable<Cache>;

    constructor() {
        this.cacheStorage = from(caches.open(this.cacheKey)).pipe(
            tap(() => this.deleteCaches("old").subscribe()),
            take(1),
            shareReplay(1),
        );
    }

    public getData(url: string): Observable<Response> {
        return this.getCachedData(url).pipe(
            switchMap((cachedData) => {
                if (cachedData) {
                    console.log("Retrieved cached data");
                    return of(cachedData);
                }

                console.log("Fetching fresh data");

                return this.addToCache(url).pipe(
                    switchMapTo(this.getCachedData(url)),
                );
            }),
        );
    }

    public addToCache(url: string): Observable<void> {
        return this.cacheStorage.pipe(
            switchMap((cache) => cache.add(url)),
        );
    }

    public getCachedData(url: string): Observable<Response | undefined> {
        return this.cacheStorage.pipe(
            switchMap((cache) => cache.match(url)),
            map((response) => (!!response && response.ok) ? response : undefined),
        );
    }

    public deleteCaches(mode: "all" | "old"): Observable<{ key: string, deleted: boolean }[]> {

        const deleteCaches = from(caches.keys()).pipe(
            switchMap((keys) => forkJoin(
                keys
                    .filter((k) => k !== this.cacheKey) // Ignore current cache
                    .filter((k) => k.startsWith(this.CACHE_PREFIX))
                    .map((key) => from(caches.delete(key)).pipe(
                        map((deleted) => ({ key, deleted })),
                    )),
            )),
            defaultIfEmpty([]),
        );

        const clearCurrent = this.cacheStorage.pipe(
            switchMap((c) => from(c.keys()).pipe(
                flatMap((reqs) => reqs),
                mergeMap((req) => c.delete(req)),
                toArray(),
                map((arr) => arr.some((v) => !!v)),
            )),
        );

        return mode === "all" ?
            combineLatest(deleteCaches, clearCurrent).pipe(map(([older, current]) => [
                ...older,
                { key: "current", deleted: current },
            ])) :
            deleteCaches;
    }

}
