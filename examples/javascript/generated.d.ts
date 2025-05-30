export class Parser {
  parse(input: string | Input, oldTree?: Tree, options?: Options): Tree;
  getIncludedRanges(): Range[];
  getTimeoutMicros(): number;
  setTimeoutMicros(timeout: number): void;
  reset(): void;
  getLanguage(): any;
  setLanguage(language?: any): void;
  getLogger(): Logger;
  setLogger(logFunc?: Logger | false | null): void;
  printDotGraphs(enabled?: boolean, fd?: number): void;
}

export type Options = {
  bufferSize?: number, includedRanges?: Range[];
};

export type Point = {
  row: number;
  column: number;
};

export type Range = {
  startIndex: number,
  endIndex: number,
  startPosition: Point,
  endPosition: Point
};

export type Edit = {
  startIndex: number;
  oldEndIndex: number;
  newEndIndex: number;
  startPosition: Point;
  oldEndPosition: Point;
  newEndPosition: Point;
};

export type Logger = (
  message: string,
  params: { [param: string]: string },
  type: "parse" | "lex"
) => void;

export interface Input {
  (index: number, position?: Point): string | null;
}

interface SyntaxNodeBase {
  tree: Tree;
  id: number;
  typeId: number;
  grammarId: number;
  type: string;
  grammarType: string;
  isNamed: boolean;
  isMissing: boolean;
  isExtra: boolean;
  hasChanges: boolean;
  hasError: boolean;
  isError: boolean;
  text: string;
  parseState: number;
  nextParseState: number;
  startPosition: Point;
  endPosition: Point;
  startIndex: number;
  endIndex: number;
  parent: SyntaxNode | null;
  children: Array<SyntaxNode>;
  namedChildren: Array<SyntaxNode>;
  childCount: number;
  namedChildCount: number;
  firstChild: SyntaxNode | null;
  firstNamedChild: SyntaxNode | null;
  lastChild: SyntaxNode | null;
  lastNamedChild: SyntaxNode | null;
  nextSibling: SyntaxNode | null;
  nextNamedSibling: SyntaxNode | null;
  previousSibling: SyntaxNode | null;
  previousNamedSibling: SyntaxNode | null;
  descendantCount: number;

  toString(): string;
  child(index: number): SyntaxNode | null;
  namedChild(index: number): SyntaxNode | null;
  childForFieldName(fieldName: string): SyntaxNode | null;
  childForFieldId(fieldId: number): SyntaxNode | null;
  fieldNameForChild(childIndex: number): string | null;
  childrenForFieldName(fieldName: string): Array<SyntaxNode>;
  childrenForFieldId(fieldId: number): Array<SyntaxNode>;
  firstChildForIndex(index: number): SyntaxNode | null;
  firstNamedChildForIndex(index: number): SyntaxNode | null;

  descendantForIndex(index: number): SyntaxNode;
  descendantForIndex(startIndex: number, endIndex: number): SyntaxNode;
  namedDescendantForIndex(index: number): SyntaxNode;
  namedDescendantForIndex(startIndex: number, endIndex: number): SyntaxNode;
  descendantForPosition(position: Point): SyntaxNode;
  descendantForPosition(startPosition: Point, endPosition: Point): SyntaxNode;
  namedDescendantForPosition(position: Point): SyntaxNode;
  namedDescendantForPosition(startPosition: Point, endPosition: Point): SyntaxNode;
  descendantsOfType<T extends TypeString>(types: T | readonly T[], startPosition?: Point, endPosition?: Point): NodeOfType<T>[];

  closest<T extends SyntaxType>(types: T | readonly T[]): NamedNode<T> | null;
  walk(): TreeCursor;
}

export interface TreeCursor {
  nodeType: string;
  nodeTypeId: number;
  nodeStateId: number;
  nodeText: string;
  nodeIsNamed: boolean;
  nodeIsMissing: boolean;
  startPosition: Point;
  endPosition: Point;
  startIndex: number;
  endIndex: number;
  readonly currentNode: SyntaxNode;
  readonly currentFieldName: string;
  readonly currentFieldId: number;
  readonly currentDepth: number;
  readonly currentDescendantIndex: number;

  reset(node: SyntaxNode): void;
  resetTo(cursor: TreeCursor): void;
  gotoParent(): boolean;
  gotoFirstChild(): boolean;
  gotoLastChild(): boolean;
  gotoFirstChildForIndex(goalIndex: number): boolean;
  gotoFirstChildForPosition(goalPosition: Point): boolean;
  gotoNextSibling(): boolean;
  gotoPreviousSibling(): boolean;
  gotoDescendant(goalDescendantIndex: number): void;
}

export interface Tree {
  readonly rootNode: SyntaxNode;

  rootNodeWithOffset(offsetBytes: number, offsetExtent: Point): SyntaxNode;
  edit(edit: Edit): Tree;
  walk(): TreeCursor;
  getChangedRanges(other: Tree): Range[];
  getIncludedRanges(): Range[];
  getEditedRange(other: Tree): Range;
  printDotGraph(fd?: number): void;
}

export interface QueryCapture {
  name: string;
  text?: string;
  node: SyntaxNode;
  setProperties?: { [prop: string]: string | null };
  assertedProperties?: { [prop: string]: string | null };
  refutedProperties?: { [prop: string]: string | null };
}

export interface QueryMatch {
  pattern: number;
  captures: QueryCapture[];
}

export type QueryOptions = {
  startPosition?: Point;
  endPosition?: Point;
  startIndex?: number;
  endIndex?: number;
  matchLimit?: number;
  maxStartDepth?: number;
};

export interface PredicateResult {
  operator: string;
  operands: { name: string; type: string }[];
}

