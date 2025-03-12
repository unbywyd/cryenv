var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/highlighter.ts
var highlighter_exports = {};
__export(highlighter_exports, {
  PrismaHighlighter: () => PrismaHighlighter,
  default: () => highlighter_default
});
var PrismaHighlighter, highlighter, highlighter_default;
var init_highlighter = __esm({
  "src/highlighter.ts"() {
    PrismaHighlighter = class _PrismaHighlighter {
      config;
      static DEFAULT_COLORS = {
        reset: "\x1B[0m",
        gray: "\x1B[90m",
        whiteBold: "\x1B[1;37m",
        cyanBold: "\x1B[1;36m",
        purple: "\x1B[38;5;201m",
        lightPurple: "\x1B[38;5;177m",
        purpleDark: "\x1B[38;5;93m",
        darkBlue: "\x1B[38;5;63m",
        lightBlue: "\x1B[38;5;111m",
        yellow: "\x1B[33m",
        yellowBold: "\x1B[1;33m",
        yellowBright: "\x1B[93m",
        orange: "\x1B[38;5;208m",
        green: "\x1B[32m",
        greenBright: "\x1B[92m",
        cyan: "\x1B[36m",
        cyanLight: "\x1B[96m",
        greenDark: "\x1B[38;5;22m"
      };
      static PRISMA_TYPES = /* @__PURE__ */ new Set([
        "String",
        "Int",
        "Boolean",
        "DateTime",
        "Json",
        "Float",
        "Decimal",
        "BigInt",
        "Bytes"
      ]);
      constructor(config = {}) {
        this.config = {
          enableColors: config.enableColors ?? true,
          colors: { ..._PrismaHighlighter.DEFAULT_COLORS, ...config.colors }
        };
      }
      colorize(text, color) {
        if (!this.config.enableColors) return text;
        return `${this.config.colors[color] || ""}${text}${this.config.colors.reset}`;
      }
      highlight(schema) {
        return schema.replace(/\r\n/g, "\n").split("\n").map((_line) => {
          const line = _line.replace(
            /@\w+(?=\s|$)/g,
            (match) => this.colorize(match, "greenBright")
          ).replace(/(@\w+)(\()([^()]*)(\))/g, (_, annotation, openBracket, args, closeBracket) => {
            const content = args.split(",").map((arg) => {
              if (/^\s*"([^"]+)"\s*$/.test(arg)) return this.colorize(arg, "purpleDark");
              if (arg.includes(":")) {
                const [key, value] = arg.split(":").map((part) => part.trim());
                const coloredValue = value.replace(
                  /\[(.*?)\]/g,
                  (_2, inner) => `${this.colorize("[", "yellowBright")}${this.colorize(inner, "orange")}${this.colorize("]", "yellowBright")}`
                );
                return `${this.colorize(key, "yellowBright")}: ${coloredValue}`;
              }
              return this.colorize(arg, "cyan");
            }).join(", ");
            return this.colorize(annotation, "yellow") + this.colorize(openBracket, "yellowBold") + content + this.colorize(closeBracket, "yellowBold");
          }).replace(/(@\w+)(\s*\(\s*)(.+)(\s*\))/g, (_, annotation, openBracket, value, closeBracket) => {
            return this.colorize(annotation, "yellow") + this.colorize(openBracket, "yellowBright") + this.colorize(value, "cyan") + this.colorize(closeBracket, "yellowBright");
          }).replace(
            /\b(model|enum)\s+([A-Z][a-zA-Z0-9_]*)/g,
            (_, keyword, modelName) => `${this.colorize(keyword, "cyanBold")} ${this.colorize(modelName, "purple")}`
          ).replace(
            /\/\/(.*)$/gm,
            (_, comment) => this.colorize("// " + comment, "green")
          ).replace(
            /\/\*([\s\S]*?)\*\//g,
            (_, content) => this.colorize(`/*${content}*/`, "greenDark")
          ).replace(/^(\s*\S+)(.*)$/, (match, firstPart, secondPart) => {
            if (!secondPart.trim() && !["{", "}"].includes(firstPart.trim())) return this.colorize(match, "cyan");
            return firstPart + (secondPart || "").replace(
              /(?<!["'])(?<=\s|^)([A-Z][a-zA-Z0-9_]*)(\?)?(\[\])?(?![^()]*\))/g,
              (match2, type, optional) => {
                const isOptional = optional !== void 0;
                if (_PrismaHighlighter.PRISMA_TYPES.has(type)) {
                  return isOptional ? this.colorize(match2, "gray") : this.colorize(match2, "lightBlue");
                } else {
                  return isOptional ? this.colorize(match2, "lightPurple") : this.colorize(match2, "purple");
                }
              }
            );
          });
          return line;
        }).join("\n").replace(/\b(generator|datasource)\s+(\w+)\s*({)([\s\S]*?)(})/g, (match, blockType, name, openBrace, content, closeBrace) => {
          const highlightedContent = content.replace(/\b(provider|output|url)\b/g, (key) => this.colorize(key, "yellowBright")).replace(/"([^"]+)"/g, (_, value) => `"${this.colorize(value, "gray")}"`);
          return `${this.colorize(blockType, "greenBright")} ${this.colorize(name, "purple")} ${this.colorize(openBrace, "gray")}${highlightedContent}${this.colorize(closeBrace, "gray")}`;
        });
      }
    };
    highlighter = new PrismaHighlighter();
    highlighter_default = highlighter;
  }
});

// src/index.cts
var highlighter2 = (init_highlighter(), __toCommonJS(highlighter_exports));
module.exports = { ...highlighter2 };
//# sourceMappingURL=index.cjs.map