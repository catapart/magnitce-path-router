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
    const allowSubroute = (this.getAttribute("subrouting") ?? this.closest("path-router[subrouting]")?.getAttribute("subrouting")) != "false";
    if (allowSubroute == true) {
      const subrouter = this.querySelector(":scope > path-router");
      if (subrouter != null) {
        const subroute = this.extractSubroute(path);
        await subrouter.subnavigate(subroute);
      }
    }
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
  extractSubroute(targetPath) {
    const routePathAttribute = this.getAttribute("path") ?? "";
    const routePath = routePathAttribute.startsWith("/") ? routePathAttribute.substring(1) : routePathAttribute;
    const routeArray = routePath.split("/");
    const path = targetPath.startsWith("/") ? targetPath.substring(1) : targetPath;
    const pathArray = path.split("/");
    const lastNonParameterIndex = routeArray.findLastIndex((item) => !item.startsWith(":")) + 1;
    const subPathArray = pathArray.slice(lastNonParameterIndex);
    return subPathArray.join("/");
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
    const allowSubroute = (this.getAttribute("subrouting") ?? this.closest("path-router[subrouting]")?.getAttribute("subrouting")) != "false";
    if (allowSubroute == true) {
      const subrouter = this.querySelector(":scope > path-router");
      if (subrouter != null) {
        const subroute = this.extractSubroute(path);
        await subrouter.subnavigate(subroute);
      }
    }
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
  extractSubroute(targetPath) {
    const routePathAttribute = this.getAttribute("path") ?? "";
    const routePath = routePathAttribute.startsWith("/") ? routePathAttribute.substring(1) : routePathAttribute;
    const routeArray = routePath.split("/");
    const path = targetPath.startsWith("/") ? targetPath.substring(1) : targetPath;
    const pathArray = path.split("/");
    const lastNonParameterIndex = routeArray.findLastIndex((item) => !item.startsWith(":")) + 1;
    const subPathArray = pathArray.slice(lastNonParameterIndex);
    return subPathArray.join("/");
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

// route-link.ts
var COMPONENT_TAG_NAME4 = "route-link";
var RouteLinkElement = class extends HTMLAnchorElement {
  constructor() {
    super();
  }
  connectedCallback() {
    const target = this.#getTargetRouter();
    if (target != null) {
      target.addEventListener("pathchange" /* PathChange */, this.#setIsCurrent.bind(this));
      this.addEventListener("click", this.onClick.bind(this, target));
    } else {
      console.warn("No path router found. Clicking this button will have no navigation effect");
    }
  }
  onClick(target) {
    let path = this.getAttribute("path") ?? this.getAttribute("data-path") ?? "";
    path = this.#preparePath();
    target.navigate(path);
  }
  #getTargetRouter() {
    const forTargetAttribute = this.getAttribute("for");
    const targetAttribute = this.getAttribute("target");
    const selector = forTargetAttribute != null ? `#${forTargetAttribute}` : targetAttribute != null ? targetAttribute : "path-router";
    const target = this.getRootNode().querySelector(selector);
    return target;
  }
  #preparePath() {
    let path = this.getAttribute("path") ?? this.getAttribute("data-path") ?? "";
    path = this.onPreparePath(path);
    return path;
  }
  /**
   * An override-able string transformation function for preparing the static path attribute value.
   * @param staticPath the path that is set in the route-link's html
   * @returns a new path that has been transformed to the exact path expected for navigation
   * @description Useful for replacing variables.
   */
  onPreparePath(staticPath) {
    return staticPath;
  }
  #setIsCurrent(event) {
    const linkPath = this.getAttribute("path");
    if (linkPath == null) {
      console.log("link");
      return;
    }
    const target = this.#getTargetRouter();
    if (target == null) {
      console.log("target");
      return;
    }
    const targetRouter = target;
    if (targetRouter.pathIsActive(linkPath)) {
      this.setAttribute("aria-current", "page");
    } else {
      this.removeAttribute("aria-current");
    }
  }
};
if (customElements.get(COMPONENT_TAG_NAME4) == null) {
  customElements.define(COMPONENT_TAG_NAME4, RouteLinkElement, { extends: "a" });
}

