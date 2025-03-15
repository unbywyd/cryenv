export type InputFormat = "text" | "email" | "phone" | "number" | "integer" | "date" | "uuid" | "url";
export type QuestionType = "input" | "confirm" | "checkbox" | "list" | "password";
export type ControlFormat = InputFormat | "multiselect" | "select" | "password" | "confirm";
export type Question = {
    message: string;
    control: ControlFormat;
    name: string;
    default?: any;
    choices: Array<string> | undefined;
};
export declare function colorText(text: string, color: "yellow" | "gray" | "green" | "red"): string;
export declare const encryptAnswers: (helloKey: string, answers: Record<string, any>, publicKey: string) => string;
export declare const decryptAnswers: (encryptedData: string) => Promise<Record<string, any>>;
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
export declare const useFile: (name?: string) => Promise<void>;
export declare const requestEmails: () => Promise<false | Array<string>>;
export declare const toFill: (token: string) => Promise<void>;
export declare const createSurveyByKeys: (envKeys: Array<string>) => Promise<void>;
export declare const createSurvey: () => Promise<void>;
export declare const compressAnswers: (answers: Record<string, any>) => string;
export declare const decompressAnswers: (answers: string) => Record<string, any>;
export declare const fillSurvey: (token: string) => Promise<void>;
export declare const copyToClipboard: (text: string) => void;
export declare const saveToEnv: (data: Record<string, any>, envOutput: string) => Promise<void>;
export declare const importSurvey: (encryptedToken: string, saveTo?: string) => Promise<void>;
export declare const fromEnv: (filepath?: string) => Promise<void>;
//# sourceMappingURL=index.d.ts.map