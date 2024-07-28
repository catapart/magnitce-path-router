// path-route.ts
var COMPONENT_TAG_NAME2 = "path-route";
var PathRouteComponent = class extends HTMLElement {
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
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<slot></slot>`;
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
    this.dataset.entering = "";
    const properties = this.getProperties(path);
    this.dispatchEvent(new CustomEvent("beforeopen" /* BeforeOpen */, { detail: { path, properties } }));
    await Promise.allSettled(this.blockingBeforeOpen.map((value) => value()));
    const allowSubroute = (this.getAttribute("subrouting") ?? this.closest("[subrouting]")?.getAttribute("subrouting")) != "false";
    if (allowSubroute == true) {
      const subrouter = this.querySelector(":scope > path-router");
      if (subrouter != null) {
        const subroute = this.createPathFromProperties(properties);
        subrouter.navigate(subroute);
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
    this.removeAttribute("open");
    this.dataset.exiting = "";
    this.dispatchEvent(new Event("beforeclose" /* BeforeClose */));
    await Promise.allSettled(this.blockingBeforeClose.map((value) => value()));
    await Promise.all(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
    delete this.dataset.exiting;
    this.removeAttribute("aria-current");
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
  createPathFromProperties(properties) {
    const resultArray = [];
    for (const value of Object.values(properties)) {
      resultArray.push(value);
    }
    return resultArray.join("/");
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
  customElements.define(COMPONENT_TAG_NAME2, PathRouteComponent);
}

// route-dialog.ts
var COMPONENT_TAG_NAME3 = "route-dialog";
var RouteDialogComponent = class extends HTMLDialogElement {
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
    this.setAttribute("data-entering", "");
    const properties = this.getProperties(path);
    this.dispatchEvent(new CustomEvent("beforeopen" /* BeforeOpen */, { detail: { path, properties } }));
    await Promise.allSettled(this.blockingBeforeOpen.map((value) => value()));
    await Promise.allSettled(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
    this.removeAttribute("data-entering");
    if (this.dataset.modal != null) {
      this.showModal();
    } else {
      this.show();
    }
    this.setAttribute("aria-current", "page");
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
    this.setAttribute("data-exiting", "");
    this.dispatchEvent(new Event("beforeclose" /* BeforeClose */));
    await Promise.allSettled(this.blockingBeforeClose.map((value) => value()));
    await Promise.all(this.getAnimations({ subtree: true }).map((animation) => animation.finished));
    this.close();
    this.removeAttribute("aria-current");
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
  customElements.define(COMPONENT_TAG_NAME3, RouteDialogComponent, { extends: "dialog" });
}

// route-link.ts
var COMPONENT_TAG_NAME4 = "route-link";
var RouteLinkComponent = class extends HTMLAnchorElement {
  constructor() {
    super();
    window.addEventListener("popstate", () => this.setIsCurrent());
  }
  connectedCallback() {
    const target = this.getTarget();
    if (target != null) {
      target.addEventListener("pathchange" /* PathChange */, () => this.setIsCurrent());
    }
    this.addEventListener("click", () => {
      if (target == null) {
        return;
      }
      const path = this.getAttribute("path") ?? this.getAttribute("data-path") ?? "";
      target.dispatchEvent(new CustomEvent("navigate" /* Navigate */, { detail: { target: this, path } }));
    });
    if (document.readyState == "complete") {
      this.setIsCurrent();
    }
  }
  getTarget() {
    let target = null;
    const forTargetAttribute = this.getAttribute("for");
    if (forTargetAttribute != null) {
      target = this.getRootNode().querySelector(`#${forTargetAttribute}`);
    } else {
      const targetAttribute = this.getAttribute("target");
      if (targetAttribute != null) {
        target = this.getRootNode().querySelector(targetAttribute);
      }
    }
    return target;
  }
  setIsCurrent() {
    const linkPath = this.getAttribute("path");
    if (linkPath == null) {
      return;
    }
    const target = this.getTarget();
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
};
if (customElements.get(COMPONENT_TAG_NAME4) == null) {
  customElements.define(COMPONENT_TAG_NAME4, RouteLinkComponent, { extends: "a" });
}