// route-button.ts
var COMPONENT_TAG_NAME5 = "route-button";
var RouteButtonElement = class extends HTMLButtonElement {
  constructor() {
    super();
  }
  connectedCallback() {
    const target = this.#getTargetRouter();
    if (target != null) {
      target.addEventListener("pathchange" /* PathChange */, this.#setIsCurrent.bind(this));
      this.addEventListener("click", this.onClick.bind(this, target));
    } else {
      console.warn("No path router found. Clicking this button will have no navigation effect");
    }
  }
  onClick(target) {
    let path = this.getAttribute("path") ?? this.getAttribute("data-path") ?? "";
    path = this.#preparePath();
    target.navigate(path);
  }
  #getTargetRouter() {
    const forTargetAttribute = this.getAttribute("for");
    const targetAttribute = this.getAttribute("target");
    const selector = forTargetAttribute != null ? `#${forTargetAttribute}` : targetAttribute != null ? targetAttribute : "path-router";
    const target = this.getRootNode().querySelector(selector);
    return target;
  }
  #setIsCurrent() {
    const linkPath = this.getAttribute("path");
    if (linkPath == null) {
      return;
    }
    const target = this.#getTargetRouter();
    if (target == null) {
      return;
    }
    const targetRouter = target;
    if (targetRouter.pathIsActive(linkPath)) {
      this.setAttribute("aria-current", "page");
    } else {
      this.removeAttribute("aria-current");
    }
  }
  #preparePath() {
    let path = this.getAttribute("path") ?? this.getAttribute("data-path") ?? "";
    path = this.onPreparePath(path);
    return path;
  }
  /**
   * An override-able string transformation function for preparing the static path attribute value.
   * @param staticPath the path that is set in the route-link's html
   * @returns a new path that has been transformed to the exact path expected for navigation
   * @description Useful for replacing variables.
   */
  onPreparePath(staticPath) {
    return staticPath;
  }
};
if (customElements.get(COMPONENT_TAG_NAME5) == null) {
  customElements.define(COMPONENT_TAG_NAME5, RouteButtonElement, { extends: "button" });
}

