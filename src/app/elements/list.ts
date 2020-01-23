import { map } from "rxjs/operators";
import { PdfImage } from "./image";
import { PdfElement } from "./pdf-element";
import { PdfText } from "./text";

export class PdfList extends PdfElement {

    public key = () => "ol";

    public label = () => `Lista com ${this.children.length} elementos`;

    public allowedChildElements() {
        return [
            PdfText,
            PdfImage,
        ];
    }

    public build() {
        return this.getBuildedChildren().pipe(
            map((children) => ({ ol: children })),
        );
    }

}
