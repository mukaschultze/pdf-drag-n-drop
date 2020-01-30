import { Injectable, Type } from "@angular/core";

export interface NodeProperty {
    key: string;
    type: Type<any>;
    defaultValue: any;
}

export interface Node {
    key: string;
    name: string;
    leaf: boolean;
    props: NodeProperty[];
}

@Injectable({ providedIn: "root" })
export class NodesService {

    private nodes: Node[] = [
        { key: "root", name: "PDF", leaf: false, props: [] },
        { key: "content", name: "Conteúdo", leaf: false, props: [] },
        { key: "header", name: "Cabeçalho", leaf: false, props: [] },
        { key: "footer", name: "Rodapé", leaf: false, props: [] },
        { key: "foreach", name: "Loop", leaf: false, props: [] },
        { key: "text-dynamic", name: "Texto dinâmico", leaf: true, props: [] },
        { key: "text-static", name: "Texto estático", leaf: true, props: [] },
        { key: "columns", name: "Colunas", leaf: false, props: [] },
        { key: "stack", name: "Pilha", leaf: false, props: [] },
        { key: "image", name: "Imagem", leaf: true, props: [] },
        { key: "undefined", name: "Nó desconhecido", leaf: true, props: [] },
    ];

    public getNodeForKey(key: string) {
        return this.nodes.find((node) => node.key === key);
    }

    public getAvailableNodes() {
        return [...this.nodes];
    }

}
