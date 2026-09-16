// =====================================================================
// 1. VISUAL UI CONFIGURATION EDITOR COMPONENT
// =====================================================================
class StrCalendarCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this._config = { ...config };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  render() {
    if (!this._hass || !this._config) return;

    // Normalizes existing single-entity or multi-entity configs
    const currentEntities = this._config.entities || (this._config.entity ? [{ entity: this._config.entity, name: "", color: "#ff385c" }] : []);
    const titleVal = this._config.title || "";

    // Grab available calendar entities from Home Assistant state machine
    const availableCalendars = Object.keys(this._hass.states)
      .filter((eid) => eid.startsWith("calendar."))
      .sort();

    this.shadowRoot.innerHTML = `
      <style>
        .form-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 16px;
        }
        label {
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--primary-text-color);
          margin-bottom: 6px;
        }
        input[type="text"], select {
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid var(--divider-color, #ccc);
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
          font-size: 0.9rem;
        }
        .entities-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 12px;
        }
        .entity-row {
          display: grid;
          grid-template-columns: 1fr 1fr 40px 32px;
          gap: 8px;
          align-items: center;
          padding: 8px;
          background: var(--secondary-background-color, #f9f9f9);
          border-radius: 8px;
          border: 1px solid var(--divider-color, #eee);
        }
        input[type="color"] {
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          cursor: pointer;
          background: transparent;
        }
        .btn {
          background: var(--primary-color, #03a9f4);
          color: #ffffff;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.85rem;
        }
        .btn-delete {
          background: none;
          color: var(--error-color, #db4437);
          font-size: 1.2rem;
          cursor: pointer;
          border: none;
          padding: 4px;
          line-height: 1;
        }
        .sub-header {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--primary-text-color);
          margin: 12px 0 6px 0;
        }
      </style>

      <div class="form-row">
        <label>Card Title</label>
        <input type="text" id="title-input" value="${titleVal}" placeholder="e.g. Suite Bookings" />
      </div>

      <div class="sub-header">Calendars & Properties</div>
      <div class="entities-container" id="entities-list"></div>

      <button class="btn" id="add-entity-btn">+ Add Calendar</button>
    `;

    const listContainer = this.shadowRoot.getElementById("entities-list");

    // Populate each entity line
    currentEntities.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "entity-row";

      const select = document.createElement("select");
      availableCalendars.forEach((cId) => {
        const opt = document.createElement("option");
        opt.value = cId;
        opt.textContent = this._hass.states[cId]?.attributes?.friendly_name || cId;
        if (cId === item.entity) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("change", (e) => this.updateItem(index, "entity", e.target.value));

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "Display Label";
      nameInput.value = item.name || "";
      nameInput.addEventListener("input", (e) => this.updateItem(index, "name", e.target.value));

      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = item.color || "#ff385c";
      colorInput.addEventListener("input", (e) => this.updateItem(index, "color", e.target.value));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-delete";
      deleteBtn.innerHTML = "×";
      deleteBtn.title = "Remove";
      deleteBtn.addEventListener("click", () => this.deleteItem(index));

      row.appendChild(select);
      row.appendChild(nameInput);
      row.appendChild(colorInput);
      row.appendChild(deleteBtn);
      listContainer.appendChild(row);
    });

    // Title input listener
    this.shadowRoot.getElementById("title-input").addEventListener("input", (e) => {
      this._config = { ...this._config, title: e.target.value };
      this.fireConfigChanged();
    });

