export declare enum InputFormat {
    TEXT = "text",
    EMAIL = "email",
    PHONE = "phone",
    NUMBER = "number",
    INTEGER = "integer",
    BOOLEAN = "boolean",
    DATE = "date",
    UUID = "uuid",
    URL = "url"
}
export declare enum QuestionType {
    input = "input",
    confirm = "confirm",
    checkbox = "checkbox",
    list = "list",
    password = "password"
}
export type Question = {
    message: string;
    type: QuestionType;
    name: string;
    default?: any;
    format: InputFormat;
    choices: Array<string> | undefined;
};
export declare function colorText(text: string, color: "yellow" | "gray" | "green" | "red"): string;
export declare const encryptAnswers: (helloKey: string, answers: Record<string, any>, publicKey: string) => string;
export declare const decryptAnswers: (encryptedData: string) => Promise<any>;
export declare const createSurveyToken: (helloKey: string, surveyData: string) => Promise<string>;
export declare const extractEmailsFromToken: (emailParts: string | undefined) => Array<string>;
export declare const extractSurveyToken: (compressedToken: string) => {
    surveyData: string;
    publicKey: string;
    hello: string;
    emails: Array<string>;
};
export declare const parseMessageQuestion: (message: string | null | undefined) => {
    message: string;
    defaultValue?: string;
};
export declare const parseInputQuestion: (input: string) => {
    message: string;
    varName: string;
    defaultValue?: string;
};
export declare const helloToKey: (hello: string) => string;
export declare const saveQuestions: (hello: string, questions: Question[]) => Promise<void>;
export declare const useFile: (name: string) => Promise<void>;
export declare const requestEmails: () => Promise<false | Array<string>>;
export declare const toFill: (token: string) => Promise<void>;
export declare const createSurveyByKeys: (envKeys: Array<string>) => Promise<void>;
export declare const createSurvey: () => Promise<void>;
export declare const compressAnswers: (answers: Record<string, any>) => string;
export declare const decompressAnswers: (answers: string) => Record<string, any>;
export declare const fillSurvey: (token: string) => Promise<void>;
export declare const copyToClipboard: (text: string) => void;
export declare const saveToEnv: (data: Record<string, any>, envOutput: string) => void;
export declare const importSurvey: (encryptedToken: string, saveTo?: string) => Promise<void>;
export declare const fromEnv: (filepath?: string) => Promise<void>;
//# sourceMappingURL=index.d.ts.map