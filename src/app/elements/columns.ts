import { map } from "rxjs/operators";
import { PdfImage } from "./image";
import { PdfElement } from "./pdf-element";
import { PdfText } from "./text";

export class PdfColumns extends PdfElement {

    public key = () => "columns";

    public label = () => `${this.children.length} Colunas`;

    public allowedChildElements() {
        return [
            PdfText,
            PdfImage,
        ];
    }

    public build() {
        return this.getBuildedChildren().pipe(
            map((columns) => ({ columns })),
        );

    }

}