// path-router.ts
var PathRouterEvent = /* @__PURE__ */ ((PathRouterEvent2) => {
  PathRouterEvent2["Change"] = "change";
  PathRouterEvent2["PathChange"] = "pathchange";
  PathRouterEvent2["PathCompose"] = "pathcompose";
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
var PathRouterElement5 = class extends HTMLElement {
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
    this.addEventListener("pathchange" /* PathChange */, (event) => {
      if (event.target != this) {
        this.#updateComposedPath();
      }
    });
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
          const path = route.getAttribute("path");
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
        const subrouters = [...this.querySelectorAll("path-router")];
        for (let i = 0; i < subrouters.length; i++) {
          subrouters[i].toggleAttribute("subrouter", true);
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
  async subnavigate(path) {
    this.toggleAttribute("subnavigating", true);
    return this.navigate(path);
  }
  async #update(path, previousPath) {
    await this.#initializationPromise;
    const [page, hash] = this.destructurePath(path);
    const [currentPage, currentHash] = this.destructurePath(previousPath);
    let openedPage = false;
    let openedDialog = false;
    const pageHasChanged = hash != "" && page == "" ? false : currentPage != page;
    const hashHasChanged = hash != currentHash;
    if (pageHasChanged == false && hashHasChanged == false && this.querySelector("[open]") != null) {
      if (this.resolveNavigation != null) {
        this.resolveNavigation();
        this.resolveNavigation = void 0;
      }
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
    this.#updateComposedPath();
    this.removeAttribute("subnavigating");
    this.dispatchEvent(new CustomEvent("pathchange" /* PathChange */, { detail: { path }, bubbles: true, cancelable: true }));
    return [openedPage, openedDialog];
  }
  async #updateComposedPath() {
    const previousComposedPath = this.getAttribute("composedPath");
    const composedPath = this.composeRoutePath();
    this.setAttribute("composed-path", composedPath);
    if (this.getAttribute("subrouter") == null) {
      this.dispatchEvent(new CustomEvent("pathcompose" /* PathCompose */, { detail: { composedPath, previousComposedPath }, bubbles: true, cancelable: true }));
    }
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
  // exposed for route-page and route-dialog elements, not the api;
  composeRoutePath() {
    const path = this.getAttribute("path") ?? "";
    let [routerPagePath, routerDialogPath] = this.destructurePath(path);
    let composition = new RouteComposition();
    composition.path = routerPagePath;
    composition.hash = routerDialogPath;
    const routePage = this.targetPageRoute ?? this.currentPageRoute;
    if (routePage != null) {
      composition = this.#getCurrentPageRouteComposition(routePage, composition);
    }
    const routeDialog = this.targetDialogRoute ?? this.currentDialogRoute;
    if (routeDialog != null) {
      composition.isDialogRoute = false;
      composition = this.#getCurrentDialogRouteComposition(routeDialog, composition);
    }
    return this.#composeRoutePath(composition.path, composition.hash, composition.subroutePath, composition.subrouteHash, composition.properties);
  }
  #getCurrentPageRouteComposition(route, composition = new RouteComposition()) {
    if (route != null) {
      Object.assign(composition.properties, route.currentProperties);
      const routePathAttribute = route.getAttribute("path") ?? "";
      const [routePath, routeHash] = this.destructurePath(routePathAttribute);
      composition.path = routePath ?? composition.path;
      composition.hash = routeHash.trim() == "" ? composition.hash : routeHash;
      const subrouter = route.querySelector("path-router");
      if (subrouter != null) {
        const subrouteFullPath = subrouter.composeRoutePath();
        let subrouteHash = "";
        [composition.subroutePath, subrouteHash] = this.destructurePath(subrouteFullPath);
        if (composition.isDialogRoute == true) {
          composition.subrouteHash = subrouteHash;
        }
        const subroute = subrouter.targetPageRoute ?? subrouter.currentPageRoute;
        if (subroute != null) {
          Object.assign(composition.properties, subroute.currentProperties);
        }
      }
    }
    return composition;
  }
  #getCurrentDialogRouteComposition(route, composition = new RouteComposition()) {
    if (route != null) {
      Object.assign(composition.properties, route.currentProperties);
      const subrouter = route.querySelector("path-router");
      if (subrouter != null) {
        const subrouteFullPath = subrouter.composeRoutePath();
        let [subroutePath] = this.destructurePath(subrouteFullPath);
        const subroute = subrouter.targetPageRoute ?? subrouter.currentPageRoute;
        if (subroute != null) {
          Object.assign(composition.properties, subroute.currentProperties);
        }
        let currentPath = route.getAttribute("path");
        subroutePath = currentPath.replace(/:[\s\S]*/gm, subroutePath);
        subroutePath = this.trimCharacter(subroutePath, "/");
        const subroutePathArray = subroutePath.split("/");
        let hashArray = composition.hash.split("/");
        for (let i = 0; i < subroutePathArray.length; i++) {
          if (subroutePathArray[i] == hashArray[i]) {
            continue;
          }
          if (hashArray[i] != void 0) {
            hashArray[i] = subroutePathArray[i];
          } else {
            hashArray.push(subroutePathArray[i]);
          }
        }
        composition.hash = hashArray.join("/");
      }
    }
    return composition;
  }
  #composeRoutePath(path, hash, subroutePath, subrouteHash, properties) {
    const pathArray = path.split("/");
    const subpathArray = subroutePath.split("/");
    const replaceLastPathSlug = pathArray[pathArray.length - 1].startsWith(":");
    const hashArray = hash.split("/");
    const subhashArray = subrouteHash.split("/");
    const replaceLastHashSlug = hashArray[hashArray.length - 1].startsWith(":");
    for (const [key, value] of Object.entries(properties)) {
      const pathIndex = pathArray.indexOf(`:${key}`);
      if (pathIndex > -1) {
        pathArray[pathIndex] = value;
      }
      const subpathIndex = subpathArray.indexOf(`:${key}`);
      if (subpathIndex > -1) {
        subpathArray[subpathIndex] = value;
      }
      const hashIndex = hashArray.indexOf(`:${key}`);
      if (hashIndex > -1) {
        hashArray[hashIndex] = value;
      }
      const subhashIndex = subhashArray.indexOf(`:${key}`);
      if (subhashIndex > -1) {
        subhashArray[subhashIndex] = value;
      }
    }
    if (replaceLastPathSlug == true) {
      pathArray[pathArray.length - 1] = subpathArray[0];
      subpathArray.shift();
    }
    if (replaceLastHashSlug == true) {
      hashArray[hashArray.length - 1] = subhashArray[0];
      subhashArray.shift();
    }
    const fullPathArray = pathArray.concat(subpathArray);
    path = fullPathArray.join("/");
    const fullHashArray = hashArray.concat(subhashArray).filter((item) => item.trim() != "");
    const fullHashPath = fullHashArray.join("/");
    if (fullHashPath.trim() != "") {
      path = path.endsWith("/") ? path.substring(0, path.length - 1) : path;
      path += `#${fullHashPath}`;
    }
    path = path.replace("//", "/");
    return path;
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
   * Determine if a path represents the currently opened route.
   * @param path the path to determine the active state of
   * @returns `true` if the path matches the current route, `false` if the path does not match.
   */
  pathIsActive(path) {
    const [queryPath, queryHash] = this.destructurePath(path);
    let routerFullPath = this.getAttribute("path") ?? "/";
    const [routerComparePath, routerCompareHash] = this.destructurePath(routerFullPath);
    const queryPathArray = this.#getFormattedPathArray(queryPath);
    let linkRoute = queryPath == "" && routerComparePath == "" ? this.defaultRoute : this.#getRouteElement(queryPathArray, this.#routeMap_pathToPageOrDialog);
    if (linkRoute == null) {
      return false;
    }
    let matchingPath = this.currentPageRoute == linkRoute;
    if (matchingPath == true) {
      const subroute = linkRoute.extractSubroute(queryPath);
      if (linkRoute.getAttribute("subrouting") != "false" && subroute != "") {
        const subrouter = linkRoute.querySelector(":scope > path-router");
        if (subrouter != null) {
          matchingPath = subrouter.pathIsActive(subroute);
        }
      }
    }
    let matchingHash = false;
    if (queryHash == routerCompareHash) {
      matchingHash = true;
    }
    if (matchingPath == true && path.indexOf("#") == -1) {
      return true;
    }
    if (matchingPath == true && matchingHash == true) {
      return true;
    }
    if (path.startsWith("#") && matchingHash == true) {
      return true;
    }
    return false;
  }
  /**
   * Get a key/value pair object with each key being a route-property name (ex: `:id`), and each value being the associated value from the current path value (ex: `123`).
   * @param result A key/value pair object with each route property in the current path. This parameter allows recursion for subrouters and is not necessary for most uses.
   * @returns A key/value pair object with each route property in the current path.
   */
  getRouteProperties(result = {}) {
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
    const subrouter = this.currentPageRoute.querySelector("path-router");
    if (subrouter != null) {
      result = subrouter.getRouteProperties(result);
    }
    return result;
  }
  static getUrlParameters(urlString) {
    const url = new URL(urlString);
    const targetPath = url.pathname;
    const path = targetPath.startsWith("/") ? targetPath.substring(1) : targetPath;
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
  static observedAttributes = ["path", "subrouting"];
  attributeChangedCallback(attributeName, oldValue, newValue) {
    if (attributeName == "path") {
      if (this.isInitialized == true) {
        this.#update(newValue, oldValue ?? "");
      } else {
        this.#toUpdate.push({ newValue, oldValue: oldValue ?? "" });
      }
    } else if (attributeName == "subrouting") {
      if (newValue == "false") {
        for (let i = 0; i < this.routes.length; i++) {
          this.routes[i].setAttribute(attributeName, "false");
        }
      } else {
        for (let i = 0; i < this.routes.length; i++) {
          this.routes[i].removeAttribute("subrouting");
        }
      }
    }
  }
};
if (customElements.get(COMPONENT_TAG_NAME) == null) {
  customElements.define(COMPONENT_TAG_NAME, PathRouterElement5);
}
var RouteComposition = class {
  path = "";
  hash = "";
  subroutePath = "";
  subrouteHash = "";
  properties = {};
  isDialogRoute = true;
};
export {
  COMPONENT_TAG_NAME,
  PathRouterElement5 as PathRouterElement,
  PathRouterEvent,
  RouteButtonElement,
  RouteDialogElement,
  RouteLinkElement,
  RoutePageElement
};
