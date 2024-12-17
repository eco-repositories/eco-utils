export type WithOptional<Value extends object, Key extends keyof Value> = Omit<Value, Key> & Partial<Pick<Value, Key>>
