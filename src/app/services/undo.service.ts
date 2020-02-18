import { Injectable } from "@angular/core";
import { Element } from "../elements/band";
import { deepClone } from "../util";
import { PdfBuilder } from "./pdf-builder.service";

interface UndoEntry {
    label: string;
    elements: Element[];
}

@Injectable({ providedIn: "root" })
export class UndoService {

    private undoStack: UndoEntry[] = [];
    private redoStack: UndoEntry[] = [];

    constructor(
        private builder: PdfBuilder,
    ) { }

    public recordChanges(label: string) {
        this.undoStack.push({
            label,
            elements: deepClone(this.currentState()),
        });
    }

    public peekUndo(): UndoEntry | undefined {
        return this.undoStack[this.undoStack.length - 1];
    }

    public peekRedo(): UndoEntry | undefined {
        return this.redoStack[this.redoStack.length - 1];
    }

    public undo() {

        if (!this.peekUndo()) {
            console.warn("Nothing to undo");
            return;
        }

        this.redoStack.push(this.peekUndo());
        this.builder.dataChange.next(this.undoStack.pop().elements);
    }

    public redo() {

        if (!this.peekRedo()) {
            console.warn("Nothing to redo");
            return;
        }

        this.undoStack.push(this.peekRedo());
        this.builder.dataChange.next(this.redoStack.pop().elements);
    }

    private currentState() {
        return this.builder.data;
    }

}