export class Query {
  readonly predicates: { [name: string]: Function }[];
  readonly setProperties: any[];
  readonly assertedProperties: any[];
  readonly refutedProperties: any[];
  readonly matchLimit: number;

  constructor(language: any, source: string | Buffer);

  captures(node: SyntaxNode, options?: QueryOptions): QueryCapture[];
  matches(node: SyntaxNode, options?: QueryOptions): QueryMatch[];
  disableCapture(captureName: string): void;
  disablePattern(patternIndex: number): void;
  isPatternGuaranteedAtStep(byteOffset: number): boolean;
  isPatternRooted(patternIndex: number): boolean;
  isPatternNonLocal(patternIndex: number): boolean;
  startIndexForPattern(patternIndex: number): number;
  didExceedMatchLimit(): boolean;
}

export class LookaheadIterable {
  readonly currentTypeId: number;
  readonly currentType: string;

  reset(language: any, stateId: number): boolean;
  resetState(stateId: number): boolean;
  [Symbol.iterator](): Iterator<string>;
}

interface NamedNodeBase extends SyntaxNodeBase {
    isNamed: true;
}

/** An unnamed node with the given type string. */
export interface UnnamedNode<T extends string = string> extends SyntaxNodeBase {
  type: T;
  isNamed: false;
}

type PickNamedType<Node, T extends string> = Node extends { type: T; isNamed: true } ? Node : never;

type PickType<Node, T extends string> = Node extends { type: T } ? Node : never;

/** A named node with the given `type` string. */
export type NamedNode<T extends SyntaxType = SyntaxType> = PickNamedType<SyntaxNode, T>;

/**
 * A node with the given `type` string.
 *
 * Note that this matches both named and unnamed nodes. Use `NamedNode<T>` to pick only named nodes.
 */
export type NodeOfType<T extends string> = PickType<SyntaxNode, T>;

interface TreeCursorOfType<S extends string, T extends SyntaxNodeBase> {
  nodeType: S;
  currentNode: T;
}

type TreeCursorRecord = { [K in TypeString]: TreeCursorOfType<K, NodeOfType<K>> };

/**
 * A tree cursor whose `nodeType` correlates with `currentNode`.
 *
 * The typing becomes invalid once the underlying cursor is mutated.
 *
 * The intention is to cast a `TreeCursor` to `TypedTreeCursor` before
 * switching on `nodeType`.
 *
 * For example:
 * ```ts
 * let cursor = root.walk();
 * while (cursor.gotoNextSibling()) {
 *   const c = cursor as TypedTreeCursor;
 *   switch (c.nodeType) {
 *     case SyntaxType.Foo: {
 *       let node = c.currentNode; // Typed as FooNode.
 *       break;
 *     }
 *   }
 * }
 * ```
 */
export type TypedTreeCursor = TreeCursorRecord[keyof TreeCursorRecord];

export interface ErrorNode extends NamedNodeBase {
    type: SyntaxType.ERROR;
    hasError: true;
}

export const enum SyntaxType {
  ERROR = "ERROR",
  Arguments = "arguments",
  Array = "array",
  ArrayPattern = "array_pattern",
  ArrowFunction = "arrow_function",
  AssignmentExpression = "assignment_expression",
  AssignmentPattern = "assignment_pattern",
  AugmentedAssignmentExpression = "augmented_assignment_expression",
  AwaitExpression = "await_expression",
  BinaryExpression = "binary_expression",
  BreakStatement = "break_statement",
  CallExpression = "call_expression",
  CatchClause = "catch_clause",
  Class = "class",
  ClassBody = "class_body",
  ClassDeclaration = "class_declaration",
  ClassHeritage = "class_heritage",
  ClassStaticBlock = "class_static_block",
  ComputedPropertyName = "computed_property_name",
  ContinueStatement = "continue_statement",
  DebuggerStatement = "debugger_statement",
  Decorator = "decorator",
  DoStatement = "do_statement",
  ElseClause = "else_clause",
  EmptyStatement = "empty_statement",
  ExportClause = "export_clause",
  ExportSpecifier = "export_specifier",
  ExportStatement = "export_statement",
  ExpressionStatement = "expression_statement",
  FieldDefinition = "field_definition",
  FinallyClause = "finally_clause",
  ForInStatement = "for_in_statement",
  ForStatement = "for_statement",
  FormalParameters = "formal_parameters",
  FunctionDeclaration = "function_declaration",
  FunctionExpression = "function_expression",
  GeneratorFunction = "generator_function",
  GeneratorFunctionDeclaration = "generator_function_declaration",
  IfStatement = "if_statement",
  Import = "import",
  ImportAttribute = "import_attribute",
  ImportClause = "import_clause",
  ImportSpecifier = "import_specifier",
  ImportStatement = "import_statement",
  JsxAttribute = "jsx_attribute",
  JsxClosingElement = "jsx_closing_element",
  JsxElement = "jsx_element",
  JsxExpression = "jsx_expression",
  JsxNamespaceName = "jsx_namespace_name",
  JsxOpeningElement = "jsx_opening_element",
  JsxSelfClosingElement = "jsx_self_closing_element",
  LabeledStatement = "labeled_statement",
  LexicalDeclaration = "lexical_declaration",
  MemberExpression = "member_expression",
  MetaProperty = "meta_property",
  MethodDefinition = "method_definition",
  NamedImports = "named_imports",
  NamespaceExport = "namespace_export",
  NamespaceImport = "namespace_import",
  NewExpression = "new_expression",
  Object = "object",
  ObjectAssignmentPattern = "object_assignment_pattern",
  ObjectPattern = "object_pattern",
  Pair = "pair",
  PairPattern = "pair_pattern",
  ParenthesizedExpression = "parenthesized_expression",
  Program = "program",
  Regex = "regex",
  RestPattern = "rest_pattern",
  ReturnStatement = "return_statement",
  SequenceExpression = "sequence_expression",
  SpreadElement = "spread_element",
  StatementBlock = "statement_block",
  String = "string",
  SubscriptExpression = "subscript_expression",
  SwitchBody = "switch_body",
  SwitchCase = "switch_case",
  SwitchDefault = "switch_default",
  SwitchStatement = "switch_statement",
  TemplateString = "template_string",
  TemplateSubstitution = "template_substitution",
  TernaryExpression = "ternary_expression",
  ThrowStatement = "throw_statement",
  TryStatement = "try_statement",
  UnaryExpression = "unary_expression",
  UpdateExpression = "update_expression",
  VariableDeclaration = "variable_declaration",
  VariableDeclarator = "variable_declarator",
  WhileStatement = "while_statement",
  WithStatement = "with_statement",
  YieldExpression = "yield_expression",
  Comment = "comment",
  EscapeSequence = "escape_sequence",
  False = "false",
  HashBangLine = "hash_bang_line",
  HtmlCharacterReference = "html_character_reference",
  HtmlComment = "html_comment",
  Identifier = "identifier",
  JsxText = "jsx_text",
  Null = "null",
  Number = "number",
  OptionalChain = "optional_chain",
  PrivatePropertyIdentifier = "private_property_identifier",
  PropertyIdentifier = "property_identifier",
  RegexFlags = "regex_flags",
  RegexPattern = "regex_pattern",
  ShorthandPropertyIdentifier = "shorthand_property_identifier",
  ShorthandPropertyIdentifierPattern = "shorthand_property_identifier_pattern",
  StatementIdentifier = "statement_identifier",
  StringFragment = "string_fragment",
  Super = "super",
  This = "this",
  True = "true",
  Undefined = "undefined",
}

