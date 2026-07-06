import { useEffect, useRef } from "preact/hooks";
import { PROJECTS } from "../data/projects";
import { sidePanelOpen } from "../state/store";

const hoverCapable =
  typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

export function SidePanel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);
  const open = sidePanelOpen;

  useEffect(() => {
    // Touch devices: tap outside closes. Any device: Escape closes.
    const onPointerDown = (e: PointerEvent) => {
      if (open.value && rootRef.current && !rootRef.current.contains(e.target as Node)) {
        open.value = false;
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open.value) {
        open.value = false;
        tabRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      class={`side-panel${open.value ? " open" : ""}`}
      onMouseEnter={() => hoverCapable && (open.value = true)}
      onMouseLeave={() => hoverCapable && (open.value = false)}
    >
      <nav id="side-panel-drawer" class="side-panel-drawer" aria-label="Other projects by Alver">
        <div class="side-panel-heading">ALSO BY ALVER</div>
        {PROJECTS.map((p) => (
          <a key={p.url} class="project-card" href={p.url}>
            <span class="project-icon" aria-hidden="true">
              {p.icon}
            </span>
            <span class="project-text">
              <span class="project-title">{p.title}</span>
              <span class="project-desc">{p.desc}</span>
            </span>
          </a>
        ))}
      </nav>
      <button
        ref={tabRef}
        type="button"
        class="side-panel-tab"
        aria-expanded={open.value}
        aria-controls="side-panel-drawer"
        onClick={() => (open.value = !open.value)}
      >
        MORE PROJECTS BY ALVER
      </button>
    </div>
  );
}
