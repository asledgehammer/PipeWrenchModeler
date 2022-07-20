import { ConstructorDoc, ConstructorDocJson } from './doc/ConstructorDoc';
import { ParamModel, ParamModelJson } from './ParamModel';

export class ConstructorModel {
  doc: ConstructorDoc;
  params: ParamModel[] = [];

  constructor(json?: ConstructorModelJson) {
    if (json) this.load(json);
  }

  load(json: ConstructorModelJson) {
    this.doc = new ConstructorDoc(json.doc);
    this.params = [];
    for (const param of json.params) {
      this.params.push(new ParamModel(param));
    }
  }

  save(): ConstructorModelJson {
    const params: ParamModelJson[] = [];
    const doc: ConstructorDocJson = this.doc.save();
    return { doc, params };
  }
}

export type ConstructorModelJson = {
  doc: ConstructorDocJson;
  params: ParamModelJson[];
};
