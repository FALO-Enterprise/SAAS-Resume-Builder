export const MODULES_NAMES = {
    auth: 'AUTH',
    user: 'USER',
    resume: 'RESUME',
    template: 'TEMPLATE',
    plan: "PLAN",
    subscription: 'SUBSCRIPTION',
} as const;

export type ModuleNameType = typeof MODULES_NAMES[keyof typeof MODULES_NAMES];


export const ROLES_NAMES = {
    admin: "ADMIN",
    user: "USER"
} as const
export type RolesNamesType = typeof ROLES_NAMES[keyof typeof ROLES_NAMES]