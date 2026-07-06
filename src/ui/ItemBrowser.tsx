import { categories, currentCategory, currentItem, itemsInCategory, selectCategory, selectItem } from "../state/store";

export function ItemBrowser() {
  return (
    <div class="left-panel">
      <div class="panel-label">ITEMS</div>
      <div id="categoryTabs">
        {categories.value.map((cat) => (
          <button
            key={cat}
            class={`category-tab${cat === currentCategory.value ? " active" : ""}`}
            onClick={() => selectCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div id="itemLinks">
        <div class="item-grid">
          {itemsInCategory.value.map((itm) => {
            const iconId = itm.replace("/items/", "");
            return (
              <a
                key={itm}
                href="#"
                class={itm === currentItem.value ? "active" : ""}
                title={iconId.replace(/_/g, " ")}
                onClick={(e) => {
                  e.preventDefault();
                  selectItem(itm);
                }}
              >
                <svg width="28" height="28" style={{ filter: "brightness(1.1)" }}>
                  <use href={`#${iconId}`} />
                </svg>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
