import * as ast from './ast';
import { DeriveInfo, FunctionInfo, MethodInfo, ProxyInfo, RequireInfo, TableConstructorInfo } from './types';

export const getRequireInfo = (statement: ast.CallStatement): RequireInfo | null => {
  let path;

  if (statement.expression.type === 'CallExpression') {
    const expression = statement.expression as ast.CallExpression;

    // Check the function name.
    if (expression.base.type !== 'Identifier') return null;
    const base = expression.base as ast.Identifier;
    const functionName = base.name;
    if (functionName !== 'require') return null;

    // Check the argument(s) passed.
    if (!expression.arguments || expression.arguments.length !== 1) return null;
    if (expression.arguments[0].type !== 'StringLiteral') return null;
    const arg0 = expression.arguments[0] as ast.StringLiteral;
    
    path = arg0.raw;
  } else if ((statement.expression.type = 'StringCallExpression')) {
    const expression = statement.expression as ast.StringCallExpression;

    // Check the function name.
    if (expression.base.type !== 'Identifier') return null;
    const base = expression.base as ast.Identifier;
    const functionName = base.name;
    if (functionName !== 'require') return null;

    // Check the argument(s) passed.
    if (!expression.argument) return null;
    if (expression.argument.type !== 'StringLiteral') return null;
    const arg0 = expression.argument as ast.StringLiteral;
    
    path = arg0.raw;
  } else {
    return null;
  }

  path = path.substring(1, path.length - 1);
  return { path };
};

export const getDeriveInfo = (statement: ast.AssignmentStatement): DeriveInfo | null => {
  // Check assignment body.
  const init = statement.init;
  if (!init.length) return null;
  if (init[0].type !== 'CallExpression') return null;
  const init0 = init[0] as ast.CallExpression;
  if (init0.base.type !== 'MemberExpression') return null;

  // Check args.
  const args = init0.arguments;
  if (args.length !== 1) return null;
  if (args[0].type !== 'StringLiteral') return null;

  // Check member call.
  const base = init0.base as ast.MemberExpression;
  if (base.indexer !== ':') return null;
  if (base.identifier.name !== 'derive') return null;

  // This is a derive assignment call.
  const basebase = base.base as ast.Identifier;
  const superClass = basebase.name;
  const var0 = statement.variables[0] as ast.Identifier;
  const subClass = var0.name;
  return { superClass, subClass };
};

export const getProxyInfo = (statement: ast.LocalStatement): ProxyInfo | null => {
  const { init, variables } = statement;

  if (init.length !== 1) return null;
  if (variables.length !== 1) return null;
  const target = (init[0] as ast.Identifier).name;
  const proxy = (variables[0] as ast.Identifier).name;

  if (!target || !proxy) return null;
  return { proxy, target };
};

export const getTableConstructor = (statement: ast.AssignmentStatement): TableConstructorInfo | null => {
  if (statement.init.length !== 1 || statement.init[0].type !== 'TableConstructorExpression') {
    return null;
  }
  if (statement.variables.length !== 1 || statement.variables[0].type !== 'Identifier') {
    return null;
  }
  const name = (statement.variables[0] as ast.Identifier).name;
  return { name };
};

export const getFunctionDeclaration = (declaration: ast.FunctionDeclaration): FunctionInfo | null => {
  // This is how we know that this is a function declared without assignment.
  if (declaration.identifier.type !== 'Identifier') {
    return null;
  }
  // The name of the function is assigned in the identifier.
  const name = declaration.identifier.name;

  // Whether the function is accessible outside of its scope.
  // (Useful info for upstream processing)
  const isLocal = declaration.isLocal;

  // Compile parameter names in order. (If present)
  const params: string[] = [];
  if (declaration.parameters && declaration.parameters.length) {
    for (let index = 0; index < declaration.parameters.length; index++) {
      // NOTE: Maybe an issue that VarArgLiterals can be provided here?
      const param = declaration.parameters[index] as ast.Identifier;
      params.push(param.name);
    }
  }

  return { isLocal, name, params };
};

