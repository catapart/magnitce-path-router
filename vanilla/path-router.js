// route-page.ts
var COMPONENT_TAG_NAME2 = "route-page";
var RoutePageElement = class extends HTMLElement {
  get router() {
    return this.closest(COMPONENT_TAG_NAME);
  }
  blockingBeforeOpen = [];
  blockingAfterOpen = [];
  blockingBeforeClose = [];
  blockingAfterClose = [];
  currentProcess;
  canBeOpened;
  canBeClosed;
  subrouting = true;
  currentProperties;
  constructor() {
    super();
    this.currentProcess = Promise.resolve();
    this.canBeOpened = async () => true;
    this.canBeClosed = async () => true;
  }
  async open(path) {
    const canNavigate = await this.canBeOpened();
    if (!canNavigate) {
      console.info("Navigation blocked by validity check.");
      return false;
    }
    this.currentProcess = this.#open(path);
    await this.currentProcess;
    this.currentProcess = Promise.resolve();
    return true;
  }
  async #open(path) {
    this.currentProperties = this.getProperties(path);
    this.dispatchEvent(new CustomEvent("beforeopen" /* BeforeOpen */, { detail: { path, properties: this.currentProperties } }));
    await Promise.allSettled(this.blockingBeforeOpen.map((value) => value()));
    this.dataset.entering = "";
    await Promise.allSettled(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
    delete this.dataset.entering;
    this.toggleAttribute("open", true);
    this.setAttribute("aria-current", "page");
    this.dispatchEvent(new Event("afteropen" /* AfterOpen */));
    await Promise.allSettled(this.blockingAfterOpen.map((value) => value()));
  }
  async close() {
    const canNavigate = await this.canBeClosed();
    if (canNavigate == false) {
      console.info("Navigation blocked by validity check.");
      return false;
    }
    this.currentProcess = this.#close();
    await this.currentProcess;
    this.currentProcess = Promise.resolve();
    return true;
  }
  async #close() {
    this.dispatchEvent(new Event("beforeclose" /* BeforeClose */));
    await Promise.allSettled(this.blockingBeforeClose.map((value) => value()));
    this.dataset.exiting = "";
    this.removeAttribute("open");
    await Promise.all(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
    delete this.dataset.exiting;
    this.removeAttribute("aria-current");
    this.currentProperties = void 0;
    this.dispatchEvent(new Event("afterclose" /* AfterClose */));
    await Promise.allSettled(this.blockingAfterClose.map((value) => value()));
  }
  getProperties(targetPath) {
    const routePathAttribute = this.getAttribute("path") ?? "";
    const routePath = routePathAttribute.startsWith("/") ? routePathAttribute.substring(1) : routePathAttribute;
    const routeArray = routePath.split("/");
    const properties = {};
    if (targetPath == null) {
      const parentRouter = this.closest("path-router");
      if (parentRouter == null) {
        return properties;
      }
      targetPath = parentRouter.getAttribute("path");
    }
    if (targetPath == null) {
      return properties;
    }
    ;
    targetPath = targetPath ?? this.closest("path-router");
    const path = targetPath.startsWith("/") ? targetPath.substring(1) : targetPath;
    const pathArray = path.split("/");
    for (let i = 0; i < routeArray.length; i++) {
      const slug = routeArray[i];
      if (slug.startsWith(":")) {
        let propertyName = slug.substring(1);
        if (propertyName.endsWith("?")) {
          propertyName = propertyName.substring(0, propertyName.length - 1);
        }
        properties[propertyName] = i < pathArray.length ? pathArray[i] : "";
      }
    }
    return properties;
  }
  applyEventListener(type, listener, options) {
    const isOpen = this.getAttribute("open") != null;
    this.addEventListener(type, listener, options);
    if ((type == "beforeopen" /* BeforeOpen */.toString() || type == "afteropen" /* AfterOpen */.toString()) && isOpen == true) {
      this.dispatchEvent(new Event(type));
    } else if (type == "beforeclose" /* BeforeClose */.toString() || type == "afterclose" /* AfterClose */.toString() && isOpen == false) {
      this.dispatchEvent(new Event(type));
    }
  }
  addBlockingEventListener(eventName, handler) {
    switch (eventName) {
      case "beforeopen" /* BeforeOpen */:
        this.blockingBeforeOpen.push(handler);
        break;
      case "afteropen" /* AfterOpen */:
        this.blockingAfterOpen.push(handler);
        break;
      case "beforeclose" /* BeforeClose */:
        this.blockingBeforeClose.push(handler);
        break;
      case "afterclose" /* AfterClose */:
        this.blockingAfterClose.push(handler);
        break;
    }
  }
  applyBlockingEventListener(eventName, handler) {
    const isOpen = this.getAttribute("open") != null;
    this.addBlockingEventListener(eventName, handler);
    if ((eventName == "beforeopen" /* BeforeOpen */.toString() || eventName == "afteropen" /* AfterOpen */.toString()) && isOpen == true) {
      this.dispatchEvent(new Event(eventName));
    } else if (eventName == "beforeclose" /* BeforeClose */.toString() || eventName == "afterclose" /* AfterClose */.toString() && isOpen == false) {
      this.dispatchEvent(new Event(eventName));
    }
  }
};
if (customElements.get(COMPONENT_TAG_NAME2) == null) {
  customElements.define(COMPONENT_TAG_NAME2, RoutePageElement);
}