export type UnnamedType =
  | "!"
  | "!="
  | "!=="
  | "\""
  | "${"
  | "%"
  | "%="
  | "&"
  | "&&"
  | "&&="
  | "&="
  | "'"
  | "("
  | ")"
  | "*"
  | "**"
  | "**="
  | "*="
  | "+"
  | "++"
  | "+="
  | ","
  | "-"
  | "--"
  | "-="
  | "."
  | "..."
  | "/"
  | "/="
  | "/>"
  | ":"
  | ";"
  | "<"
  | "</"
  | "<<"
  | "<<="
  | "<="
  | "="
  | "=="
  | "==="
  | "=>"
  | ">"
  | ">="
  | ">>"
  | ">>="
  | ">>>"
  | ">>>="
  | "?"
  | "??"
  | "??="
  | "@"
  | "["
  | "]"
  | "^"
  | "^="
  | "`"
  | "as"
  | "async"
  | "await"
  | "break"
  | "case"
  | "catch"
  | SyntaxType.Class // both named and unnamed
  | "const"
  | "continue"
  | "debugger"
  | "default"
  | "delete"
  | "do"
  | "else"
  | "export"
  | "extends"
  | "finally"
  | "for"
  | "from"
  | "function"
  | "get"
  | "if"
  | SyntaxType.Import // both named and unnamed
  | "in"
  | "instanceof"
  | "let"
  | "meta"
  | "new"
  | "of"
  | "return"
  | "set"
  | "static"
  | "static get"
  | "switch"
  | "target"
  | "throw"
  | "try"
  | "typeof"
  | "var"
  | "void"
  | "while"
  | "with"
  | "yield"
  | "{"
  | "|"
  | "|="
  | "||"
  | "||="
  | "}"
  | "~"
  ;

export type TypeString = SyntaxType | UnnamedType;

