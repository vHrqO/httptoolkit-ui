import * as _ from 'lodash';
import * as traverse from 'traverse';

type Ref = { $ref: string };

function isRef(node: any): node is Ref {
    return typeof node === 'object' &&
        node !== null &&
        '$ref' in node;
}

function derefRef(root: any, node: Ref) {
    const ref = node.$ref;

    if (!ref.startsWith('#')) {
        throw new Error(`Cannot resolve external reference ${ref}`);
    }

    let refParts = ref.slice(1).split('/').filter(p => p.length);
    let refTarget: any = root;

    while (refParts.length) {
        const nextPart = refParts.shift() as any;
        refTarget = refTarget[nextPart];
        if (!refTarget) {
            throw new Error(`Could not follow ref ${ref}, failed at ${nextPart}`);
        }
    }

    return refTarget;
}
/**
 * Removes almost all $refs from the given JS object. Mutates the input,
 * and returns it as well, just for convenience.
 *
 * This doesn't worry about where $ref is legal - treats it as a reference when
 * found anywhere. That could go wrong in theory, but in practice it's unlikely,
 * and easy for now.
 *
 * If this causes problems later, we need to build an OpenAPI-specific deref,
 * which understands where in OpenAPIv3 a $ref is legal, and only uses those.
 * For now though, we ignore all that for drastic simplification.
 */
export function dereference<T extends object>(root: T): T {
    traverse.forEach(root, function (this: traverse.TraverseContext, node) {
        while (isRef(node)) {
            node = derefRef(root, node);
        }
        this.update(node);
    });
    return root;
}