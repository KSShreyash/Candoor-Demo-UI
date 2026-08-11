/**
 * Shared step engine for both guided walkthroughs.
 *
 * Deliberately dumb: it does not know anything about interviews or rounds.
 * Each caller supplies a list of steps; this file only renders the panel,
 * tracks position, calls onEnter, and manages the spotlight outline and the
 * Skip control. All page state changes happen inside each step's onEnter.
 *
 * Plain script, not a module: opened straight off disk (file://) rather than
 * through a server, and browsers refuse to run `type="module"` imports from
 * that origin. Exposed as window.CandoorGuide instead of an export.
 */

(function () {
  let panelEl = null;
  let spotlightTarget = null;
  let blockerEl = null;
  let onCloseCallback = null;

  function clearSpotlight() {
    if (spotlightTarget) spotlightTarget.classList.remove("guide-spotlight");
    spotlightTarget = null;
  }

  function applySpotlight(selector) {
    clearSpotlight();
    if (!selector) return;
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add("guide-spotlight");
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    spotlightTarget = el;
  }

  // A transparent, full-page click-catcher underneath the panel (lower
  // z-index than the panel, higher than everything else) — while the guide
  // is running, the only way to affect the page is through it: Back, Next,
  // or Skip. Nothing behind it receives a click until one of those closes
  // this out, whether that's by finishing the tour or skipping it.
  function ensureBlocker() {
    if (blockerEl) return;
    blockerEl = document.createElement("div");
    blockerEl.className = "guide-blocker";
    document.body.append(blockerEl);
  }

  function removeBlocker() {
    if (blockerEl) blockerEl.remove();
    blockerEl = null;
  }

  function closeGuide() {
    clearSpotlight();
    removeBlocker();
    if (panelEl) panelEl.remove();
    panelEl = null;
    window.removeEventListener("resize", repositionForCurrentTarget);
    // Fires whether the guide was skipped or finished normally — both are
    // "the guide is over now," and the caller gets exactly one chance to
    // tidy up (e.g. collapsing everything it opened along the way).
    if (onCloseCallback) onCloseCallback();
    onCloseCallback = null;
  }

  // Reserved strip along the top of the viewport where fixed nav controls
  // live (a demo badge, a "Rules" toggle) — the panel never lands there, so
  // it can never end up sitting under one of those buttons.
  const TOP_NAV_CLEARANCE = 84;
  const EDGE_MARGIN = 18;

  /**
   * Picks whichever screen corner is farthest from the thing being
   * explained, so the panel points at content instead of covering it, and
   * moves there every step instead of sitting in one fixed spot regardless
   * of what's on screen.
   */
  function positionPanel(target) {
    if (!panelEl) return;

    let vert = "bottom";
    let horiz = "right";

    if (target && target.isConnected) {
      const rect = target.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      horiz = cx < window.innerWidth / 2 ? "right" : "left";
      vert = cy < window.innerHeight / 2 ? "bottom" : "top";
    }

    // "auto", not "" — clearing an inline style falls back to the
    // stylesheet's own bottom:1.2rem/right:1.2rem defaults (there for the
    // rare case nothing is spotlighted yet), and a fixed-position element
    // with BOTH top and bottom set gets stretched to span between them
    // instead of sizing to its content. Explicit "auto" on the unused axis
    // is what actually clears it.
    panelEl.style.top = panelEl.style.bottom = "auto";
    panelEl.style.left = panelEl.style.right = "auto";

    panelEl.style[vert === "top" ? "top" : "bottom"] =
      `${vert === "top" ? TOP_NAV_CLEARANCE : EDGE_MARGIN}px`;
    panelEl.style[horiz === "left" ? "left" : "right"] = `${EDGE_MARGIN}px`;
  }

  function repositionForCurrentTarget() {
    positionPanel(spotlightTarget);
  }

  function startGuide(steps, { onClose } = {}) {
    let index = 0;
    onCloseCallback = onClose || null;
    ensureBlocker();

    // Built once, then only ever has its text mutated on later steps —
    // rebuilding the whole innerHTML every step (the previous approach)
    // destroyed and recreated every node each time, which meant there was
    // never a "before" state for CSS to transition from. Buttons are wired
    // up once here too, closing over the same mutable `index` that enter()
    // itself updates.
    function buildPanel() {
      panelEl = document.createElement("div");
      panelEl.className = "guide-panel";
      panelEl.innerHTML = `
        <p class="guide-panel__count"></p>
        <div class="guide-panel__content">
          <h2 class="guide-panel__title"></h2>
          <p class="guide-panel__body"></p>
        </div>
        <div class="guide-panel__row">
          <button type="button" class="guide-panel__back">Back</button>
          <button type="button" class="guide-panel__next"></button>
          <button type="button" class="guide-panel__skip">Skip guide</button>
        </div>
      `;
      document.body.append(panelEl);

      panelEl.querySelector(".guide-panel__back").addEventListener("click", () => {
        if (index === 0) return;
        index -= 1;
        enter();
      });

      panelEl.querySelector(".guide-panel__next").addEventListener("click", () => {
        if (index === steps.length - 1) {
          closeGuide();
          return;
        }
        index += 1;
        enter();
      });

      panelEl.querySelector(".guide-panel__skip").addEventListener("click", closeGuide);
    }

    function applyStepText() {
      const step = steps[index];
      panelEl.querySelector(".guide-panel__count").textContent = `Step ${index + 1} of ${steps.length}`;
      panelEl.querySelector(".guide-panel__title").textContent = step.title;
      panelEl.querySelector(".guide-panel__body").textContent = step.body;
      panelEl.querySelector(".guide-panel__back").disabled = index === 0;
      panelEl.querySelector(".guide-panel__next").textContent =
        index === steps.length - 1 ? "Done" : "Next";
    }

    function render() {
      const isFirstRender = !panelEl;
      if (isFirstRender) buildPanel();

      if (isFirstRender) {
        applyStepText();
        return;
      }

      // Cross-fade instead of a jump-cut: fade the old title/body out, swap
      // the text once it's invisible, then fade the new step in.
      const content = panelEl.querySelector(".guide-panel__content");
      content.classList.add("guide-panel__content--swap");
      window.setTimeout(() => {
        applyStepText();
        content.classList.remove("guide-panel__content--swap");
      }, 160);
    }

    // onEnter runs BEFORE the spotlight is applied: a step's job is often to
    // reveal or move the very thing it wants to point at (open the drawer,
    // expand a section), and scrollIntoView needs that to have already
    // happened or it scrolls to wherever the target was a moment ago.
    function enter() {
      const step = steps[index];
      if (step.onEnter) step.onEnter();
      applySpotlight(step.spotlight);
      render();
      positionPanel(spotlightTarget);
    }

    window.addEventListener("resize", repositionForCurrentTarget);
    enter();
  }

  window.CandoorGuide = { startGuide };
})();