export type SyntaxNode =
  | DeclarationNode
  | ExpressionNode
  | PatternNode
  | PrimaryExpressionNode
  | StatementNode
  | ArgumentsNode
  | ArrayNode
  | ArrayPatternNode
  | ArrowFunctionNode
  | AssignmentExpressionNode
  | AssignmentPatternNode
  | AugmentedAssignmentExpressionNode
  | AwaitExpressionNode
  | BinaryExpressionNode
  | BreakStatementNode
  | CallExpressionNode
  | CatchClauseNode
  | ClassNode
  | ClassBodyNode
  | ClassDeclarationNode
  | ClassHeritageNode
  | ClassStaticBlockNode
  | ComputedPropertyNameNode
  | ContinueStatementNode
  | DebuggerStatementNode
  | DecoratorNode
  | DoStatementNode
  | ElseClauseNode
  | EmptyStatementNode
  | ExportClauseNode
  | ExportSpecifierNode
  | ExportStatementNode
  | ExpressionStatementNode
  | FieldDefinitionNode
  | FinallyClauseNode
  | ForInStatementNode
  | ForStatementNode
  | FormalParametersNode
  | FunctionDeclarationNode
  | FunctionExpressionNode
  | GeneratorFunctionNode
  | GeneratorFunctionDeclarationNode
  | IfStatementNode
  | ImportNode
  | ImportAttributeNode
  | ImportClauseNode
  | ImportSpecifierNode
  | ImportStatementNode
  | JsxAttributeNode
  | JsxClosingElementNode
  | JsxElementNode
  | JsxExpressionNode
  | JsxNamespaceNameNode
  | JsxOpeningElementNode
  | JsxSelfClosingElementNode
  | LabeledStatementNode
  | LexicalDeclarationNode
  | MemberExpressionNode
  | MetaPropertyNode
  | MethodDefinitionNode
  | NamedImportsNode
  | NamespaceExportNode
  | NamespaceImportNode
  | NewExpressionNode
  | ObjectNode
  | ObjectAssignmentPatternNode
  | ObjectPatternNode
  | PairNode
  | PairPatternNode
  | ParenthesizedExpressionNode
  | ProgramNode
  | RegexNode
  | RestPatternNode
  | ReturnStatementNode
  | SequenceExpressionNode
  | SpreadElementNode
  | StatementBlockNode
  | StringNode
  | SubscriptExpressionNode
  | SwitchBodyNode
  | SwitchCaseNode
  | SwitchDefaultNode
  | SwitchStatementNode
  | TemplateStringNode
  | TemplateSubstitutionNode
  | TernaryExpressionNode
  | ThrowStatementNode
  | TryStatementNode
  | UnaryExpressionNode
  | UpdateExpressionNode
  | VariableDeclarationNode
  | VariableDeclaratorNode
  | WhileStatementNode
  | WithStatementNode
  | YieldExpressionNode
  | UnnamedNode<"!">
  | UnnamedNode<"!=">
  | UnnamedNode<"!==">
  | UnnamedNode<"\"">
  | UnnamedNode<"${">
  | UnnamedNode<"%">
  | UnnamedNode<"%=">
  | UnnamedNode<"&">
  | UnnamedNode<"&&">
  | UnnamedNode<"&&=">
  | UnnamedNode<"&=">
  | UnnamedNode<"'">
  | UnnamedNode<"(">
  | UnnamedNode<")">
  | UnnamedNode<"*">
  | UnnamedNode<"**">
  | UnnamedNode<"**=">
  | UnnamedNode<"*=">
  | UnnamedNode<"+">
  | UnnamedNode<"++">
  | UnnamedNode<"+=">
  | UnnamedNode<",">
  | UnnamedNode<"-">
  | UnnamedNode<"--">
  | UnnamedNode<"-=">
  | UnnamedNode<".">
  | UnnamedNode<"...">
  | UnnamedNode<"/">
  | UnnamedNode<"/=">
  | UnnamedNode<"/>">
  | UnnamedNode<":">
  | UnnamedNode<";">
  | UnnamedNode<"<">
  | UnnamedNode<"</">
  | UnnamedNode<"<<">
  | UnnamedNode<"<<=">
  | UnnamedNode<"<=">
  | UnnamedNode<"=">
  | UnnamedNode<"==">
  | UnnamedNode<"===">
  | UnnamedNode<"=>">
  | UnnamedNode<">">
  | UnnamedNode<">=">
  | UnnamedNode<">>">
  | UnnamedNode<">>=">
  | UnnamedNode<">>>">
  | UnnamedNode<">>>=">
  | UnnamedNode<"?">
  | UnnamedNode<"??">
  | UnnamedNode<"??=">
  | UnnamedNode<"@">
  | UnnamedNode<"[">
  | UnnamedNode<"]">
  | UnnamedNode<"^">
  | UnnamedNode<"^=">
  | UnnamedNode<"`">
  | UnnamedNode<"as">
  | UnnamedNode<"async">
  | UnnamedNode<"await">
  | UnnamedNode<"break">
  | UnnamedNode<"case">
  | UnnamedNode<"catch">
  | UnnamedNode<SyntaxType.Class>
  | CommentNode
  | UnnamedNode<"const">
  | UnnamedNode<"continue">
  | UnnamedNode<"debugger">
  | UnnamedNode<"default">
  | UnnamedNode<"delete">
  | UnnamedNode<"do">
  | UnnamedNode<"else">
  | EscapeSequenceNode
  | UnnamedNode<"export">
  | UnnamedNode<"extends">
  | FalseNode
  | UnnamedNode<"finally">
  | UnnamedNode<"for">
  | UnnamedNode<"from">
  | UnnamedNode<"function">
  | UnnamedNode<"get">
  | HashBangLineNode
  | HtmlCharacterReferenceNode
  | HtmlCommentNode
  | IdentifierNode
  | UnnamedNode<"if">
  | UnnamedNode<SyntaxType.Import>
  | UnnamedNode<"in">
  | UnnamedNode<"instanceof">
  | JsxTextNode
  | UnnamedNode<"let">
  | UnnamedNode<"meta">
  | UnnamedNode<"new">
  | NullNode
  | NumberNode
  | UnnamedNode<"of">
  | OptionalChainNode
  | PrivatePropertyIdentifierNode
  | PropertyIdentifierNode
  | RegexFlagsNode
  | RegexPatternNode
  | UnnamedNode<"return">
  | UnnamedNode<"set">
  | ShorthandPropertyIdentifierNode
  | ShorthandPropertyIdentifierPatternNode
  | StatementIdentifierNode
  | UnnamedNode<"static">
  | UnnamedNode<"static get">
  | StringFragmentNode
  | SuperNode
  | UnnamedNode<"switch">
  | UnnamedNode<"target">
  | ThisNode
  | UnnamedNode<"throw">
  | TrueNode
  | UnnamedNode<"try">
  | UnnamedNode<"typeof">
  | UndefinedNode
  | UnnamedNode<"var">
  | UnnamedNode<"void">
  | UnnamedNode<"while">
  | UnnamedNode<"with">
  | UnnamedNode<"yield">
  | UnnamedNode<"{">
  | UnnamedNode<"|">
  | UnnamedNode<"|=">
  | UnnamedNode<"||">
  | UnnamedNode<"||=">
  | UnnamedNode<"}">
  | UnnamedNode<"~">
  | ErrorNode
  ;

export type DeclarationNode =
  | ClassDeclarationNode
  | FunctionDeclarationNode
  | GeneratorFunctionDeclarationNode
  | LexicalDeclarationNode
  | VariableDeclarationNode
  ;

