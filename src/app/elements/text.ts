import { map } from "rxjs/operators";
import { PdfImage } from "./image";
import { PdfElement } from "./pdf-element";

export class PdfText extends PdfElement {

    public constructor(
        public text: string = "",
    ) { super(); }

    public key = () => "text";

    public label = () => `Texto (${(this.text || "Vazio").substring(0, 30)})`;

    public allowedChildElements() {
        return [
            PdfText,
            PdfImage,
        ];
    }

    public build() {
        return this.getBuildedChildren().pipe(
            map((children) => [
                { text: this.text },
                ...children,
            ]),
        );
    }

}
