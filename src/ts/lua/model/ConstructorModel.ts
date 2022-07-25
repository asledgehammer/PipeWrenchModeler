import { DocBuilder } from '../../DocBuilder';
import { LuaClass } from '../LuaClass';
import { LuaConstructor } from '../LuaConstructor';
import { LuaMethod } from '../LuaMethod';
import { ClassModel } from './ClassModel';
import { ConstructorDoc, ConstructorDocJson } from './doc/ConstructorDoc';
import { ParamModel, ParamModelJson } from './ParamModel';

/**
 * **ConstructorModel**
 *
 * @author JabDoesThings
 */
export class ConstructorModel {
  readonly params: ParamModel[] = [];
  readonly doc: ConstructorDoc;
  readonly clazz: ClassModel;

  constructor(clazz: ClassModel, json?: ConstructorModelJson) {
    this.clazz = clazz;
    this.doc = new ConstructorDoc();
    if (json) this.load(json);
  }

  load(json: ConstructorModelJson) {
    this.clear();
    if (json.doc) this.doc.load(json.doc);
    for (const param of json.params) this.params.push(new ParamModel(param));
  }

  save(): ConstructorModelJson {
    const params: ParamModelJson[] = [];
    const doc: ConstructorDocJson = this.doc.save();
    return { doc, params };
  }

  generateDoc(prefix: string, _constructor_: LuaConstructor): string {
    if (!_constructor_ || !this.testSignature(_constructor_)) return '';

    const doc = new DocBuilder();
    const { doc: constructorDoc, params } = this;
    if (constructorDoc) {
      const { annotations, lines } = constructorDoc;

      // Process annotations. (If defined)
      if (annotations) {
        const keys = Object.keys(annotations);
        if (keys && keys.length) {
          for (const key of keys) doc.appendAnnotation(key, annotations[key]);
          doc.appendLine();
        }
      }

      // Process lines. (If defined)
      if (lines && lines.length) {
        for (const line of lines) doc.appendLine(line);
        doc.appendLine();
      }

      // Process params. (If defined)
      if (params) {
        for (const param of params) {
          const { name, doc: paramDoc } = param;

          if (!doc) {
            doc.appendParam(name);
            continue;
          } else {
            const { lines } = paramDoc;

            // No lines. Print basic @param <name>
            if (!lines || !lines.length) {
              doc.appendParam(name);
              continue;
            }

            doc.appendParam(name, lines[0]);

            // Check if multi-line.
            if (lines.length === 1) continue;
            for (let index = 1; index < lines.length; index++) {
              doc.appendLine(lines[index]);
            }
          }
        }
      }
    }
    return doc.build(prefix);
  }

  testSignature(_constructor_: LuaMethod): boolean {
    if (_constructor_.params.length !== this.params.length) return false;
    if (this.params.length) {
      for (let i = 0; i < this.params.length; i++) {
        if (!this.params[i].testSignature(_constructor_.params[i])) return false;
      }
    }
    return true;
  }

  clear() {
    this.doc.clear();
    this.params.length = 0;
  }
}

/**
 * **ConstructorModelJson**
 *
 * @author JabDoesThings
 */
export type ConstructorModelJson = {
  doc: ConstructorDocJson;
  params: ParamModelJson[];
};