export type ExpressionNode =
  | AssignmentExpressionNode
  | AugmentedAssignmentExpressionNode
  | AwaitExpressionNode
  | BinaryExpressionNode
  | JsxElementNode
  | JsxSelfClosingElementNode
  | NewExpressionNode
  | PrimaryExpressionNode
  | TernaryExpressionNode
  | UnaryExpressionNode
  | UpdateExpressionNode
  | YieldExpressionNode
  ;

export type PatternNode =
  | ArrayPatternNode
  | IdentifierNode
  | MemberExpressionNode
  | ObjectPatternNode
  | RestPatternNode
  | SubscriptExpressionNode
  | UndefinedNode
  ;

export type PrimaryExpressionNode =
  | ArrayNode
  | ArrowFunctionNode
  | CallExpressionNode
  | ClassNode
  | FalseNode
  | FunctionExpressionNode
  | GeneratorFunctionNode
  | IdentifierNode
  | MemberExpressionNode
  | MetaPropertyNode
  | NullNode
  | NumberNode
  | ObjectNode
  | ParenthesizedExpressionNode
  | RegexNode
  | StringNode
  | SubscriptExpressionNode
  | SuperNode
  | TemplateStringNode
  | ThisNode
  | TrueNode
  | UndefinedNode
  ;

export type StatementNode =
  | BreakStatementNode
  | ContinueStatementNode
  | DebuggerStatementNode
  | DeclarationNode
  | DoStatementNode
  | EmptyStatementNode
  | ExportStatementNode
  | ExpressionStatementNode
  | ForInStatementNode
  | ForStatementNode
  | IfStatementNode
  | ImportStatementNode
  | LabeledStatementNode
  | ReturnStatementNode
  | StatementBlockNode
  | SwitchStatementNode
  | ThrowStatementNode
  | TryStatementNode
  | WhileStatementNode
  | WithStatementNode
  ;

export interface ArgumentsNode extends NamedNodeBase {
  type: SyntaxType.Arguments;
}

export interface ArrayNode extends NamedNodeBase {
  type: SyntaxType.Array;
}

export interface ArrayPatternNode extends NamedNodeBase {
  type: SyntaxType.ArrayPattern;
}

export interface ArrowFunctionNode extends NamedNodeBase {
  type: SyntaxType.ArrowFunction;
  bodyNode: ExpressionNode | StatementBlockNode;
  parameterNode?: IdentifierNode;
  parametersNode?: FormalParametersNode;
}

export interface AssignmentExpressionNode extends NamedNodeBase {
  type: SyntaxType.AssignmentExpression;
  leftNode: ArrayPatternNode | IdentifierNode | MemberExpressionNode | ObjectPatternNode | ParenthesizedExpressionNode | SubscriptExpressionNode | UndefinedNode;
  rightNode: ExpressionNode;
}

export interface AssignmentPatternNode extends NamedNodeBase {
  type: SyntaxType.AssignmentPattern;
  leftNode: PatternNode;
  rightNode: ExpressionNode;
}

export interface AugmentedAssignmentExpressionNode extends NamedNodeBase {
  type: SyntaxType.AugmentedAssignmentExpression;
  leftNode: IdentifierNode | MemberExpressionNode | ParenthesizedExpressionNode | SubscriptExpressionNode;
  operatorNode: UnnamedNode<"%="> | UnnamedNode<"&&="> | UnnamedNode<"&="> | UnnamedNode<"**="> | UnnamedNode<"*="> | UnnamedNode<"+="> | UnnamedNode<"-="> | UnnamedNode<"/="> | UnnamedNode<"<<="> | UnnamedNode<">>="> | UnnamedNode<">>>="> | UnnamedNode<"??="> | UnnamedNode<"^="> | UnnamedNode<"|="> | UnnamedNode<"||=">;
  rightNode: ExpressionNode;
}

export interface AwaitExpressionNode extends NamedNodeBase {
  type: SyntaxType.AwaitExpression;
}

export interface BinaryExpressionNode extends NamedNodeBase {
  type: SyntaxType.BinaryExpression;
  leftNode: ExpressionNode | PrivatePropertyIdentifierNode;
  operatorNode: UnnamedNode<"!="> | UnnamedNode<"!=="> | UnnamedNode<"%"> | UnnamedNode<"&"> | UnnamedNode<"&&"> | UnnamedNode<"*"> | UnnamedNode<"**"> | UnnamedNode<"+"> | UnnamedNode<"-"> | UnnamedNode<"/"> | UnnamedNode<"<"> | UnnamedNode<"<<"> | UnnamedNode<"<="> | UnnamedNode<"=="> | UnnamedNode<"==="> | UnnamedNode<">"> | UnnamedNode<">="> | UnnamedNode<">>"> | UnnamedNode<">>>"> | UnnamedNode<"??"> | UnnamedNode<"^"> | UnnamedNode<"in"> | UnnamedNode<"instanceof"> | UnnamedNode<"|"> | UnnamedNode<"||">;
  rightNode: ExpressionNode;
}

export interface BreakStatementNode extends NamedNodeBase {
  type: SyntaxType.BreakStatement;
  labelNode?: StatementIdentifierNode;
}

export interface CallExpressionNode extends NamedNodeBase {
  type: SyntaxType.CallExpression;
  argumentsNode: ArgumentsNode | TemplateStringNode;
  functionNode: ExpressionNode | ImportNode;
  optional_chainNode?: OptionalChainNode;
}

export interface CatchClauseNode extends NamedNodeBase {
  type: SyntaxType.CatchClause;
  bodyNode: StatementBlockNode;
  parameterNode?: ArrayPatternNode | IdentifierNode | ObjectPatternNode;
}

export interface ClassNode extends NamedNodeBase {
  type: SyntaxType.Class;
  bodyNode: ClassBodyNode;
  decoratorNodes: DecoratorNode[];
  nameNode?: IdentifierNode;
}

