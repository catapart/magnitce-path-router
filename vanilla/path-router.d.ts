declare enum PathRouteEvent {
    BeforeOpen = "beforeopen",
    AfterOpen = "afteropen",
    BeforeClose = "beforeclose",
    AfterClose = "afterclose"
}
type RouteProperties = {
    [key: string]: string;
};
declare class PathRouteComponent extends HTMLElement {
    #private;
    get router(): PathRouterComponent | null;
    private blockingBeforeOpen;
    private blockingAfterOpen;
    private blockingBeforeClose;
    private blockingAfterClose;
    currentProcess: Promise<void>;
    canBeOpened: () => Promise<boolean>;
    canBeClosed: () => Promise<boolean>;
    constructor();
    open(path: string): Promise<boolean>;
    close(): Promise<boolean>;
    getProperties(targetPath: string): RouteProperties;
    createPathFromProperties(properties: RouteProperties): string;
    applyEventListener<K extends (keyof HTMLElementEventMap | 'beforeopen' | 'afteropen' | 'beforeclose' | 'afterclose')>(type: K, listener: (this: HTMLElement, ev: Event | CustomEvent) => void | Promise<void>, options?: boolean | AddEventListenerOptions | undefined): void;
    addBlockingEventListener(eventName: PathRouteEvent, handler: () => void | Promise<void>): void;
    applyBlockingEventListener(eventName: PathRouteEvent, handler: () => void | Promise<void>): void;
}

declare class RouteDialogComponent extends HTMLDialogElement {
    #private;
    get router(): PathRouterComponent | null;
    private blockingBeforeOpen;
    private blockingAfterOpen;
    private blockingBeforeClose;
    private blockingAfterClose;
    currentProcess: Promise<void>;
    canBeOpened: () => Promise<boolean>;
    canBeClosed: () => Promise<boolean>;
    constructor();
    openRoute(path: string): Promise<boolean>;
    closeRoute(): Promise<boolean>;
    getProperties(targetPath: string): RouteProperties;
    applyEventListener<K extends (keyof HTMLElementEventMap | 'beforeopen' | 'afteropen' | 'beforeclose' | 'afterclose')>(type: K, listener: (this: HTMLElement, ev: Event | CustomEvent) => void | Promise<void>, options?: boolean | AddEventListenerOptions | undefined): void;
    addBlockingEventListener(eventName: PathRouteEvent, handler: () => void | Promise<void>): void;
}

declare enum PathRouterEvent {
    /** Fires when a route is opened or closed.  */
    Change = "change",
    /** Fires when the router's path element is updated. */
    PathChange = "pathchange"
}
type PathRouterAttributes = {
    /** The target path for the router to route to. */
    path?: string;
};
declare const COMPONENT_TAG_NAME = "path-router";
declare class PathRouterComponent extends HTMLElement {
    get routes(): PathRouteComponent[];
    get routeDialogs(): RouteDialogComponent[];
    currentPathRoute: PathRouteComponent | undefined;
    currentRouteDialog: RouteDialogComponent | undefined;
    defaultRoute: PathRouteComponent | undefined;
    wildcardRoute: PathRouteComponent | undefined;
    constructor();
    /**
     * Navigate to a route path.
     * @param path route path
     */
    navigate(path: string): Promise<void>;
    getPathElement<T extends HTMLElement, K extends T[] = T[]>(path: string, elements: K): T;
    splitPath(path: string): {
        path: string;
        hash: string;
    };
    destructurePath(path: string): {
        pathName: string;
        hash: string;
    };
    pathIsActive(path: string): boolean;
    private init;
    private update;
    private openRoute;
    private openRouteDialog;
    private setPath;
    private closeCurrentPathRoute;
    private closeCurrentRouteDialog;
}

export { COMPONENT_TAG_NAME, type PathRouterAttributes, PathRouterComponent, PathRouterEvent };