// route-button.ts
var COMPONENT_TAG_NAME5 = "route-button";
var RouteButtonComponent = class extends HTMLButtonElement {
  constructor() {
    super();
    window.addEventListener("popstate", () => this.setIsCurrent());
  }
  connectedCallback() {
    const target = this.getTarget();
    if (target != null) {
      target.addEventListener("pathchange" /* PathChange */, () => this.setIsCurrent());
    }
    this.addEventListener("click", () => {
      if (target == null) {
        return;
      }
      const path = this.getAttribute("path") ?? this.getAttribute("data-path") ?? "";
      target.dispatchEvent(new CustomEvent("navigate" /* Navigate */, { detail: { target: this, path } }));
    });
    if (document.readyState == "complete") {
      this.setIsCurrent();
    }
  }
  getTarget() {
    let target = null;
    const forTargetAttribute = this.getAttribute("for");
    if (forTargetAttribute != null) {
      target = this.getRootNode().querySelector(`#${forTargetAttribute}`);
    } else {
      const targetAttribute = this.getAttribute("target");
      if (targetAttribute != null) {
        target = this.getRootNode().querySelector(targetAttribute);
      }
    }
    return target;
  }
  setIsCurrent() {
    const linkPath = this.getAttribute("path");
    if (linkPath == null) {
      return;
    }
    const target = this.getTarget();
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
};
if (customElements.get(COMPONENT_TAG_NAME5) == null) {
  customElements.define(COMPONENT_TAG_NAME5, RouteButtonComponent, { extends: "button" });
}

// path-router.ts
var PathRouterEvent = /* @__PURE__ */ ((PathRouterEvent2) => {
  PathRouterEvent2["Change"] = "change";
  PathRouterEvent2["PathChange"] = "pathchange";
  return PathRouterEvent2;
})(PathRouterEvent || {});
var COMPONENT_STYLESHEET = new CSSStyleSheet();
COMPONENT_STYLESHEET.replaceSync(`:host
{
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
}
::slotted(path-route)
{
    grid-column: 1;
    grid-row: 1;
    display: none;
}
::slotted(path-route[open])
{
    display: contents;
}`);
var WILDCARD_INDICATOR = "*";
var COMPONENT_TAG_NAME = "path-router";
var PathRouterComponent5 = class extends HTMLElement {
  get routes() {
    return [].map.call(this.querySelectorAll(`:scope > ${COMPONENT_TAG_NAME2}`), (route) => route);
  }
  get routeDialogs() {
    return [].map.call(this.querySelectorAll(`:scope > [is="${COMPONENT_TAG_NAME3}"]`), (routeDialog) => routeDialog);
  }
  currentPathRoute;
  currentRouteDialog;
  defaultRoute;
  wildcardRoute;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `<slot></slot>`;
    this.shadowRoot.adoptedStyleSheets.push(COMPONENT_STYLESHEET);
    window.addEventListener("popstate", async (_event) => {
      const path = window.location.pathname + window.location.hash;
      this.navigate(path);
    });
    this.addEventListener("navigate" /* Navigate */, async (event) => {
      const { path } = event.detail;
      this.navigate(path);
    });
    document.addEventListener("DOMContentLoaded", () => {
      this.init();
    });
  }
  /**
   * Navigate to a route path.
   * @param path route path
   */
  async navigate(path) {
    const { pathName, hash } = this.destructurePath(path);
    await this.update(pathName, hash);
    const newPath = `${pathName}${hash.trim() != "" ? "#" : ""}${hash}`;
    this.setPath(newPath);
  }
  getPathElement(path, elements) {
    const pathArrays = elements.map((element) => [element.getAttribute("path") ?? "", element]);
    const pathMap = new Map(pathArrays);
    path = path.startsWith("/") ? path.substring(1) : path;
    let foundRoute = null;
    routeLoop:
      for (let [routePath, element] of pathMap) {
        routePath = routePath.startsWith("/") ? routePath.substring(1) : routePath;
        const routeArray = routePath.split("/");
        const pathArray = path.split("/");
        for (let i = 0; i < pathArray.length; i++) {
          if (i == pathArray.length - 1 && pathArray[i] == "") {
            continue;
          }
          const slug = routeArray[i];
          if (slug == null) {
            foundRoute = null;
            continue routeLoop;
          }
          if (!slug.startsWith(":") && slug != WILDCARD_INDICATOR) {
            if (slug != pathArray[i]) {
              continue routeLoop;
            }
          }
          foundRoute = element;
        }
      }
    return foundRoute;
  }
  splitPath(path) {
    const pathArray = path.split("#");
    const pathName = pathArray[0];
    const subPath = path.length > 1 ? pathArray[1] : null;
    const subPathArray = subPath == null ? [""] : subPath.split("?");
    const hash = subPathArray == null ? "" : subPathArray[0];
    return { path: pathName, hash };
  }
  destructurePath(path) {
    let { path: pathName, hash } = this.splitPath(path);
    if (pathName.trim() == "" && hash != "") {
      const attributePath = this.getAttribute("path") ?? "";
      const { path: attributePathname } = this.splitPath(attributePath);
      pathName = attributePathname;
    }
    pathName = pathName.trim() == "" ? "/" : pathName;
    return { pathName, hash };
  }
  pathIsActive(path) {
    let { path: queryPath, hash: queryHash } = this.splitPath(path);
    queryPath = queryPath.startsWith("/") ? queryPath.substring(1) : queryPath;
    queryHash = queryHash.startsWith("#") ? queryHash.substring(1) : queryHash;
    let routerFullPath = this.getAttribute("path") ?? "/";
    let { path: routerComparePath, hash: routerCompareHash } = this.splitPath(routerFullPath);
    routerComparePath = routerComparePath.startsWith("/") ? routerComparePath.substring(1) : routerComparePath;
    routerCompareHash = routerCompareHash.startsWith("#") ? routerCompareHash.substring(1) : routerCompareHash;
    let matchingPath = false;
    if (queryPath == routerComparePath) {
      matchingPath = true;
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
  async init() {
    const promises = [];
    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];
      promises.push(route.close());
      if (this.defaultRoute == null) {
        this.defaultRoute = route;
      }
      const path = route.getAttribute("path");
      const isDefault = route.hasAttribute("default");
      if (path != null && path.trim() == "*") {
        this.wildcardRoute = route;
      }
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
    await Promise.allSettled(promises);
    if (!this.hasAttribute("manual")) {
      return this.navigate(this.getAttribute("path") ?? "");
    }
  }
  async update(path, hash) {
    const currentPathAttribute = this.getAttribute("path") ?? "";
    const { path: currentPath, hash: currentHash } = this.splitPath(currentPathAttribute);
    const pathHasChanged = currentPath != path;
    if (pathHasChanged) {
      await this.openRoute(path);
    }
    this.setAttribute("path", path);
    if (pathHasChanged || currentHash != hash) {
      await this.openRouteDialog(hash);
    }
  }
  async openRoute(path) {
    await Promise.allSettled(this.routes.map((route2) => {
      return route2.currentProcess;
    }));
    const closed = await this.closeCurrentPathRoute();
    if (closed == false) {
      return false;
    }
    let route = this.getPathElement(path, this.routes);
    if (route == null) {
      if (this.wildcardRoute != null) {
        route = this.wildcardRoute;
      }
    }
    route = route || this.defaultRoute;
    if (route == null) {
      return false;
    }
    const opened = await route.open(path);
    if (opened) {
      this.currentPathRoute = route;
      this.dispatchEvent(new CustomEvent("change" /* Change */, { detail: { route, path } }));
    }
    return opened;
  }
  async openRouteDialog(path) {
    const trimmedPath = path.startsWith("#") ? path.substring(1) : path;
    await Promise.allSettled(this.routeDialogs.map((route) => {
      return route.currentProcess;
    }));
    const closed = await this.closeCurrentRouteDialog();
    if (closed == false) {
      return false;
    }
    const routeDialog = this.getPathElement(trimmedPath, this.routeDialogs);
    if (routeDialog == null) {
      return false;
    }
    const opened = await routeDialog.openRoute(path);
    if (opened) {
      this.currentRouteDialog = routeDialog;
      this.dispatchEvent(new CustomEvent("change" /* Change */, { detail: { route: routeDialog, path: trimmedPath } }));
    }
    return opened;
  }
  setPath(path) {
    this.setAttribute("path", path);
    this.dispatchEvent(new CustomEvent("pathchange" /* PathChange */, { detail: { path } }));
  }
  async closeCurrentPathRoute() {
    if (this.currentPathRoute == null) {
      return true;
    }
    await Promise.allSettled(this.routes.map((route) => {
      return route.currentProcess;
    }));
    const closed = await this.currentPathRoute.close();
    if (closed == true) {
      this.currentPathRoute = void 0;
    }
    return closed;
  }
  async closeCurrentRouteDialog() {
    if (this.currentRouteDialog == null) {
      return true;
    }
    await Promise.allSettled(this.routeDialogs.map((route) => {
      return route.currentProcess;
    }));
    const closed = await this.currentRouteDialog.closeRoute();
    if (closed == true) {
      this.currentRouteDialog = void 0;
    }
    return closed;
  }
};
if (customElements.get(COMPONENT_TAG_NAME) == null) {
  customElements.define(COMPONENT_TAG_NAME, PathRouterComponent5);
}
export {
  COMPONENT_TAG_NAME,
  PathRouterComponent5 as PathRouterComponent,
  PathRouterEvent
};