export interface ClassBodyNode extends NamedNodeBase {
  type: SyntaxType.ClassBody;
  memberNodes: (ClassStaticBlockNode | FieldDefinitionNode | MethodDefinitionNode)[];
}

export interface ClassDeclarationNode extends NamedNodeBase {
  type: SyntaxType.ClassDeclaration;
  bodyNode: ClassBodyNode;
  decoratorNodes: DecoratorNode[];
  nameNode: IdentifierNode;
}

export interface ClassHeritageNode extends NamedNodeBase {
  type: SyntaxType.ClassHeritage;
}

export interface ClassStaticBlockNode extends NamedNodeBase {
  type: SyntaxType.ClassStaticBlock;
  bodyNode: StatementBlockNode;
}

export interface ComputedPropertyNameNode extends NamedNodeBase {
  type: SyntaxType.ComputedPropertyName;
}

export interface ContinueStatementNode extends NamedNodeBase {
  type: SyntaxType.ContinueStatement;
  labelNode?: StatementIdentifierNode;
}

export interface DebuggerStatementNode extends NamedNodeBase {
  type: SyntaxType.DebuggerStatement;
}

export interface DecoratorNode extends NamedNodeBase {
  type: SyntaxType.Decorator;
}

export interface DoStatementNode extends NamedNodeBase {
  type: SyntaxType.DoStatement;
  bodyNode: StatementNode;
  conditionNode: ParenthesizedExpressionNode;
}

export interface ElseClauseNode extends NamedNodeBase {
  type: SyntaxType.ElseClause;
}

export interface EmptyStatementNode extends NamedNodeBase {
  type: SyntaxType.EmptyStatement;
}

export interface ExportClauseNode extends NamedNodeBase {
  type: SyntaxType.ExportClause;
}

export interface ExportSpecifierNode extends NamedNodeBase {
  type: SyntaxType.ExportSpecifier;
  aliasNode?: IdentifierNode | StringNode;
  nameNode: IdentifierNode | StringNode;
}

export interface ExportStatementNode extends NamedNodeBase {
  type: SyntaxType.ExportStatement;
  declarationNode?: DeclarationNode;
  decoratorNodes: DecoratorNode[];
  sourceNode?: StringNode;
  valueNode?: ExpressionNode;
}

export interface ExpressionStatementNode extends NamedNodeBase {
  type: SyntaxType.ExpressionStatement;
}

export interface FieldDefinitionNode extends NamedNodeBase {
  type: SyntaxType.FieldDefinition;
  decoratorNodes: DecoratorNode[];
  propertyNode: ComputedPropertyNameNode | NumberNode | PrivatePropertyIdentifierNode | PropertyIdentifierNode | StringNode;
  valueNode?: ExpressionNode;
}

export interface FinallyClauseNode extends NamedNodeBase {
  type: SyntaxType.FinallyClause;
  bodyNode: StatementBlockNode;
}

export interface ForInStatementNode extends NamedNodeBase {
  type: SyntaxType.ForInStatement;
  bodyNode: StatementNode;
  kindNode?: UnnamedNode<"const"> | UnnamedNode<"let"> | UnnamedNode<"var">;
  leftNode: ArrayPatternNode | IdentifierNode | MemberExpressionNode | ObjectPatternNode | ParenthesizedExpressionNode | SubscriptExpressionNode | UndefinedNode;
  operatorNode: UnnamedNode<"in"> | UnnamedNode<"of">;
  rightNode: ExpressionNode | SequenceExpressionNode;
  valueNode?: ExpressionNode;
}

export interface ForStatementNode extends NamedNodeBase {
  type: SyntaxType.ForStatement;
  bodyNode: StatementNode;
  conditionNodes: (UnnamedNode<";"> | EmptyStatementNode | ExpressionNode | SequenceExpressionNode)[];
  incrementNode?: ExpressionNode | SequenceExpressionNode;
  initializerNode: EmptyStatementNode | ExpressionNode | LexicalDeclarationNode | SequenceExpressionNode | VariableDeclarationNode;
}

export interface FormalParametersNode extends NamedNodeBase {
  type: SyntaxType.FormalParameters;
}

export interface FunctionDeclarationNode extends NamedNodeBase {
  type: SyntaxType.FunctionDeclaration;
  bodyNode: StatementBlockNode;
  nameNode: IdentifierNode;
  parametersNode: FormalParametersNode;
}

export interface FunctionExpressionNode extends NamedNodeBase {
  type: SyntaxType.FunctionExpression;
  bodyNode: StatementBlockNode;
  nameNode?: IdentifierNode;
  parametersNode: FormalParametersNode;
}

export interface GeneratorFunctionNode extends NamedNodeBase {
  type: SyntaxType.GeneratorFunction;
  bodyNode: StatementBlockNode;
  nameNode?: IdentifierNode;
  parametersNode: FormalParametersNode;
}

export interface GeneratorFunctionDeclarationNode extends NamedNodeBase {
  type: SyntaxType.GeneratorFunctionDeclaration;
  bodyNode: StatementBlockNode;
  nameNode: IdentifierNode;
  parametersNode: FormalParametersNode;
}

export interface IfStatementNode extends NamedNodeBase {
  type: SyntaxType.IfStatement;
  alternativeNode?: ElseClauseNode;
  conditionNode: ParenthesizedExpressionNode;
  consequenceNode: StatementNode;
}

export interface ImportNode extends NamedNodeBase {
  type: SyntaxType.Import;
}

export interface ImportAttributeNode extends NamedNodeBase {
  type: SyntaxType.ImportAttribute;
}

export interface ImportClauseNode extends NamedNodeBase {
  type: SyntaxType.ImportClause;
}