// route-dialog.ts
var COMPONENT_TAG_NAME3 = "route-dialog";
var RouteDialogElement = class extends HTMLDialogElement {
  get router() {
    return this.closest(COMPONENT_TAG_NAME);
  }
  blockingBeforeOpen = [];
  blockingAfterOpen = [];
  blockingBeforeClose = [];
  blockingAfterClose = [];
  currentProcess;
  canBeOpened;
  canBeClosed;
  currentProperties;
  constructor() {
    super();
    this.currentProcess = Promise.resolve();
    this.canBeOpened = async () => true;
    this.canBeClosed = async () => true;
  }
  async openRoute(path) {
    const canNavigate = await this.canBeOpened();
    if (!canNavigate) {
      console.info("Navigation blocked by validity check.");
      return false;
    }
    this.currentProcess = this.#open(path);
    await this.currentProcess;
    this.currentProcess = Promise.resolve();
    return true;
  }
  async #open(path) {
    this.currentProperties = this.getProperties(path);
    this.dispatchEvent(new CustomEvent("beforeopen" /* BeforeOpen */, { detail: { path, properties: this.currentProperties } }));
    await Promise.allSettled(this.blockingBeforeOpen.map((value) => value()));
    this.setAttribute("data-entering", "");
    if (this.dataset.modal != null) {
      this.showModal();
    } else {
      this.show();
    }
    this.setAttribute("aria-current", "page");
    await Promise.allSettled(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
    this.removeAttribute("data-entering");
    this.dispatchEvent(new Event("afteropen" /* AfterOpen */));
    await Promise.allSettled(this.blockingAfterOpen.map((value) => value()));
  }
  async closeRoute() {
    const canNavigate = await this.canBeClosed();
    if (canNavigate == false) {
      console.info("Navigation blocked by validity check.");
      return false;
    }
    this.currentProcess = this.#close();
    await this.currentProcess;
    this.currentProcess = Promise.resolve();
    return true;
  }
  async #close() {
    this.dispatchEvent(new Event("beforeclose" /* BeforeClose */));
    await Promise.allSettled(this.blockingBeforeClose.map((value) => value()));
    this.setAttribute("data-exiting", "");
    this.close();
    this.removeAttribute("aria-current");
    await Promise.all(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
    this.dispatchEvent(new Event("afterclose" /* AfterClose */));
    await Promise.allSettled(this.blockingAfterClose.map((value) => value()));
  }
  getProperties(targetPath) {
    const routePathAttribute = this.getAttribute("path") ?? "";
    const routePath = routePathAttribute.startsWith("/") ? routePathAttribute.substring(1) : routePathAttribute;
    const routeArray = routePath.split("/");
    const path = targetPath.startsWith("/") ? targetPath.substring(1) : targetPath;
    const pathArray = path.split("/");
    const properties = {};
    for (let i = 0; i < routeArray.length; i++) {
      const slug = routeArray[i];
      if (slug.startsWith(":")) {
        let propertyName = slug.substring(1);
        if (propertyName.endsWith("?")) {
          propertyName = propertyName.substring(0, propertyName.length - 1);
        }
        properties[propertyName] = i < pathArray.length ? pathArray[i] : "";
      }
    }
    return properties;
  }
  applyEventListener(type, listener, options) {
    const isOpen = this.getAttribute("open") != null;
    this.addEventListener(type, listener, options);
    if ((type == "beforeopen" /* BeforeOpen */.toString() || type == "afteropen" /* AfterOpen */.toString()) && isOpen == true) {
      this.dispatchEvent(new Event(type));
    } else if (type == "beforeclose" /* BeforeClose */.toString() || type == "afterclose" /* AfterClose */.toString() && isOpen == false) {
      this.dispatchEvent(new Event(type));
    }
  }
  addBlockingEventListener(eventName, handler) {
    switch (eventName) {
      case "beforeopen" /* BeforeOpen */:
        this.blockingBeforeOpen.push(handler);
        break;
      case "afteropen" /* AfterOpen */:
        this.blockingAfterOpen.push(handler);
        break;
      case "beforeclose" /* BeforeClose */:
        this.blockingBeforeClose.push(handler);
        break;
      case "afterclose" /* AfterClose */:
        this.blockingAfterClose.push(handler);
        break;
    }
  }
};
if (customElements.get(COMPONENT_TAG_NAME3) == null) {
  customElements.define(COMPONENT_TAG_NAME3, RouteDialogElement, { extends: "dialog" });
}

