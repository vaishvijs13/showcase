import { z } from 'zod';
export declare const AuthConfigSchema: z.ZodObject<{
    type: z.ZodEnum<["cookie", "script", "magic"]>;
    cookieData: z.ZodOptional<z.ZodString>;
    loginScript: z.ZodOptional<z.ZodString>;
    magicLinkEmail: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "cookie" | "script" | "magic";
    cookieData?: string | undefined;
    loginScript?: string | undefined;
    magicLinkEmail?: string | undefined;
}, {
    type: "cookie" | "script" | "magic";
    cookieData?: string | undefined;
    loginScript?: string | undefined;
    magicLinkEmail?: string | undefined;
}>;
export declare const SecretsSchema: z.ZodObject<{
    token: z.ZodString;
    encryptedData: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    encryptedData: string;
}, {
    token: string;
    encryptedData: string;
}>;
export declare const FrameworkSchema: z.ZodEnum<["next", "express", "django", "flask", "react", "vue", "angular", "other"]>;
export declare const RouteSchema: z.ZodObject<{
    path: z.ZodString;
    method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    description?: string | undefined;
}, {
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    description?: string | undefined;
}>;
export declare const FeatureSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodString;
    routes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        description?: string | undefined;
    }, {
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        description?: string | undefined;
    }>, "many">>;
    files: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    name: string;
    category: string;
    routes?: {
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        description?: string | undefined;
    }[] | undefined;
    files?: string[] | undefined;
}, {
    description: string;
    name: string;
    category: string;
    routes?: {
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        description?: string | undefined;
    }[] | undefined;
    files?: string[] | undefined;
}>;
export declare const RepoAnalysisSchema: z.ZodObject<{
    framework: z.ZodEnum<["next", "express", "django", "flask", "react", "vue", "angular", "other"]>;
    features: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        category: z.ZodString;
        routes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
            description?: string | undefined;
        }, {
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
            description?: string | undefined;
        }>, "many">>;
        files: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        name: string;
        category: string;
        routes?: {
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
            description?: string | undefined;
        }[] | undefined;
        files?: string[] | undefined;
    }, {
        description: string;
        name: string;
        category: string;
        routes?: {
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
            description?: string | undefined;
        }[] | undefined;
        files?: string[] | undefined;
    }>, "many">;
    routes: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        description?: string | undefined;
    }, {
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        description?: string | undefined;
    }>, "many">;
    hasOpenAPI: z.ZodBoolean;
    readmeContent: z.ZodOptional<z.ZodString>;
    quickStartPath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    routes: {
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        description?: string | undefined;
    }[];
    framework: "next" | "express" | "django" | "flask" | "react" | "vue" | "angular" | "other";
    features: {
        description: string;
        name: string;
        category: string;
        routes?: {
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
            description?: string | undefined;
        }[] | undefined;
        files?: string[] | undefined;
    }[];
    hasOpenAPI: boolean;
    readmeContent?: string | undefined;
    quickStartPath?: string | undefined;
}, {
    routes: {
        path: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        description?: string | undefined;
    }[];
    framework: "next" | "express" | "django" | "flask" | "react" | "vue" | "angular" | "other";
    features: {
        description: string;
        name: string;
        category: string;
        routes?: {
            path: string;
            method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
            description?: string | undefined;
        }[] | undefined;
        files?: string[] | undefined;
    }[];
    hasOpenAPI: boolean;
    readmeContent?: string | undefined;
    quickStartPath?: string | undefined;
}>;
export declare const LocatorSchema: z.ZodObject<{
    type: z.ZodEnum<["role", "text", "testId", "selector"]>;
    value: z.ZodString;
    fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "role" | "text" | "testId" | "selector";
    value: string;
    fallbacks?: string[] | undefined;
}, {
    type: "role" | "text" | "testId" | "selector";
    value: string;
    fallbacks?: string[] | undefined;
}>;
export declare const PageElementSchema: z.ZodObject<{
    type: z.ZodEnum<["heading", "nav", "button", "link", "form", "input"]>;
    text: z.ZodOptional<z.ZodString>;
    locator: z.ZodObject<{
        type: z.ZodEnum<["role", "text", "testId", "selector"]>;
        value: z.ZodString;
        fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "role" | "text" | "testId" | "selector";
        value: string;
        fallbacks?: string[] | undefined;
    }, {
        type: "role" | "text" | "testId" | "selector";
        value: string;
        fallbacks?: string[] | undefined;
    }>;
    url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "heading" | "nav" | "button" | "link" | "form" | "input";
    locator: {
        type: "role" | "text" | "testId" | "selector";
        value: string;
        fallbacks?: string[] | undefined;
    };
    text?: string | undefined;
    url?: string | undefined;
}, {
    type: "heading" | "nav" | "button" | "link" | "form" | "input";
    locator: {
        type: "role" | "text" | "testId" | "selector";
        value: string;
        fallbacks?: string[] | undefined;
    };
    text?: string | undefined;
    url?: string | undefined;
}>;
export declare const CrawledPageSchema: z.ZodObject<{
    url: z.ZodString;
    title: z.ZodString;
    elements: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["heading", "nav", "button", "link", "form", "input"]>;
        text: z.ZodOptional<z.ZodString>;
        locator: z.ZodObject<{
            type: z.ZodEnum<["role", "text", "testId", "selector"]>;
            value: z.ZodString;
            fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }>;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "heading" | "nav" | "button" | "link" | "form" | "input";
        locator: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        };
        text?: string | undefined;
        url?: string | undefined;
    }, {
        type: "heading" | "nav" | "button" | "link" | "form" | "input";
        locator: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        };
        text?: string | undefined;
        url?: string | undefined;
    }>, "many">;
    depth: z.ZodNumber;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    title: string;
    elements: {
        type: "heading" | "nav" | "button" | "link" | "form" | "input";
        locator: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        };
        text?: string | undefined;
        url?: string | undefined;
    }[];
    depth: number;
    timestamp: string;
}, {
    url: string;
    title: string;
    elements: {
        type: "heading" | "nav" | "button" | "link" | "form" | "input";
        locator: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        };
        text?: string | undefined;
        url?: string | undefined;
    }[];
    depth: number;
    timestamp: string;
}>;
export declare const CrawlSummarySchema: z.ZodObject<{
    baseUrl: z.ZodString;
    pages: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        title: z.ZodString;
        elements: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["heading", "nav", "button", "link", "form", "input"]>;
            text: z.ZodOptional<z.ZodString>;
            locator: z.ZodObject<{
                type: z.ZodEnum<["role", "text", "testId", "selector"]>;
                value: z.ZodString;
                fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            }, {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            }>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "heading" | "nav" | "button" | "link" | "form" | "input";
            locator: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            };
            text?: string | undefined;
            url?: string | undefined;
        }, {
            type: "heading" | "nav" | "button" | "link" | "form" | "input";
            locator: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            };
            text?: string | undefined;
            url?: string | undefined;
        }>, "many">;
        depth: z.ZodNumber;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        title: string;
        elements: {
            type: "heading" | "nav" | "button" | "link" | "form" | "input";
            locator: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            };
            text?: string | undefined;
            url?: string | undefined;
        }[];
        depth: number;
        timestamp: string;
    }, {
        url: string;
        title: string;
        elements: {
            type: "heading" | "nav" | "button" | "link" | "form" | "input";
            locator: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            };
            text?: string | undefined;
            url?: string | undefined;
        }[];
        depth: number;
        timestamp: string;
    }>, "many">;
    totalPages: z.ZodNumber;
    maxDepth: z.ZodNumber;
    crawlDuration: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    baseUrl: string;
    pages: {
        url: string;
        title: string;
        elements: {
            type: "heading" | "nav" | "button" | "link" | "form" | "input";
            locator: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            };
            text?: string | undefined;
            url?: string | undefined;
        }[];
        depth: number;
        timestamp: string;
    }[];
    totalPages: number;
    maxDepth: number;
    crawlDuration: number;
}, {
    baseUrl: string;
    pages: {
        url: string;
        title: string;
        elements: {
            type: "heading" | "nav" | "button" | "link" | "form" | "input";
            locator: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            };
            text?: string | undefined;
            url?: string | undefined;
        }[];
        depth: number;
        timestamp: string;
    }[];
    totalPages: number;
    maxDepth: number;
    crawlDuration: number;
}>;
export declare const ActionSchema: z.ZodObject<{
    type: z.ZodEnum<["click", "type", "navigate", "wait", "assert", "scroll"]>;
    locator: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["role", "text", "testId", "selector"]>;
        value: z.ZodString;
        fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "role" | "text" | "testId" | "selector";
        value: string;
        fallbacks?: string[] | undefined;
    }, {
        type: "role" | "text" | "testId" | "selector";
        value: string;
        fallbacks?: string[] | undefined;
    }>>;
    value: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
    description: string;
    value?: string | undefined;
    locator?: {
        type: "role" | "text" | "testId" | "selector";
        value: string;
        fallbacks?: string[] | undefined;
    } | undefined;
    timeout?: number | undefined;
}, {
    type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
    description: string;
    value?: string | undefined;
    locator?: {
        type: "role" | "text" | "testId" | "selector";
        value: string;
        fallbacks?: string[] | undefined;
    } | undefined;
    timeout?: number | undefined;
}>;
export declare const SceneSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["click", "type", "navigate", "wait", "assert", "scroll"]>;
        locator: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["role", "text", "testId", "selector"]>;
            value: z.ZodString;
            fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }>>;
        value: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }, {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }>, "many">;
    expectedOutcome: z.ZodString;
    blurSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    id: string;
    actions: {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }[];
    expectedOutcome: string;
    blurSelectors?: string[] | undefined;
}, {
    description: string;
    title: string;
    id: string;
    actions: {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }[];
    expectedOutcome: string;
    blurSelectors?: string[] | undefined;
}>;
export declare const StoryboardSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    baseUrl: z.ZodString;
    scenes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        actions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["click", "type", "navigate", "wait", "assert", "scroll"]>;
            locator: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["role", "text", "testId", "selector"]>;
                value: z.ZodString;
                fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            }, {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            }>>;
            value: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }, {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }>, "many">;
        expectedOutcome: z.ZodString;
        blurSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        title: string;
        id: string;
        actions: {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }[];
        expectedOutcome: string;
        blurSelectors?: string[] | undefined;
    }, {
        description: string;
        title: string;
        id: string;
        actions: {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }[];
        expectedOutcome: string;
        blurSelectors?: string[] | undefined;
    }>, "many">;
    globalBlurSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    baseUrl: string;
    scenes: {
        description: string;
        title: string;
        id: string;
        actions: {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }[];
        expectedOutcome: string;
        blurSelectors?: string[] | undefined;
    }[];
    globalBlurSelectors?: string[] | undefined;
}, {
    description: string;
    title: string;
    baseUrl: string;
    scenes: {
        description: string;
        title: string;
        id: string;
        actions: {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }[];
        expectedOutcome: string;
        blurSelectors?: string[] | undefined;
    }[];
    globalBlurSelectors?: string[] | undefined;
}>;
export declare const PersonaConfigSchema: z.ZodObject<{
    role: z.ZodString;
    purpose: z.ZodString;
    tone: z.ZodDefault<z.ZodEnum<["professional", "casual", "educational", "enthusiastic"]>>;
    length: z.ZodDefault<z.ZodEnum<["short", "medium", "long"]>>;
}, "strip", z.ZodTypeAny, {
    length: "short" | "medium" | "long";
    role: string;
    purpose: string;
    tone: "professional" | "casual" | "educational" | "enthusiastic";
}, {
    role: string;
    purpose: string;
    length?: "short" | "medium" | "long" | undefined;
    tone?: "professional" | "casual" | "educational" | "enthusiastic" | undefined;
}>;
export declare const MusicConfigSchema: z.ZodObject<{
    style: z.ZodDefault<z.ZodString>;
    volume: z.ZodDefault<z.ZodNumber>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    style: string;
    volume: number;
    enabled: boolean;
}, {
    style?: string | undefined;
    volume?: number | undefined;
    enabled?: boolean | undefined;
}>;
export declare const JobConfigSchema: z.ZodObject<{
    id: z.ZodString;
    repoUrl: z.ZodOptional<z.ZodString>;
    appUrl: z.ZodOptional<z.ZodString>;
    persona: z.ZodObject<{
        role: z.ZodString;
        purpose: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<["professional", "casual", "educational", "enthusiastic"]>>;
        length: z.ZodDefault<z.ZodEnum<["short", "medium", "long"]>>;
    }, "strip", z.ZodTypeAny, {
        length: "short" | "medium" | "long";
        role: string;
        purpose: string;
        tone: "professional" | "casual" | "educational" | "enthusiastic";
    }, {
        role: string;
        purpose: string;
        length?: "short" | "medium" | "long" | undefined;
        tone?: "professional" | "casual" | "educational" | "enthusiastic" | undefined;
    }>;
    music: z.ZodOptional<z.ZodObject<{
        style: z.ZodDefault<z.ZodString>;
        volume: z.ZodDefault<z.ZodNumber>;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        style: string;
        volume: number;
        enabled: boolean;
    }, {
        style?: string | undefined;
        volume?: number | undefined;
        enabled?: boolean | undefined;
    }>>;
    auth: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["cookie", "script", "magic"]>;
        cookieData: z.ZodOptional<z.ZodString>;
        loginScript: z.ZodOptional<z.ZodString>;
        magicLinkEmail: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "cookie" | "script" | "magic";
        cookieData?: string | undefined;
        loginScript?: string | undefined;
        magicLinkEmail?: string | undefined;
    }, {
        type: "cookie" | "script" | "magic";
        cookieData?: string | undefined;
        loginScript?: string | undefined;
        magicLinkEmail?: string | undefined;
    }>>;
    storyboard: z.ZodOptional<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        baseUrl: z.ZodString;
        scenes: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            actions: z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["click", "type", "navigate", "wait", "assert", "scroll"]>;
                locator: z.ZodOptional<z.ZodObject<{
                    type: z.ZodEnum<["role", "text", "testId", "selector"]>;
                    value: z.ZodString;
                    fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                }, "strip", z.ZodTypeAny, {
                    type: "role" | "text" | "testId" | "selector";
                    value: string;
                    fallbacks?: string[] | undefined;
                }, {
                    type: "role" | "text" | "testId" | "selector";
                    value: string;
                    fallbacks?: string[] | undefined;
                }>>;
                value: z.ZodOptional<z.ZodString>;
                timeout: z.ZodOptional<z.ZodNumber>;
                description: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
                description: string;
                value?: string | undefined;
                locator?: {
                    type: "role" | "text" | "testId" | "selector";
                    value: string;
                    fallbacks?: string[] | undefined;
                } | undefined;
                timeout?: number | undefined;
            }, {
                type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
                description: string;
                value?: string | undefined;
                locator?: {
                    type: "role" | "text" | "testId" | "selector";
                    value: string;
                    fallbacks?: string[] | undefined;
                } | undefined;
                timeout?: number | undefined;
            }>, "many">;
            expectedOutcome: z.ZodString;
            blurSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            title: string;
            id: string;
            actions: {
                type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
                description: string;
                value?: string | undefined;
                locator?: {
                    type: "role" | "text" | "testId" | "selector";
                    value: string;
                    fallbacks?: string[] | undefined;
                } | undefined;
                timeout?: number | undefined;
            }[];
            expectedOutcome: string;
            blurSelectors?: string[] | undefined;
        }, {
            description: string;
            title: string;
            id: string;
            actions: {
                type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
                description: string;
                value?: string | undefined;
                locator?: {
                    type: "role" | "text" | "testId" | "selector";
                    value: string;
                    fallbacks?: string[] | undefined;
                } | undefined;
                timeout?: number | undefined;
            }[];
            expectedOutcome: string;
            blurSelectors?: string[] | undefined;
        }>, "many">;
        globalBlurSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        title: string;
        baseUrl: string;
        scenes: {
            description: string;
            title: string;
            id: string;
            actions: {
                type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
                description: string;
                value?: string | undefined;
                locator?: {
                    type: "role" | "text" | "testId" | "selector";
                    value: string;
                    fallbacks?: string[] | undefined;
                } | undefined;
                timeout?: number | undefined;
            }[];
            expectedOutcome: string;
            blurSelectors?: string[] | undefined;
        }[];
        globalBlurSelectors?: string[] | undefined;
    }, {
        description: string;
        title: string;
        baseUrl: string;
        scenes: {
            description: string;
            title: string;
            id: string;
            actions: {
                type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
                description: string;
                value?: string | undefined;
                locator?: {
                    type: "role" | "text" | "testId" | "selector";
                    value: string;
                    fallbacks?: string[] | undefined;
                } | undefined;
                timeout?: number | undefined;
            }[];
            expectedOutcome: string;
            blurSelectors?: string[] | undefined;
        }[];
        globalBlurSelectors?: string[] | undefined;
    }>>;
    outputDir: z.ZodString;
    createdAt: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["pending", "ingesting", "crawling", "planning", "generating", "recording", "composing", "complete", "error"]>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "ingesting" | "crawling" | "planning" | "generating" | "recording" | "composing" | "complete" | "error";
    id: string;
    persona: {
        length: "short" | "medium" | "long";
        role: string;
        purpose: string;
        tone: "professional" | "casual" | "educational" | "enthusiastic";
    };
    outputDir: string;
    createdAt: string;
    repoUrl?: string | undefined;
    appUrl?: string | undefined;
    music?: {
        style: string;
        volume: number;
        enabled: boolean;
    } | undefined;
    auth?: {
        type: "cookie" | "script" | "magic";
        cookieData?: string | undefined;
        loginScript?: string | undefined;
        magicLinkEmail?: string | undefined;
    } | undefined;
    storyboard?: {
        description: string;
        title: string;
        baseUrl: string;
        scenes: {
            description: string;
            title: string;
            id: string;
            actions: {
                type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
                description: string;
                value?: string | undefined;
                locator?: {
                    type: "role" | "text" | "testId" | "selector";
                    value: string;
                    fallbacks?: string[] | undefined;
                } | undefined;
                timeout?: number | undefined;
            }[];
            expectedOutcome: string;
            blurSelectors?: string[] | undefined;
        }[];
        globalBlurSelectors?: string[] | undefined;
    } | undefined;
}, {
    id: string;
    persona: {
        role: string;
        purpose: string;
        length?: "short" | "medium" | "long" | undefined;
        tone?: "professional" | "casual" | "educational" | "enthusiastic" | undefined;
    };
    outputDir: string;
    createdAt: string;
    status?: "pending" | "ingesting" | "crawling" | "planning" | "generating" | "recording" | "composing" | "complete" | "error" | undefined;
    repoUrl?: string | undefined;
    appUrl?: string | undefined;
    music?: {
        style?: string | undefined;
        volume?: number | undefined;
        enabled?: boolean | undefined;
    } | undefined;
    auth?: {
        type: "cookie" | "script" | "magic";
        cookieData?: string | undefined;
        loginScript?: string | undefined;
        magicLinkEmail?: string | undefined;
    } | undefined;
    storyboard?: {
        description: string;
        title: string;
        baseUrl: string;
        scenes: {
            description: string;
            title: string;
            id: string;
            actions: {
                type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
                description: string;
                value?: string | undefined;
                locator?: {
                    type: "role" | "text" | "testId" | "selector";
                    value: string;
                    fallbacks?: string[] | undefined;
                } | undefined;
                timeout?: number | undefined;
            }[];
            expectedOutcome: string;
            blurSelectors?: string[] | undefined;
        }[];
        globalBlurSelectors?: string[] | undefined;
    } | undefined;
}>;
export declare const RecordingResultSchema: z.ZodObject<{
    sceneId: z.ZodString;
    videoPath: z.ZodString;
    tracePath: z.ZodString;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    retryCount: z.ZodNumber;
    duration: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sceneId: string;
    videoPath: string;
    tracePath: string;
    success: boolean;
    retryCount: number;
    duration: number;
    error?: string | undefined;
}, {
    sceneId: string;
    videoPath: string;
    tracePath: string;
    success: boolean;
    retryCount: number;
    duration: number;
    error?: string | undefined;
}>;
export declare const JobResultSchema: z.ZodObject<{
    jobId: z.ZodString;
    featuresPath: z.ZodOptional<z.ZodString>;
    quickstartPath: z.ZodOptional<z.ZodString>;
    crawlPath: z.ZodOptional<z.ZodString>;
    recordings: z.ZodArray<z.ZodObject<{
        sceneId: z.ZodString;
        videoPath: z.ZodString;
        tracePath: z.ZodString;
        success: z.ZodBoolean;
        error: z.ZodOptional<z.ZodString>;
        retryCount: z.ZodNumber;
        duration: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sceneId: string;
        videoPath: string;
        tracePath: string;
        success: boolean;
        retryCount: number;
        duration: number;
        error?: string | undefined;
    }, {
        sceneId: string;
        videoPath: string;
        tracePath: string;
        success: boolean;
        retryCount: number;
        duration: number;
        error?: string | undefined;
    }>, "many">;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    jobId: string;
    recordings: {
        sceneId: string;
        videoPath: string;
        tracePath: string;
        success: boolean;
        retryCount: number;
        duration: number;
        error?: string | undefined;
    }[];
    error?: string | undefined;
    featuresPath?: string | undefined;
    quickstartPath?: string | undefined;
    crawlPath?: string | undefined;
}, {
    success: boolean;
    jobId: string;
    recordings: {
        sceneId: string;
        videoPath: string;
        tracePath: string;
        success: boolean;
        retryCount: number;
        duration: number;
        error?: string | undefined;
    }[];
    error?: string | undefined;
    featuresPath?: string | undefined;
    quickstartPath?: string | undefined;
    crawlPath?: string | undefined;
}>;
export declare const RepairRequestSchema: z.ZodObject<{
    sceneId: z.ZodString;
    failedAction: z.ZodObject<{
        type: z.ZodEnum<["click", "type", "navigate", "wait", "assert", "scroll"]>;
        locator: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["role", "text", "testId", "selector"]>;
            value: z.ZodString;
            fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }>>;
        value: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }, {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }>;
    domSnippet: z.ZodString;
    error: z.ZodString;
    retryCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    error: string;
    sceneId: string;
    retryCount: number;
    failedAction: {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    };
    domSnippet: string;
}, {
    error: string;
    sceneId: string;
    retryCount: number;
    failedAction: {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    };
    domSnippet: string;
}>;
export declare const RepairResponseSchema: z.ZodObject<{
    suggestedAction: z.ZodObject<{
        type: z.ZodEnum<["click", "type", "navigate", "wait", "assert", "scroll"]>;
        locator: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["role", "text", "testId", "selector"]>;
            value: z.ZodString;
            fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }>>;
        value: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }, {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }>;
    confidence: z.ZodNumber;
    reasoning: z.ZodString;
}, "strip", z.ZodTypeAny, {
    suggestedAction: {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    };
    confidence: number;
    reasoning: string;
}, {
    suggestedAction: {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    };
    confidence: number;
    reasoning: string;
}>;
export declare const PresenterSceneSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"presenter">;
    title: z.ZodString;
    description: z.ZodString;
    voiceover_ssml: z.ZodString;
    duration_seconds: z.ZodNumber;
    avatar_style: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "presenter";
    description: string;
    title: string;
    id: string;
    voiceover_ssml: string;
    duration_seconds: number;
    avatar_style?: string | undefined;
}, {
    type: "presenter";
    description: string;
    title: string;
    id: string;
    voiceover_ssml: string;
    duration_seconds: number;
    avatar_style?: string | undefined;
}>;
export declare const ScreenDemoSceneSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"screen_demo">;
    title: z.ZodString;
    description: z.ZodString;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["click", "type", "navigate", "wait", "assert", "scroll"]>;
        locator: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["role", "text", "testId", "selector"]>;
            value: z.ZodString;
            fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }>>;
        value: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }, {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }>, "many">;
    expectedOutcome: z.ZodString;
    blurSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    duration_seconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "screen_demo";
    description: string;
    title: string;
    id: string;
    actions: {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }[];
    expectedOutcome: string;
    blurSelectors?: string[] | undefined;
    duration_seconds?: number | undefined;
}, {
    type: "screen_demo";
    description: string;
    title: string;
    id: string;
    actions: {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }[];
    expectedOutcome: string;
    blurSelectors?: string[] | undefined;
    duration_seconds?: number | undefined;
}>;
export declare const EnhancedSceneSchema: z.ZodUnion<[z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"presenter">;
    title: z.ZodString;
    description: z.ZodString;
    voiceover_ssml: z.ZodString;
    duration_seconds: z.ZodNumber;
    avatar_style: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "presenter";
    description: string;
    title: string;
    id: string;
    voiceover_ssml: string;
    duration_seconds: number;
    avatar_style?: string | undefined;
}, {
    type: "presenter";
    description: string;
    title: string;
    id: string;
    voiceover_ssml: string;
    duration_seconds: number;
    avatar_style?: string | undefined;
}>, z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"screen_demo">;
    title: z.ZodString;
    description: z.ZodString;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["click", "type", "navigate", "wait", "assert", "scroll"]>;
        locator: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["role", "text", "testId", "selector"]>;
            value: z.ZodString;
            fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }, {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        }>>;
        value: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }, {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }>, "many">;
    expectedOutcome: z.ZodString;
    blurSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    duration_seconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "screen_demo";
    description: string;
    title: string;
    id: string;
    actions: {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }[];
    expectedOutcome: string;
    blurSelectors?: string[] | undefined;
    duration_seconds?: number | undefined;
}, {
    type: "screen_demo";
    description: string;
    title: string;
    id: string;
    actions: {
        type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
        description: string;
        value?: string | undefined;
        locator?: {
            type: "role" | "text" | "testId" | "selector";
            value: string;
            fallbacks?: string[] | undefined;
        } | undefined;
        timeout?: number | undefined;
    }[];
    expectedOutcome: string;
    blurSelectors?: string[] | undefined;
    duration_seconds?: number | undefined;
}>]>;
export declare const EnhancedStoryboardSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    baseUrl: z.ZodString;
    persona: z.ZodObject<{
        role: z.ZodString;
        purpose: z.ZodString;
        tone: z.ZodDefault<z.ZodEnum<["professional", "casual", "educational", "enthusiastic"]>>;
        length: z.ZodDefault<z.ZodEnum<["short", "medium", "long"]>>;
    }, "strip", z.ZodTypeAny, {
        length: "short" | "medium" | "long";
        role: string;
        purpose: string;
        tone: "professional" | "casual" | "educational" | "enthusiastic";
    }, {
        role: string;
        purpose: string;
        length?: "short" | "medium" | "long" | undefined;
        tone?: "professional" | "casual" | "educational" | "enthusiastic" | undefined;
    }>;
    music: z.ZodObject<{
        style: z.ZodDefault<z.ZodString>;
        volume: z.ZodDefault<z.ZodNumber>;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        style: string;
        volume: number;
        enabled: boolean;
    }, {
        style?: string | undefined;
        volume?: number | undefined;
        enabled?: boolean | undefined;
    }>;
    scenes: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"presenter">;
        title: z.ZodString;
        description: z.ZodString;
        voiceover_ssml: z.ZodString;
        duration_seconds: z.ZodNumber;
        avatar_style: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "presenter";
        description: string;
        title: string;
        id: string;
        voiceover_ssml: string;
        duration_seconds: number;
        avatar_style?: string | undefined;
    }, {
        type: "presenter";
        description: string;
        title: string;
        id: string;
        voiceover_ssml: string;
        duration_seconds: number;
        avatar_style?: string | undefined;
    }>, z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"screen_demo">;
        title: z.ZodString;
        description: z.ZodString;
        actions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["click", "type", "navigate", "wait", "assert", "scroll"]>;
            locator: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["role", "text", "testId", "selector"]>;
                value: z.ZodString;
                fallbacks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            }, {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            }>>;
            value: z.ZodOptional<z.ZodString>;
            timeout: z.ZodOptional<z.ZodNumber>;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }, {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }>, "many">;
        expectedOutcome: z.ZodString;
        blurSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        duration_seconds: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "screen_demo";
        description: string;
        title: string;
        id: string;
        actions: {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }[];
        expectedOutcome: string;
        blurSelectors?: string[] | undefined;
        duration_seconds?: number | undefined;
    }, {
        type: "screen_demo";
        description: string;
        title: string;
        id: string;
        actions: {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }[];
        expectedOutcome: string;
        blurSelectors?: string[] | undefined;
        duration_seconds?: number | undefined;
    }>]>, "many">;
    totalDuration: z.ZodNumber;
    globalBlurSelectors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    baseUrl: string;
    scenes: ({
        type: "presenter";
        description: string;
        title: string;
        id: string;
        voiceover_ssml: string;
        duration_seconds: number;
        avatar_style?: string | undefined;
    } | {
        type: "screen_demo";
        description: string;
        title: string;
        id: string;
        actions: {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }[];
        expectedOutcome: string;
        blurSelectors?: string[] | undefined;
        duration_seconds?: number | undefined;
    })[];
    persona: {
        length: "short" | "medium" | "long";
        role: string;
        purpose: string;
        tone: "professional" | "casual" | "educational" | "enthusiastic";
    };
    music: {
        style: string;
        volume: number;
        enabled: boolean;
    };
    totalDuration: number;
    globalBlurSelectors?: string[] | undefined;
}, {
    description: string;
    title: string;
    baseUrl: string;
    scenes: ({
        type: "presenter";
        description: string;
        title: string;
        id: string;
        voiceover_ssml: string;
        duration_seconds: number;
        avatar_style?: string | undefined;
    } | {
        type: "screen_demo";
        description: string;
        title: string;
        id: string;
        actions: {
            type: "type" | "click" | "navigate" | "wait" | "assert" | "scroll";
            description: string;
            value?: string | undefined;
            locator?: {
                type: "role" | "text" | "testId" | "selector";
                value: string;
                fallbacks?: string[] | undefined;
            } | undefined;
            timeout?: number | undefined;
        }[];
        expectedOutcome: string;
        blurSelectors?: string[] | undefined;
        duration_seconds?: number | undefined;
    })[];
    persona: {
        role: string;
        purpose: string;
        length?: "short" | "medium" | "long" | undefined;
        tone?: "professional" | "casual" | "educational" | "enthusiastic" | undefined;
    };
    music: {
        style?: string | undefined;
        volume?: number | undefined;
        enabled?: boolean | undefined;
    };
    totalDuration: number;
    globalBlurSelectors?: string[] | undefined;
}>;
export declare const FeatureCandidateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    rationale: z.ZodString;
    primaryPath: z.ZodString;
    category: z.ZodEnum<["core", "user-facing", "admin", "api", "integration"]>;
    priority: z.ZodNumber;
    demoable: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    description: string;
    name: string;
    category: "core" | "user-facing" | "admin" | "api" | "integration";
    rationale: string;
    primaryPath: string;
    priority: number;
    demoable: boolean;
}, {
    description: string;
    name: string;
    category: "core" | "user-facing" | "admin" | "api" | "integration";
    rationale: string;
    primaryPath: string;
    priority: number;
    demoable: boolean;
}>;
export declare const FeatureCandidatesSchema: z.ZodObject<{
    repository: z.ZodString;
    framework: z.ZodEnum<["next", "express", "django", "flask", "react", "vue", "angular", "other"]>;
    totalFeatures: z.ZodNumber;
    features: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        rationale: z.ZodString;
        primaryPath: z.ZodString;
        category: z.ZodEnum<["core", "user-facing", "admin", "api", "integration"]>;
        priority: z.ZodNumber;
        demoable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        description: string;
        name: string;
        category: "core" | "user-facing" | "admin" | "api" | "integration";
        rationale: string;
        primaryPath: string;
        priority: number;
        demoable: boolean;
    }, {
        description: string;
        name: string;
        category: "core" | "user-facing" | "admin" | "api" | "integration";
        rationale: string;
        primaryPath: string;
        priority: number;
        demoable: boolean;
    }>, "many">;
    analysisConfidence: z.ZodNumber;
    generatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    framework: "next" | "express" | "django" | "flask" | "react" | "vue" | "angular" | "other";
    features: {
        description: string;
        name: string;
        category: "core" | "user-facing" | "admin" | "api" | "integration";
        rationale: string;
        primaryPath: string;
        priority: number;
        demoable: boolean;
    }[];
    repository: string;
    totalFeatures: number;
    analysisConfidence: number;
    generatedAt: string;
}, {
    framework: "next" | "express" | "django" | "flask" | "react" | "vue" | "angular" | "other";
    features: {
        description: string;
        name: string;
        category: "core" | "user-facing" | "admin" | "api" | "integration";
        rationale: string;
        primaryPath: string;
        priority: number;
        demoable: boolean;
    }[];
    repository: string;
    totalFeatures: number;
    analysisConfidence: number;
    generatedAt: string;
}>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type Secrets = z.infer<typeof SecretsSchema>;
export type Framework = z.infer<typeof FrameworkSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type Feature = z.infer<typeof FeatureSchema>;
export type RepoAnalysis = z.infer<typeof RepoAnalysisSchema>;
export type Locator = z.infer<typeof LocatorSchema>;
export type PageElement = z.infer<typeof PageElementSchema>;
export type CrawledPage = z.infer<typeof CrawledPageSchema>;
export type CrawlSummary = z.infer<typeof CrawlSummarySchema>;
export type Action = z.infer<typeof ActionSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Storyboard = z.infer<typeof StoryboardSchema>;
export type JobConfig = z.infer<typeof JobConfigSchema>;
export type RecordingResult = z.infer<typeof RecordingResultSchema>;
export type JobResult = z.infer<typeof JobResultSchema>;
export type RepairRequest = z.infer<typeof RepairRequestSchema>;
export type RepairResponse = z.infer<typeof RepairResponseSchema>;
export type PersonaConfig = z.infer<typeof PersonaConfigSchema>;
export type MusicConfig = z.infer<typeof MusicConfigSchema>;
export type PresenterScene = z.infer<typeof PresenterSceneSchema>;
export type ScreenDemoScene = z.infer<typeof ScreenDemoSceneSchema>;
export type EnhancedScene = z.infer<typeof EnhancedSceneSchema>;
export type EnhancedStoryboard = z.infer<typeof EnhancedStoryboardSchema>;
export type FeatureCandidate = z.infer<typeof FeatureCandidateSchema>;
export type FeatureCandidates = z.infer<typeof FeatureCandidatesSchema>;
//# sourceMappingURL=index.d.ts.map