export interface ImportSpecifierNode extends NamedNodeBase {
  type: SyntaxType.ImportSpecifier;
  aliasNode?: IdentifierNode;
  nameNode: IdentifierNode | StringNode;
}

export interface ImportStatementNode extends NamedNodeBase {
  type: SyntaxType.ImportStatement;
  sourceNode: StringNode;
}

export interface JsxAttributeNode extends NamedNodeBase {
  type: SyntaxType.JsxAttribute;
}

export interface JsxClosingElementNode extends NamedNodeBase {
  type: SyntaxType.JsxClosingElement;
  nameNode?: IdentifierNode | JsxNamespaceNameNode | MemberExpressionNode;
}

export interface JsxElementNode extends NamedNodeBase {
  type: SyntaxType.JsxElement;
  close_tagNode: JsxClosingElementNode;
  open_tagNode: JsxOpeningElementNode;
}

export interface JsxExpressionNode extends NamedNodeBase {
  type: SyntaxType.JsxExpression;
}

export interface JsxNamespaceNameNode extends NamedNodeBase {
  type: SyntaxType.JsxNamespaceName;
}

export interface JsxOpeningElementNode extends NamedNodeBase {
  type: SyntaxType.JsxOpeningElement;
  attributeNodes: (JsxAttributeNode | JsxExpressionNode)[];
  nameNode?: IdentifierNode | JsxNamespaceNameNode | MemberExpressionNode;
}

export interface JsxSelfClosingElementNode extends NamedNodeBase {
  type: SyntaxType.JsxSelfClosingElement;
  attributeNodes: (JsxAttributeNode | JsxExpressionNode)[];
  nameNode: IdentifierNode | JsxNamespaceNameNode | MemberExpressionNode;
}

export interface LabeledStatementNode extends NamedNodeBase {
  type: SyntaxType.LabeledStatement;
  bodyNode: StatementNode;
  labelNode: StatementIdentifierNode;
}

export interface LexicalDeclarationNode extends NamedNodeBase {
  type: SyntaxType.LexicalDeclaration;
  kindNode: UnnamedNode<"const"> | UnnamedNode<"let">;
}

export interface MemberExpressionNode extends NamedNodeBase {
  type: SyntaxType.MemberExpression;
  objectNode: ExpressionNode | ImportNode;
  optional_chainNode?: OptionalChainNode;
  propertyNode: PrivatePropertyIdentifierNode | PropertyIdentifierNode;
}

export interface MetaPropertyNode extends NamedNodeBase {
  type: SyntaxType.MetaProperty;
}

export interface MethodDefinitionNode extends NamedNodeBase {
  type: SyntaxType.MethodDefinition;
  bodyNode: StatementBlockNode;
  decoratorNodes: DecoratorNode[];
  nameNode: ComputedPropertyNameNode | NumberNode | PrivatePropertyIdentifierNode | PropertyIdentifierNode | StringNode;
  parametersNode: FormalParametersNode;
}

export interface NamedImportsNode extends NamedNodeBase {
  type: SyntaxType.NamedImports;
}

export interface NamespaceExportNode extends NamedNodeBase {
  type: SyntaxType.NamespaceExport;
}

export interface NamespaceImportNode extends NamedNodeBase {
  type: SyntaxType.NamespaceImport;
}

export interface NewExpressionNode extends NamedNodeBase {
  type: SyntaxType.NewExpression;
  argumentsNode?: ArgumentsNode;
  constructorNode: NewExpressionNode | PrimaryExpressionNode;
}

export interface ObjectNode extends NamedNodeBase {
  type: SyntaxType.Object;
}

export interface ObjectAssignmentPatternNode extends NamedNodeBase {
  type: SyntaxType.ObjectAssignmentPattern;
  leftNode: ArrayPatternNode | ObjectPatternNode | ShorthandPropertyIdentifierPatternNode;
  rightNode: ExpressionNode;
}

export interface ObjectPatternNode extends NamedNodeBase {
  type: SyntaxType.ObjectPattern;
}

export interface PairNode extends NamedNodeBase {
  type: SyntaxType.Pair;
  keyNode: ComputedPropertyNameNode | NumberNode | PrivatePropertyIdentifierNode | PropertyIdentifierNode | StringNode;
  valueNode: ExpressionNode;
}

export interface PairPatternNode extends NamedNodeBase {
  type: SyntaxType.PairPattern;
  keyNode: ComputedPropertyNameNode | NumberNode | PrivatePropertyIdentifierNode | PropertyIdentifierNode | StringNode;
  valueNode: AssignmentPatternNode | PatternNode;
}

export interface ParenthesizedExpressionNode extends NamedNodeBase {
  type: SyntaxType.ParenthesizedExpression;
}

export interface ProgramNode extends NamedNodeBase {
  type: SyntaxType.Program;
}

export interface RegexNode extends NamedNodeBase {
  type: SyntaxType.Regex;
  flagsNode?: RegexFlagsNode;
  patternNode: RegexPatternNode;
}

export interface RestPatternNode extends NamedNodeBase {
  type: SyntaxType.RestPattern;
}

export interface ReturnStatementNode extends NamedNodeBase {
  type: SyntaxType.ReturnStatement;
}

export interface SequenceExpressionNode extends NamedNodeBase {
  type: SyntaxType.SequenceExpression;
}

export interface SpreadElementNode extends NamedNodeBase {
  type: SyntaxType.SpreadElement;
}

export interface StatementBlockNode extends NamedNodeBase {
  type: SyntaxType.StatementBlock;
}

export interface StringNode extends NamedNodeBase {
  type: SyntaxType.String;
}