// path-router.ts
var PathRouterEvent = /* @__PURE__ */ ((PathRouterEvent2) => {
  PathRouterEvent2["Change"] = "change";
  PathRouterEvent2["PathChange"] = "pathchange";
  return PathRouterEvent2;
})(PathRouterEvent || {});
var COMPONENT_STYLESHEET = new CSSStyleSheet();
COMPONENT_STYLESHEET.replaceSync(`
/* 
   Animations will not be awaitable in code if they have a display of none.
   Instead, the routes are stacked in a grid.
 */
path-router
{ 
    display: var(--router-display, grid);
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
}
route-page:not([open],[data-entering],[data-exiting]) path-router { display: none; /* browser bug when rendering visibility? */ }
route-page
{
    display: var(--route-display, block);
    visibility: hidden;
    grid-row: 1;
    grid-column: 1;
}
/* 
   Visibility is visible during the entering and exiting phases
   to allow for animations to be awaited.
 */
route-page[open]
,route-page[data-entering]
,route-page[data-exiting]
{
    visibility: visible;
}
[is="route-link"]
,[is="route-button"]
{
    user-select: none;
}`);
var COMPONENT_TAG_NAME = "path-router";
var PathRouterElement3 = class extends HTMLElement {
  get routes() {
    return Array.from(this.querySelectorAll(`:scope > ${COMPONENT_TAG_NAME2}`), (route) => route);
  }
  get routeDialogs() {
    return Array.from(this.querySelectorAll(`:scope > [is="${COMPONENT_TAG_NAME3}"]`), (routeDialog) => routeDialog);
  }
  /** The `<page-route>` element currently being navigated to. */
  targetPageRoute;
  /** The `<page-route>` element that the router currently has open. */
  currentPageRoute;
  /** The `route-dialog` element currently being navigated to. */
  targetDialogRoute;
  /** The `route-dialog` element that the router currently has open. */
  currentDialogRoute;
  /** The route that will be selected if no other routes match the current path. */
  defaultRoute;
  /** The path which controls the router's navigation. */
  get path() {
    return this.getAttribute("path");
  }
  set path(value) {
    this.setAttribute("path", value);
  }
  isInitialized = false;
  #initializationPromise;
  #toUpdate = [];
  #routeMap_pathToPage = /* @__PURE__ */ new Map();
  #routeMap_pathToDialog = /* @__PURE__ */ new Map();
  #routeMap_pathToPageOrDialog = /* @__PURE__ */ new Map();
  // exposed for route-page and route-dialog elements, not the api;
  resolveNavigation;
  constructor() {
    super();
    this.#initializationPromise = this.#init();
    this.#dispatchInitialNavigation();
  }
  async #init() {
    return new Promise((resolve) => {
      document.addEventListener("DOMContentLoaded", async () => {
        for (let i = 0; i < this.routes.length; i++) {
          const route = this.routes[i];
          if (this.defaultRoute == null) {
            this.defaultRoute = route;
          }
          const isDefault = route.hasAttribute("default");
          if (isDefault == true) {
            this.defaultRoute = route;
          }
        }
        const dialogs = [...this.querySelectorAll("dialog")];
        for (let i = 0; i < dialogs.length; i++) {
          dialogs[i].addEventListener("close", async (_event) => {
            const isClosing = dialogs[i].getAttribute("data-exiting") != null;
            if (!isClosing) {
              const pathAttribute = this.getAttribute("path") ?? "/";
              const path = pathAttribute.split("#")[0];
              await this.navigate(path);
            }
            dialogs[i].removeAttribute("data-exiting");
          });
        }
        this.#routeMap_pathToPage = new Map(this.routes.map((element) => [element.getAttribute("path") ?? "", element]));
        this.#routeMap_pathToDialog = new Map(this.routeDialogs.map((element) => [element.getAttribute("path") ?? "", element]));
        this.#routeMap_pathToPageOrDialog = new Map([...this.#routeMap_pathToPage, ...this.#routeMap_pathToDialog]);
        this.isInitialized = true;
        resolve();
      });
    });
  }
  async #dispatchInitialNavigation() {
    await this.#initializationPromise;
    if (!this.hasAttribute("manual")) {
      for (let i = 0; i < this.#toUpdate.length; i++) {
        await this.#update(this.#toUpdate[i].newValue, this.#toUpdate[i].oldValue);
      }
    }
  }
  // navigation
  /**
   * Navigate to a route path.
   * @param path route path
   */
  async navigate(path) {
    return new Promise((resolve) => {
      this.resolveNavigation = resolve;
      this.setAttribute("path", path);
    });
  }
  async #update(path, previousPath) {
    await this.#initializationPromise;
    const [page, hash] = this.destructurePath(path);
    const [currentPage, currentHash] = this.destructurePath(previousPath);
    let openedPage = false;
    let openedDialog = false;
    const pageHasChanged = hash != "" && page == "" ? false : currentPage != page;
    const hashHasChanged = hash != currentHash;
    const currentlyOpen = this.querySelector("[open]");
    if (pageHasChanged == false && hashHasChanged == false && currentlyOpen != null) {
      if (this.resolveNavigation != null) {
        this.resolveNavigation();
        this.resolveNavigation = void 0;
      }
      currentlyOpen.dispatchEvent(new CustomEvent("refresh" /* Refresh */, { detail: { path }, bubbles: true, cancelable: true }));
      return [openedPage, openedDialog];
    }
    await this.#awaitAllRouteProcesses();
    const [pageRoute, dialogRoute] = this.#getRouteElements(path);
    let openPagePromise;
    if (pageHasChanged == true || this.querySelector("[open]") == null) {
      const closed = await this.#closeCurrentRoutePage();
      if (closed == false) {
        console.warn("Navigation was prevented.");
        console.info(`Requested path: ${path}`);
        if (this.resolveNavigation != null) {
          this.resolveNavigation();
          this.resolveNavigation = void 0;
        }
        return false;
      }
      openPagePromise = this.#openRoutePage(pageRoute, page);
    }
    if (pageHasChanged || currentHash != hash) {
      const closed = await this.#closeCurrentRouteDialog();
      if (closed != false) {
        this.targetDialogRoute = dialogRoute;
        openedDialog = await this.#openRouteDialog(dialogRoute, hash);
      }
    }
    await openPagePromise;
    this.targetPageRoute = void 0;
    this.targetDialogRoute = void 0;
    if (this.resolveNavigation != null) {
      this.resolveNavigation();
      this.resolveNavigation = void 0;
    }
    this.dispatchEvent(new CustomEvent("pathchange" /* PathChange */, { detail: { path }, bubbles: true, cancelable: true }));
    return [openedPage, openedDialog];
  }
  async #awaitAllRouteProcesses() {
    return Promise.allSettled(this.routes.map((route) => {
      return route.currentProcess;
    }));
  }
  #getRouteElements(path) {
    let [pagePath, dialogPath] = this.destructurePath(path);
    const pagePathArray = this.#getFormattedPathArray(pagePath);
    let foundPage = this.#getRouteElement(pagePathArray, this.#routeMap_pathToPage);
    let foundDialog = void 0;
    if (dialogPath != "") {
      const dialogPathArray = this.#getFormattedPathArray(dialogPath);
      foundDialog = this.#getRouteElement(dialogPathArray, this.#routeMap_pathToDialog);
    }
    return [foundPage, foundDialog];
  }
  #getFormattedPathArray(path) {
    path = this.trimCharacter(path, "/");
    return path.split("/");
  }
  #getRouteElement(pagePathArray, routeMap) {
    let foundRoute = void 0;
    for (let [routePath, element] of routeMap) {
      routePath = this.trimCharacter(routePath, "/");
      const routeArray = routePath.split("/");
      let { match: routeMatchesPath, resolved } = this.#pathArraySelectsRouteArray(pagePathArray, routeArray);
      if (resolved == false) {
        continue;
      }
      for (let i = pagePathArray.length; i < routeArray.length; i++) {
        const slug = routeArray[i];
        if (slug.startsWith(":") == false) {
          routeMatchesPath = false;
          break;
        }
      }
      if (routeMatchesPath == true) {
        foundRoute = element;
      }
    }
    return foundRoute;
  }
  /**
   * Compares an array representing the requested path to an array representing a route
   * and returns whether or not the provided path would match the provided route.
   * @param pathArray an `array` representing the requested path.
   * @param routeArray an `array` representing a route
   * @returns `match` is set to `true` if the provided path matches the provided route, otherwise `false`.  
   * `resolved` is set to true if the function was not exited early. Used to determine whether a parent loop should continue.
   * @description the `pathArray` and `routeArray` parameters are created by trimming 
   * the first and last slashes from a path, and then splitting on the slash character.
   */
  #pathArraySelectsRouteArray(pathArray, routeArray) {
    let routeMatchesPath = false;
    let lastRouteSlugWasParameter = false;
    for (let i = 0; i < pathArray.length; i++) {
      const slug = routeArray[i];
      if (slug == null) {
        if (lastRouteSlugWasParameter == true) {
          continue;
        }
        return { match: false, resolved: false };
      }
      const isParameter = slug.startsWith(":");
      if (isParameter == false) {
        if (slug != pathArray[i]) {
          return { match: false, resolved: false };
        }
      }
      routeMatchesPath = true;
      lastRouteSlugWasParameter = isParameter;
    }
    return { match: routeMatchesPath, resolved: true };
  }
  async #openRoutePage(route, path) {
    this.targetPageRoute = route;
    this.targetPageRoute = this.targetPageRoute || this.defaultRoute;
    if (this.targetPageRoute == null) {
      return false;
    }
    const opened = await this.targetPageRoute.open(path);
    if (opened) {
      this.currentPageRoute = this.targetPageRoute;
      this.dispatchEvent(new CustomEvent("change" /* Change */, { detail: { route: this.targetPageRoute, path } }));
    }
    return opened;
  }
  async #openRouteDialog(route, path) {
    this.targetDialogRoute = route;
    if (this.targetDialogRoute == null) {
      return false;
    }
    const opened = await this.targetDialogRoute.openRoute(path);
    if (opened) {
      this.currentDialogRoute = this.targetDialogRoute;
      this.dispatchEvent(new CustomEvent("change" /* Change */, { detail: { route: this.targetDialogRoute, path } }));
    }
    return opened;
  }
  async #closeCurrentRoutePage() {
    if (this.currentPageRoute == null) {
      return true;
    }
    const closed = await this.currentPageRoute.close();
    if (closed == true) {
      this.currentPageRoute = void 0;
    }
    return closed;
  }
  async #closeCurrentRouteDialog() {
    if (this.currentDialogRoute == null) {
      return true;
    }
    const closed = await this.currentDialogRoute.closeRoute();
    if (closed == true) {
      this.currentDialogRoute = void 0;
    }
    return closed;
  }
  // string manipulation
  #splitPath(path) {
    const pathArray = path.split("#");
    const pathname = pathArray[0];
    const remainingPath = path.length > 1 ? pathArray[1] : null;
    const remainingPathArray = remainingPath == null ? [""] : remainingPath.split("?");
    const hash = remainingPathArray == null ? "" : remainingPathArray[0];
    return { pathname, hash };
  }
  destructurePath(path) {
    let { pathname, hash } = this.#splitPath(path);
    if (pathname.trim() == "" && hash != "") {
      const attributePath = this.getAttribute("path") ?? "";
      const { pathname: attributePage } = this.#splitPath(attributePath);
      pathname = attributePage;
    }
    return [pathname, hash];
  }
  trimCharacter(value, character) {
    const regex = new RegExp(`^\\${character}|${character}$`, "gm");
    return value.replace(regex, "");
  }
  // queries and tests
  /**
   * Compare two `URL` objects to determine whether they represet different locations and, if so, whether or not the new location is marked as a replacement change.
   * @param currentLocation a url object representing the current location
   * @param updatedLocation a url object representing the location to compare against
   * @returns `{ hasChanged, isReplacementChange }`: Whether there was a change, and whether history management should add an entry, or replace the last entry.
   */
  compareLocations(currentLocation, updatedLocation) {
    let hasChanged = false;
    let isReplacementChange = false;
    if (updatedLocation.pathname != currentLocation.pathname) {
      hasChanged = true;
    } else if (updatedLocation.pathname == currentLocation.pathname && updatedLocation.hash != currentLocation.hash) {
      hasChanged = true;
      if (currentLocation.hash != "" && updatedLocation.hash != "") {
        isReplacementChange = true;
      }
    }
    return { hasChanged, isReplacementChange };
  }
  /**
   * Get a key/value pair object with each key being a route-property name (ex: `:id`), and each value being the associated value from the current path value (ex: `123`).
   * @returns A key/value pair object with each route property in the current path.
   */
  getRouteProperties() {
    const result = {};
    if (this.currentPageRoute == null) {
      return {};
    }
    const composedPath = this.getAttribute("path") ?? "/";
    const pathArray = this.#getFormattedPathArray(composedPath);
    const routePathArray = this.#getFormattedPathArray(this.currentPageRoute.getAttribute("path") ?? "/");
    let preceedingKey = void 0;
    for (let i = 0; i < routePathArray.length; i++) {
      const routePathSlug = routePathArray[i];
      if (routePathSlug.startsWith(":")) {
        if (preceedingKey == void 0) {
          let value = pathArray[0];
          if (value.indexOf("#") > -1) {
            value = value.split("#")[0];
          }
          result[this.trimCharacter(routePathSlug, ":")] = value;
          continue;
        }
        for (let j = 0; j < pathArray.length - 1; j++) {
          const pathSlug = pathArray[j];
          if (pathSlug == preceedingKey) {
            let value = pathArray[j + 1];
            if (value.indexOf("#") > -1) {
              value = value.split("#")[0];
            }
            result[this.trimCharacter(routePathSlug, ":")] = value;
          }
        }
      }
      preceedingKey = routePathSlug;
    }
    return result;
  }
  static getUrlParameters(urlString) {
    const url = new URL(urlString);
    const targetPath = url.pathname;
    const path = targetPath.startsWith("/") ? targetPath.substring(1) : targetPath;
    return this.getPathParameters(path);
  }
  static getPathParameters(path) {
    const pathArray = path.split("/");
    const properties = {};
    let previousSlug = null;
    for (let i = 0; i < pathArray.length; i++) {
      const slug = pathArray[i];
      if (previousSlug == null) {
        previousSlug = slug;
      } else {
        properties[previousSlug] = slug;
        previousSlug = null;
      }
    }
    return properties;
  }
  connectedCallback() {
    let parent = this.getRootNode();
    if (parent.adoptedStyleSheets.indexOf(COMPONENT_STYLESHEET) == -1) {
      parent.adoptedStyleSheets.push(COMPONENT_STYLESHEET);
    }
  }
  static observedAttributes = ["path"];
  attributeChangedCallback(attributeName, oldValue, newValue) {
    if (attributeName == "path") {
      if (this.isInitialized == true) {
        this.#update(newValue, oldValue ?? "");
      } else {
        this.#toUpdate.push({ newValue, oldValue: oldValue ?? "" });
      }
    }
  }
  /**
   * Adds simple click handling to a parent element that contains all of the 
   * route links that you want to use for the target `<path-router>` element.
   * @param parent An element that will contain every link that should be listened for. If no parent is provided, the document `<body>` will be used.
   * @param linkQuery A query that will be used to de-select all route links. This can be customized for use-cases like nested path routers which may benefit from scoped selectors. By default, the query is `a[data-route],button[data-route]`.
   */
  addRouteLinkClickHandlers(parent, linkQuery = "a[data-route],button[data-route]") {
    parent = parent ?? document.body;
    parent.addEventListener("click", (event) => {
      const targetLink = event.target.closest("a[data-route],button[data-route]");
      if (targetLink != null && parent.contains(targetLink)) {
        const links = [...parent.querySelectorAll(linkQuery)];
        for (let i = 0; i < links.length; i++) {
          links[i].removeAttribute("aria-current");
        }
        const path = targetLink.dataset.route;
        this.setAttribute("path", path);
        targetLink.setAttribute("aria-current", "page");
      }
    });
  }
};
if (customElements.get(COMPONENT_TAG_NAME) == null) {
  customElements.define(COMPONENT_TAG_NAME, PathRouterElement3);
}
export {
  COMPONENT_TAG_NAME,
  PathRouterElement3 as PathRouterElement,
  PathRouterEvent,
  RouteDialogElement,
  RoutePageElement
};