    // Add calendar button listener
    this.shadowRoot.getElementById("add-entity-btn").addEventListener("click", () => {
      const fallbackId = availableCalendars[0] || "calendar.crystal_hollows_rental_control";
      const palette = ["#ff385c", "#008489", "#8e44ad", "#d35400", "#2980b9", "#27ae60"];
      const newColor = palette[currentEntities.length % palette.length];
      
      const updated = [...currentEntities, { entity: fallbackId, name: "", color: newColor }];
      this._config = { ...this._config, entities: updated };
      delete this._config.entity; // standardize on array
      this.fireConfigChanged();
      this.render();
    });
  }

  updateItem(index, field, value) {
    const list = [...(this._config.entities || [])];
    list[index][field] = value;
    this._config = { ...this._config, entities: list };
    delete this._config.entity;
    this.fireConfigChanged();
  }

  deleteItem(index) {
    const list = [...(this._config.entities || [])];
    list.splice(index, 1);
    this._config = { ...this._config, entities: list };
    delete this._config.entity;
    this.fireConfigChanged();
    this.render();
  }

  fireConfigChanged() {
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
}

customElements.define("str-calendar-card-editor", StrCalendarCardEditor);


// =====================================================================
// 2. MAIN CARD COMPONENT
// =====================================================================
class StrCalendarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentDate = new Date();
  }

  // Declares the visual editor element to Lovelace
  static async getConfigElement() {
    return document.createElement("str-calendar-card-editor");
  }

  static getStubConfig() {
    return {
      title: "Suite Bookings",
      entities: [
        { entity: "calendar.crystal_hollows_rental_control", name: "Crystal Hollows", color: "#ff385c" }
      ]
    };
  }

  setConfig(config) {
    if (!config.entity && (!config.entities || !config.entities.length)) {
      throw new Error("Please select at least one calendar entity.");
    }

    this.config = {
      title: config.title || "",
      entities: config.entities
        ? config.entities.map((e, idx) => {
            if (typeof e === "string") return { entity: e, color: this.getDefaultColor(idx) };
            return {
              entity: e.entity,
              name: e.name || "",
              color: e.color || this.getDefaultColor(idx)
            };
          })
        : [{ entity: config.entity, color: config.color || "#ff385c" }]
    };

    this.renderBase();
  }

  getDefaultColor(idx) {
    const palette = ["#ff385c", "#008489", "#8e44ad", "#d35400", "#2980b9", "#27ae60"];
    return palette[idx % palette.length];
  }

  set hass(hass) {
    this._hass = hass;
    if (this._initialLoaded) return;
    this._initialLoaded = true;
    this.updateEvents();
  }

  renderBase() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--paper-font-body1_-_font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
        }
        ha-card {
          padding: 16px;
          border-radius: var(--ha-card-border-radius, 14px);
          background: var(--ha-card-background, var(--card-background-color, #ffffff));
          box-shadow: var(--ha-card-box-shadow, none);
          overflow: hidden;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--primary-text-color);
        }
        .controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .nav-btn {
          background: var(--card-background-color, #fff);
          border: 1px solid var(--divider-color, #e0e0e0);
          cursor: pointer;
          font-size: 0.95rem;
          color: var(--primary-text-color);
          padding: 5px 12px;
          border-radius: 6px;
          transition: background 0.15s ease;
        }
        .nav-btn:hover {
          background: var(--secondary-background-color, #f5f5f5);
        }
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 10px;
          font-size: 0.8rem;
          color: var(--secondary-text-color);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .days-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--secondary-text-color, #717171);
          padding-bottom: 8px;
          border-bottom: 1px solid var(--divider-color, #ebebeb);
        }
        .month-container {
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--divider-color, #ebebeb);
          border-top: 1px solid var(--divider-color, #ebebeb);
        }
        .week-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          position: relative;
          min-height: 80px;
          border-bottom: 1px solid var(--divider-color, #ebebeb);
        }
        .day-cell {
          border-right: 1px solid var(--divider-color, #ebebeb);
          padding: 6px;
          position: relative;
          background: var(--card-background-color, #fff);
          box-sizing: border-box;
        }
        .day-cell.other-month {
          background: var(--secondary-background-color, #fafafa);
          opacity: 0.45;
        }
        .day-cell.today .day-number {
          background: var(--primary-color, #ff385c);
          color: #ffffff;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .day-number {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--primary-text-color);
        }
        .bars-layer {
          position: absolute;
          top: 30px;
          left: 0;
          right: 0;
          bottom: 4px;
          pointer-events: none;
        }
        .booking-bar {
          position: absolute;
          height: 22px;
          line-height: 22px;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0 8px;
          box-sizing: border-box;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          pointer-events: auto;
          cursor: pointer;
          z-index: 5;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        .booking-bar.is-start {
          border-top-left-radius: 11px;
          border-bottom-left-radius: 11px;
        }
        .booking-bar.is-end {
          border-top-right-radius: 11px;
          border-bottom-right-radius: 11px;
        }
      </style>
      <ha-card>
        <div class="header">
          <div class="title" id="month-title">Loading...</div>
          <div class="controls">
            <button class="nav-btn" id="prev-btn">‹</button>
            <button class="nav-btn" id="today-btn">Today</button>
            <button class="nav-btn" id="next-btn">›</button>
          </div>
        </div>
        <div class="legend" id="legend"></div>
        <div class="days-header">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="month-container" id="month-container"></div>
      </ha-card>
    `;

    this.shadowRoot.getElementById("prev-btn").addEventListener("click", () => this.changeMonth(-1));
    this.shadowRoot.getElementById("next-btn").addEventListener("click", () => this.changeMonth(1));
    this.shadowRoot.getElementById("today-btn").addEventListener("click", () => {
      this.currentDate = new Date();
      this.updateEvents();
    });
  }

  changeMonth(offset) {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + offset, 1);
    this.updateEvents();
  }

  async updateEvents() {
    if (!this._hass || !this.config.entities.length) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const titlePrefix = this.config.title ? `${this.config.title} - ` : "";
    const titleEl = this.shadowRoot.getElementById("month-title");
    if (titleEl) {
      titleEl.textContent = titlePrefix + new Date(year, month, 1).toLocaleString("default", {
        month: "long",
        year: "numeric"
      });
    }

    const legendEl = this.shadowRoot.getElementById("legend");
    if (legendEl) {
      legendEl.innerHTML = "";
      if (this.config.entities.length > 1) {
        this.config.entities.forEach((cfg) => {
          if (cfg.name) {
            const item = document.createElement("div");
            item.className = "legend-item";
            item.innerHTML = `
              <span class="legend-dot" style="background-color: ${cfg.color}"></span>
              <span>${cfg.name}</span>
            `;
            legendEl.appendChild(item);
          }
        });
      }
    }

    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const gridStart = new Date(year, month, 1 - startOffset, 0, 0, 0);

    const lastDay = new Date(year, month + 1, 0);
    const endOffset = 6 - lastDay.getDay();
    const gridEnd = new Date(year, month + 1, endOffset, 23, 59, 59);

    try {
      const startStr = encodeURIComponent(gridStart.toISOString());
      const endStr = encodeURIComponent(gridEnd.toISOString());

      const eventPromises = this.config.entities.map(async (cfg) => {
        try {
          const res = await this._hass.callApi(
            "GET",
            `calendars/${cfg.entity}?start=${startStr}&end=${endStr}`
          );
          return (res || []).map((ev) => ({
            ...ev,
            _color: cfg.color,
            _listing: cfg.name || cfg.entity
          }));
        } catch (e) {
          console.error(`Error loading ${cfg.entity}:`, e);
          return [];
        }
      });

      const results = await Promise.all(eventPromises);
      this.renderCalendar(gridStart, gridEnd, results.flat());
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
    }
  }

  cleanSummary(summary) {
    if (!summary) return "Reserved";
    return summary
      .replace(/^Reserved\s*-\s*/i, "")
      .replace(/^Airbnb\s*\(Not available\)/i, "Airbnb Block")
      .trim();
  }

  renderCalendar(gridStart, gridEnd, events) {
    const container = this.shadowRoot.getElementById("month-container");
    if (!container) return;
    container.innerHTML = "";

    const today = new Date();
    const currentMonth = this.currentDate.getMonth();

    const weeks = [];
    let cur = new Date(gridStart);
    while (cur <= gridEnd) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }

    weeks.forEach((week) => {
      const weekRow = document.createElement("div");
      weekRow.className = "week-row";

      const weekStart = new Date(week[0]);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(week[6]);
      weekEnd.setHours(23, 59, 59, 999);

      week.forEach((day) => {
        const cell = document.createElement("div");
        cell.className = "day-cell";
        if (day.getMonth() !== currentMonth) cell.classList.add("other-month");
        if (
          day.getDate() === today.getDate() &&
          day.getMonth() === today.getMonth() &&
          day.getFullYear() === today.getFullYear()
        ) {
          cell.classList.add("today");
        }

        cell.innerHTML = `<span class="day-number">${day.getDate()}</span>`;
        weekRow.appendChild(cell);
      });

      const barsLayer = document.createElement("div");
      barsLayer.className = "bars-layer";
      const slotTracks = [];

      const weekEvents = events
        .map((ev) => {
          const rawStart = ev.start.dateTime || ev.start.date || ev.start;
          const rawEnd = ev.end.dateTime || ev.end.date || ev.end;
          return { ...ev, _evStart: new Date(rawStart), _evEnd: new Date(rawEnd) };
        })
        .filter((ev) => ev._evEnd > weekStart && ev._evStart < weekEnd)
        .sort((a, b) => a._evStart - b._evStart);

      weekEvents.forEach((ev) => {
        let startCol = 0;
        let isEventStart = false;
        if (ev._evStart >= weekStart) {
          startCol = ev._evStart.getDay();
          isEventStart = true;
        }

        let endCol = 6;
        let isEventEnd = false;
        if (ev._evEnd <= weekEnd) {
          endCol = ev._evEnd.getDay();
          isEventEnd = true;
        }

        const colWidth = 100 / 7;
        let leftPercent = startCol * colWidth;
        if (isEventStart) leftPercent += colWidth * 0.5;

        let rightEdgePercent = (endCol + 1) * colWidth;
        if (isEventEnd) rightEdgePercent -= colWidth * 0.5;

        const widthPercent = Math.max(rightEdgePercent - leftPercent, 3);

        let slotIndex = 0;
        while (true) {
          if (!slotTracks[slotIndex]) {
            slotTracks[slotIndex] = [];
            break;
          }
          const hasCollision = slotTracks[slotIndex].some(
            (busy) => !(rightEdgePercent <= busy.left || leftPercent >= busy.right)
          );
          if (!hasCollision) break;
          slotIndex++;
        }

        slotTracks[slotIndex].push({ left: leftPercent, right: rightEdgePercent });

        const bar = document.createElement("div");
        bar.className = "booking-bar";
        if (isEventStart) bar.classList.add("is-start");
        if (isEventEnd) bar.classList.add("is-end");

        bar.style.backgroundColor = ev._color;
        bar.style.left = `${leftPercent}%`;
        bar.style.width = `${widthPercent}%`;
        bar.style.top = `${slotIndex * 26}px`;

        const guestName = this.cleanSummary(ev.summary);
        bar.textContent = `${ev._listing ? ev._listing + ': ' : ''}${guestName}`;
        bar.title = `${ev._listing ? '[' + ev._listing + '] ' : ''}${guestName}\nCheck-in: ${ev._evStart.toLocaleDateString()}\nCheck-out: ${ev._evEnd.toLocaleDateString()}`;

        barsLayer.appendChild(bar);
      });

      const maxSlots = Math.max(slotTracks.length, 1);
      const neededHeight = Math.max(34 + maxSlots * 26 + 6, 80);
      weekRow.style.minHeight = `${neededHeight}px`;

      weekRow.appendChild(barsLayer);
      container.appendChild(weekRow);
    });
  }

  getCardSize() {
    return 6;
  }
}

customElements.define("str-calendar-card", StrCalendarCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "str-calendar-card",
  name: "STR Multi-Calendar Card",
  description: "Displays Airbnb/VRBO continuous reservation bars for multiple STR listings"
});