export const getMethodDeclaration = (b: boolean, declaration: ast.FunctionDeclaration): MethodInfo | null => {
  // This is how we know that this is a function assigned to a table on definition.
  if (declaration.identifier && declaration.identifier.type !== 'MemberExpression') {
    if (b) console.log("M A", declaration);
    return null;
  }
  // For method declarations and static function assignments, the identifier stores either as
  // a string flag.
  const identifier = declaration.identifier as ast.MemberExpression;
  const isStatic = identifier.indexer === '.';

  // The name of the member assigned. (In this case we're looking for class members)
  let className = (identifier.base as ast.Identifier).name;

  // The name of the method or static function is stored inside the main identifier.
  let name = identifier.identifier.name;
  if (!className || !name) {
    if (b) console.log("M B", className, name, declaration);
    return null;
  }
  // Compile parameter names in order. (If present)
  const params: string[] = [];
  if (declaration.parameters && declaration.parameters.length) {
    for (let index = 0; index < declaration.parameters.length; index++) {
      // NOTE: Maybe an issue that VarArgLiterals can be provided here?
      const param = declaration.parameters[index] as ast.Identifier;
      params.push(param.name);
    }
  }

  return { className, name, params, isStatic };
};

export const getMethodDeclarationFromAssignment = (b: boolean, statement: ast.AssignmentStatement): MethodInfo | null => {
  
  // This is how we know that this is a function assigned to a table on definition.
  if (!statement.init || statement.init.length !== 1 || statement.init[0].type !== 'FunctionDeclaration' ) {
    if (b) console.log('M2 A', statement);
    return null;
  }
  const declaration = statement.init[0] as ast.FunctionDeclaration;

  if (!statement.variables || statement.variables.length !== 1 || statement.variables[0].type !== 'MemberExpression') {
    if (b) console.log('M2 B', statement);
    return null;
  }
  const variable = statement.variables[0] as ast.MemberExpression;

  if (!variable.base || variable.base.type !== 'Identifier') {
    if (b) console.log('M2 C', statement);
    return null;
  }
  const base = variable.base as ast.Identifier;

  if (!variable.identifier || variable.identifier.type !== 'Identifier') {
    if (b) console.log('M2 D', statement);
    return null;
  }
  const identifier = variable.identifier as ast.Identifier;

  const isStatic = variable.indexer === '.';
  const className = base.name;
  const name = identifier.name;

  if (!className || !name) {
    if (b) console.log("M2 E", className, name, statement);
    return null;
  }

  const params: string[] = [];
  if (declaration.parameters && declaration.parameters.length) {
    for (let index = 0; index < declaration.parameters.length; index++) {
      // NOTE: Maybe an issue that VarArgLiterals can be provided here?
      params.push((declaration.parameters[index] as ast.Identifier).name);
    }
  }

  return { className, name, params, isStatic };
};

export const isFunctionLocal = (declaration: ast.FunctionDeclaration): boolean => {
  return declaration.isLocal;
};

export const printMethodInfo = (info: MethodInfo): string => {
    let str = '';
    if (info.isStatic) str += 'static ';
    str += `${info.className}`;
    str += info.isStatic ? '.' : ':';
    str += `${info.name}(`;
    if (info.params.length) {
      for (const param of info.params) str += `${param}, `;
      str = str.substring(0, str.length - 2);
    }
    return str + ')';
};

export const printFunctionInfo = (info: FunctionInfo): string => {
  let str = '';
  if (info.isLocal) str += 'local ';
  str += `${info.name}(`;
  if (info.params.length) {
    for (const param of info.params) str += `${param}, `;
    str = str.substring(0, str.length - 2);
  }
  return str + ')';
};

export const printProxyInfo = (info: ProxyInfo) => {
  console.log(`Proxy: ${info.proxy} -> ${info.target}`);
};

export const printRequireInfo = (info: RequireInfo) => {
  console.log(`Require: ${info.path}`);
};