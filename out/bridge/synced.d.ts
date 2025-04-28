type MutableSyncConstructor<T> = (player?: Player) => () => T;
export declare function createSynced<T>(useKey: string, init: T, writeableOn?: "server" | "client" | "client-server", throttleDelay?: number): MutableSyncConstructor<T>;
export declare function createGlobalSynced<T>(useKey: string, init: T): () => () => T;
export {};
