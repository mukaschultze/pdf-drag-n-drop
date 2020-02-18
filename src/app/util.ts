import { BehaviorSubject, Observable, pipe, UnaryFunction } from "rxjs";
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

export function deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

export function localStorageSubject<T>(key: string, defaultValue: T): BehaviorSubject<T> {
    let value = null;
    const savedJson = localStorage.getItem(key);

    if (savedJson) {
        try {
            value = JSON.parse(savedJson);
        } catch (e) {
            console.error(`Invalid JSON saved in localstorage using key ${key}`);
            value = defaultValue;
        }
    } else {
        value = defaultValue;
    }

    const subject = new BehaviorSubject<T>(value);

    subject.subscribe((newValue) => localStorage.setItem(key, JSON.stringify(newValue)));

    return subject;
}
