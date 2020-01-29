import { Observable, pipe, UnaryFunction } from "rxjs";
import { defaultIfEmpty, map, mergeMap, toArray } from "rxjs/operators";

export function mergeToArray<T, O>(project: (value: T, index: number) => Observable<O>, concurrent?: number): UnaryFunction<Observable<T>, Observable<O[]>> {
    return pipe(
        mergeMap<T, Observable<{ val: O, idx: number }>>((child, idx) => project(child, idx).pipe(
            map((val) => ({ val, idx })),
        ), concurrent),
        toArray(),
        map((arr) => arr
            .sort((a, b) => a.idx - b.idx)
            .map((a) => a.val),
        ),
        defaultIfEmpty([]),
    );
}
