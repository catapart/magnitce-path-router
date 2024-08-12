import { PathRouterComponent, PathRouterEvent } from "./path-router";

export enum RouteLinkEvent
{
    Navigate = "navigate",
};

export const COMPONENT_TAG_NAME = 'route-link';
export class RouteLinkComponent extends HTMLAnchorElement
{
    constructor()
    {
        super();
        // set here to catch first window load
        // window.addEventListener('popstate', () => this.setIsCurrent());
    }
    connectedCallback()
    {
        const target = this.getTarget();
        if(target != null)
        {
            target.addEventListener(PathRouterEvent.PathChange, () => this.setIsCurrent());
        }

        this.addEventListener('click', () =>
        {
            if(target == null)
            {
                return;
            }
            const path = this.#preparePath();
            target.dispatchEvent(new CustomEvent(RouteLinkEvent.Navigate, { detail: { target: this, path } }));
        });

        // wait for document to be loaded before accessing
        // path-router component; if this doesn't set the
        // current status, the navigate event will
        if(document.readyState == 'complete')
        {
            this.setIsCurrent();
        }
    }

    #preparePath()
    {
        let path = this.getAttribute('path') ?? this.getAttribute('data-path') ?? "";
        path = this.onPreparePath(path);
        return path;
    }
    /**
     * An override-able string transformation function for preparing the static path attribute value.
     * @param staticPath the path that is set in the route-link's html
     * @returns a new path that has been transformed to the exact path expected for navigation
     * @description Useful for replacing variables.
     */
    onPreparePath(staticPath: string) { return staticPath; }

    private getTarget()
    {
        let target: PathRouterComponent|null = null;
        const forTargetAttribute = this.getAttribute('for');
        if(forTargetAttribute != null) { target = (this.getRootNode() as Document|ShadowRoot).querySelector(`#${forTargetAttribute}`) as PathRouterComponent; }
        else
        {
            const targetAttribute = this.getAttribute('target');
            if(targetAttribute != null) { target = (this.getRootNode() as Document|ShadowRoot).querySelector(targetAttribute) as PathRouterComponent; }
        }
        return target;
    }

    private setIsCurrent()
    {
        // console.log('isCurrent', this);
        const linkPath = this.getAttribute('path');
        if(linkPath == null) { return; }

        const target = this.getTarget();
        if(target == null) { return; }

        const targetRouter = target as PathRouterComponent;        
        if(targetRouter.pathIsActive(linkPath))
        {
            this.setAttribute('aria-current', "page");
        }
        else
        {
            this.removeAttribute('aria-current');
        }
    }
}
if(customElements.get(COMPONENT_TAG_NAME) == null)
{
    customElements.define(COMPONENT_TAG_NAME, RouteLinkComponent, { extends: 'a' });
}