export interface SubscriptExpressionNode extends NamedNodeBase {
  type: SyntaxType.SubscriptExpression;
  indexNode: ExpressionNode | SequenceExpressionNode;
  objectNode: ExpressionNode;
  optional_chainNode?: OptionalChainNode;
}

export interface SwitchBodyNode extends NamedNodeBase {
  type: SyntaxType.SwitchBody;
}

export interface SwitchCaseNode extends NamedNodeBase {
  type: SyntaxType.SwitchCase;
  bodyNodes: StatementNode[];
  valueNode: ExpressionNode | SequenceExpressionNode;
}

export interface SwitchDefaultNode extends NamedNodeBase {
  type: SyntaxType.SwitchDefault;
  bodyNodes: StatementNode[];
}

export interface SwitchStatementNode extends NamedNodeBase {
  type: SyntaxType.SwitchStatement;
  bodyNode: SwitchBodyNode;
  valueNode: ParenthesizedExpressionNode;
}

export interface TemplateStringNode extends NamedNodeBase {
  type: SyntaxType.TemplateString;
}

export interface TemplateSubstitutionNode extends NamedNodeBase {
  type: SyntaxType.TemplateSubstitution;
}

export interface TernaryExpressionNode extends NamedNodeBase {
  type: SyntaxType.TernaryExpression;
  alternativeNode: ExpressionNode;
  conditionNode: ExpressionNode;
  consequenceNode: ExpressionNode;
}

export interface ThrowStatementNode extends NamedNodeBase {
  type: SyntaxType.ThrowStatement;
}

export interface TryStatementNode extends NamedNodeBase {
  type: SyntaxType.TryStatement;
  bodyNode: StatementBlockNode;
  finalizerNode?: FinallyClauseNode;
  handlerNode?: CatchClauseNode;
}

export interface UnaryExpressionNode extends NamedNodeBase {
  type: SyntaxType.UnaryExpression;
  argumentNode: ExpressionNode;
  operatorNode: UnnamedNode<"!"> | UnnamedNode<"+"> | UnnamedNode<"-"> | UnnamedNode<"delete"> | UnnamedNode<"typeof"> | UnnamedNode<"void"> | UnnamedNode<"~">;
}

export interface UpdateExpressionNode extends NamedNodeBase {
  type: SyntaxType.UpdateExpression;
  argumentNode: ExpressionNode;
  operatorNode: UnnamedNode<"++"> | UnnamedNode<"--">;
}

export interface VariableDeclarationNode extends NamedNodeBase {
  type: SyntaxType.VariableDeclaration;
}

export interface VariableDeclaratorNode extends NamedNodeBase {
  type: SyntaxType.VariableDeclarator;
  nameNode: ArrayPatternNode | IdentifierNode | ObjectPatternNode;
  valueNode?: ExpressionNode;
}

export interface WhileStatementNode extends NamedNodeBase {
  type: SyntaxType.WhileStatement;
  bodyNode: StatementNode;
  conditionNode: ParenthesizedExpressionNode;
}

export interface WithStatementNode extends NamedNodeBase {
  type: SyntaxType.WithStatement;
  bodyNode: StatementNode;
  objectNode: ParenthesizedExpressionNode;
}

export interface YieldExpressionNode extends NamedNodeBase {
  type: SyntaxType.YieldExpression;
}

export interface CommentNode extends NamedNodeBase {
  type: SyntaxType.Comment;
}

export interface EscapeSequenceNode extends NamedNodeBase {
  type: SyntaxType.EscapeSequence;
}

export interface FalseNode extends NamedNodeBase {
  type: SyntaxType.False;
}

export interface HashBangLineNode extends NamedNodeBase {
  type: SyntaxType.HashBangLine;
}

export interface HtmlCharacterReferenceNode extends NamedNodeBase {
  type: SyntaxType.HtmlCharacterReference;
}

export interface HtmlCommentNode extends NamedNodeBase {
  type: SyntaxType.HtmlComment;
}

export interface IdentifierNode extends NamedNodeBase {
  type: SyntaxType.Identifier;
}

export interface JsxTextNode extends NamedNodeBase {
  type: SyntaxType.JsxText;
}

export interface NullNode extends NamedNodeBase {
  type: SyntaxType.Null;
}

export interface NumberNode extends NamedNodeBase {
  type: SyntaxType.Number;
}

export interface OptionalChainNode extends NamedNodeBase {
  type: SyntaxType.OptionalChain;
}

export interface PrivatePropertyIdentifierNode extends NamedNodeBase {
  type: SyntaxType.PrivatePropertyIdentifier;
}

export interface PropertyIdentifierNode extends NamedNodeBase {
  type: SyntaxType.PropertyIdentifier;
}

export interface RegexFlagsNode extends NamedNodeBase {
  type: SyntaxType.RegexFlags;
}

export interface RegexPatternNode extends NamedNodeBase {
  type: SyntaxType.RegexPattern;
}

export interface ShorthandPropertyIdentifierNode extends NamedNodeBase {
  type: SyntaxType.ShorthandPropertyIdentifier;
}

export interface ShorthandPropertyIdentifierPatternNode extends NamedNodeBase {
  type: SyntaxType.ShorthandPropertyIdentifierPattern;
}

export interface StatementIdentifierNode extends NamedNodeBase {
  type: SyntaxType.StatementIdentifier;
}

export interface StringFragmentNode extends NamedNodeBase {
  type: SyntaxType.StringFragment;
}

export interface SuperNode extends NamedNodeBase {
  type: SyntaxType.Super;
}

export interface ThisNode extends NamedNodeBase {
  type: SyntaxType.This;
}

export interface TrueNode extends NamedNodeBase {
  type: SyntaxType.True;
}

export interface UndefinedNode extends NamedNodeBase {
  type: SyntaxType.Undefined;
}

