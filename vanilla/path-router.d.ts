declare enum PathRouteEvent {
    BeforeOpen = "beforeopen",
    AfterOpen = "afteropen",
    BeforeClose = "beforeclose",
    AfterClose = "afterclose"
}
type RouteProperties = {
    [key: string]: string;
};
declare class RoutePageElement extends HTMLElement {
    #private;
    get router(): PathRouterElement | null;
    private blockingBeforeOpen;
    private blockingAfterOpen;
    private blockingBeforeClose;
    private blockingAfterClose;
    currentProcess: Promise<void>;
    canBeOpened: () => Promise<boolean>;
    canBeClosed: () => Promise<boolean>;
    subrouting: boolean;
    currentProperties: RouteProperties | undefined;
    constructor();
    open(path: string): Promise<boolean>;
    close(): Promise<boolean>;
    getProperties(targetPath: string): RouteProperties;
    extractSubroute(targetPath: string): string;
    applyEventListener<K extends (keyof HTMLElementEventMap | 'beforeopen' | 'afteropen' | 'beforeclose' | 'afterclose')>(type: K, listener: (this: HTMLElement, ev: Event | CustomEvent) => void | Promise<void>, options?: boolean | AddEventListenerOptions | undefined): void;
    addBlockingEventListener(eventName: PathRouteEvent, handler: () => void | Promise<void>): void;
    applyBlockingEventListener(eventName: PathRouteEvent, handler: () => void | Promise<void>): void;
}

declare class RouteDialogComponent extends HTMLDialogElement {
    #private;
    get router(): PathRouterElement | null;
    private blockingBeforeOpen;
    private blockingAfterOpen;
    private blockingBeforeClose;
    private blockingAfterClose;
    currentProcess: Promise<void>;
    canBeOpened: () => Promise<boolean>;
    canBeClosed: () => Promise<boolean>;
    currentProperties: RouteProperties | undefined;
    constructor();
    openRoute(path: string): Promise<boolean>;
    closeRoute(): Promise<boolean>;
    getProperties(targetPath: string): RouteProperties;
    extractSubroute(targetPath: string): string;
    applyEventListener<K extends (keyof HTMLElementEventMap | 'beforeopen' | 'afteropen' | 'beforeclose' | 'afterclose')>(type: K, listener: (this: HTMLElement, ev: Event | CustomEvent) => void | Promise<void>, options?: boolean | AddEventListenerOptions | undefined): void;
    addBlockingEventListener(eventName: PathRouteEvent, handler: () => void | Promise<void>): void;
}

declare enum PathRouterEvent {
    /** Fires when a route is opened or closed.  */
    Change = "change",
    /** Fires when the router's `path` attribute is updated. */
    PathChange = "pathchange",
    /** Fires when the router's `path` attribute is combined with all subroute paths to update the `composed-path` attribute. */
    PathCompose = "pathcompose"
}
type PathRouterAttributes = {
    /** The target path for the router to route to. */
    path?: string;
    /** The composition of the router's current path along with any subroute paths. */
    get composedPath(): string | undefined;
};
declare const COMPONENT_TAG_NAME = "path-router";
declare class PathRouterElement extends HTMLElement {
    #private;
    get routes(): RoutePageElement[];
    get routeDialogs(): RouteDialogComponent[];
    targetPageRoute: RoutePageElement | undefined;
    currentPageRoute: RoutePageElement | undefined;
    targetDialogRoute: RouteDialogComponent | undefined;
    currentDialogRoute: RouteDialogComponent | undefined;
    defaultRoute: RoutePageElement | undefined;
    wildcardRoute: RoutePageElement | undefined;
    get path(): string | null;
    set path(value: string);
    subpaths: string[];
    subrouting: boolean;
    isInitialized: boolean;
    resolveNavigation?: () => void;
    constructor();
    /**
     * Navigate to a route path.
     * @param path route path
     */
    navigate(path: string): Promise<void>;
    subnavigate(path: string): Promise<void>;
    destructurePath(path: string): string[];
    trimCharacter(value: string, character: string): string;
    composeRoutePath(): string;
    compareLocations(currentLocation: URL, updatedLocation: URL): {
        hasChanged: boolean;
        isReplacementChange: boolean;
    };
    pathIsActive(path: string): boolean;
    static getUrlParameters(urlString: string): {
        [key: string]: string;
    };
    connectedCallback(): void;
    static observedAttributes: string[];
    attributeChangedCallback(attributeName: string, oldValue: string, newValue: string): void;
}

export { COMPONENT_TAG_NAME, type PathRouterAttributes, PathRouterElement, PathRouterEvent };
