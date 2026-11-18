(() => {
  const storageKey = "campus-stores.shift.v1";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
    ["Safety checks", "clipboard-list"],
    ["Activity log", "messages-square"],
  ];
  const original = () => ({
    version: 1,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        back: false,
      },
    ],
    notes: [],
    // Sample units begin with a recorded baseline clearance. Staff can
    // quarantine a unit until cleaning, function and accessory checks pass.
    safety: Object.fromEntries(assets.map((a) => [a.id, { status: "Cleared", note: "Baseline sample clearance" }])),
    activity: [{ time: "Shift start", action: "Sample shift opened", detail: "Baseline inventory loaded" }],
    editing: false,
    returning: 0,
    onlyOpen: true,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list) =>
    list
      .map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + "</option>")
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const badge = (t, good = false) =>
    '<span class="tag' + (good ? " good" : "") + '">' + esc(t) + "</span>";
  // A request is ready when every approved equipment type is either already
  // issued against that request or has at least one serviceable unit on shelf.
  function readiness(r) {
    const items = r.items.map((type) => {
      const issued = s.loans.find(
        (l) => l.req === r.id && !l.back && getAsset(l.asset)?.type === type,
      );
      const available = assets.filter(
        (a) => a.type === type && !a.repair && !out(a.id) &&
          (s.safety?.[a.id]?.status || "Cleared") === "Cleared",
      );
      return {
        type,
        state: issued ? "Issued" : available.length ? "Available" : "Unavailable",
        detail: issued
          ? "Assigned on loan " + "L-" + issued.num
          : available.length
            ? available.length + " unit" + (available.length === 1 ? "" : "s") + " on shelf"
            : "No serviceable unit on shelf",
      };
    });
    return {
      items,
      ready: items.every((item) => item.state !== "Unavailable"),
      issued: items.filter((item) => item.state === "Issued").length,
      unavailable: items.filter((item) => item.state === "Unavailable").length,
    };
  }
  function requestPage() {
    let html = head(
      "Approved requests",
      "Live equipment readiness · updates after every issue or return",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      const check = readiness(r);
      html += btn("Back to list", "close");
      html += '<div class="record"><small>' + r.id + " · Approved</small><h3>" +
        esc(r.event) + "</h3><p>" + esc(r.club) + " · Filed by " + esc(r.owner) +
        "</p><p><b>Return by</b> " + esc(r.due) + '</p><div class="readiness-summary">' +
        badge(check.ready ? "Ready to fulfil" : "Blocked · stock unavailable", check.ready) +
        "<span>" + check.issued + " of " + r.items.length + " item types already issued</span></div>" +
        '<h3 class="check-title">Equipment readiness</h3><div class="readiness-list">' +
        check.items.map((item) => '<div class="readiness-item"><span>' + esc(item.type) +
          '</span><span class="readiness-state ' + item.state.toLowerCase() + '">' + esc(item.state) +
          '</span><small>' + esc(item.detail) + '</small></div>').join("") +
        '</div><p class="request-note">' + esc(r.note) + "</p></div>";
    } else {
      html += '<div class="readiness-overview"><b>Fulfilment overview</b><span>' +
        requests.filter((r) => readiness(r).ready).length + ' / ' + requests.length +
        ' requests currently ready</span></div>';
      html += requests.map((r) => {
        const check = readiness(r);
        return row(
          r.event,
          r.id + " · " + r.club + " · " + (check.ready ? "All equipment accounted for" : check.unavailable + " item type unavailable"),
          '<div class="request-actions">' + badge(check.ready ? "Ready" : "Blocked", check.ready) + btn("View details", "request", r.id) + '</div>',
        );
      }).join("");
    }
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair", "Needs inspection", "Quarantined"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const safetyStatus = s.safety?.[a.id]?.status || "Cleared";
      const status = a.repair
        ? "In repair"
        : safetyStatus !== "Cleared"
          ? safetyStatus
          : out(a.id)
            ? "On loan"
            : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model + " · " + a.bin,
        badge(status, status === "On shelf"),
      );
    }
    return html;
  }
  function register() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) {
      const select = (label, key, options) =>
        "<label><span>" +
        label +
        '</span><select name="' +
        key +
        '" required><option value="">Select…</option>' +
        opts(options) +
        "</select></label>";
      return (
        html +
        '<form data-issue><div class="form">' +
        select(
          "Approved request",
          "req",
          requests.map((r) => [r.id, r.id + " · " + r.club]),
        ).replace('<select name="req"', '<select name="req" data-issue-request') +
        '<label><span>Unit leaving the desk</span><select name="asset" data-issue-asset required disabled><option value="">Choose an approved request first…</option></select></label>' +
        select(
          "Collected by",
          "who",
          people.map((p) => [p, p]),
        ) +
        select(
          "Return by",
          "due",
          ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"].map((d) => [d, d]),
        ) +
        '</div><button type="submit" class="primary">Save issue slip</button></form>'
      );
    }
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown) {
      html += row(
        "L-" + l.num + " · " + l.asset,
        l.req + " · " + l.who + " · Due " + l.due +
          (l.back && l.returnCondition ? " · " + l.returnCondition : ""),
        l.back
          ? badge("Returned")
          : btn("Record return", "return", String(l.num)),
      );
      if (!l.back && s.returning === l.num) {
        html += '<form class="return-form" data-return="' + l.num + '"><div class="form">' +
          '<label><span>Return condition</span><select name="condition" required>' +
          '<option value="">Select condition…</option>' +
          '<option value="Passed inspection">Passed inspection · clean and functional</option>' +
          '<option value="Needs cleaning">Needs cleaning / inspection</option>' +
          '<option value="Damaged">Damaged · quarantine unit</option></select></label>' +
          '<label><span>Return notes</span><input name="note" maxlength="180" placeholder="Condition, missing accessories, cleaning…" required></label>' +
          '</div><div class="buttons"><button type="submit" class="primary">Complete return</button>' +
          btn("Cancel", "cancel-return") + '</div></form>';
      }
    }
    return html;
  }
  function safetyChecks() {
    let html = head(
      "Safety & quality checks",
      "Shared-equipment controls · cleaning, function test and accessory completeness",
    );
    html += '<div class="safety-callout"><strong>Issue control</strong><span>Units marked “Quarantined” or “Needs inspection” cannot be issued until cleared.</span></div>';
    for (const a of assets) {
      const check = s.safety?.[a.id] || { status: "Needs inspection", note: "No inspection recorded" };
      html += '<article class="safety-card"><div class="safety-card-head"><div><strong>' +
        esc(a.id + " · " + a.type) + '</strong><small>' + esc(a.model + " · " + a.bin) +
        '</small></div>' + badge(check.status, check.status === "Cleared") +
        '</div><p class="safety-note">' + esc(check.note || "No inspection note") +
        '</p><form data-safety="' + esc(a.id) + '"><div class="form">' +
        '<label><span>Inspection outcome</span><select name="status" required>' +
        [["Cleared", "Cleared · ready for issue"], ["Needs inspection", "Needs inspection"], ["Quarantined", "Quarantined · do not issue"]].map(([v, label]) => '<option value="' + esc(v) + '"' + (check.status === v ? " selected" : "") + '>' + esc(label) + '</option>').join("") +
        '</select></label><label><span>Inspection note</span><input name="note" maxlength="180" placeholder="Cleaning, function test, missing accessory…" required></label></div>' +
        '<button type="submit">Save inspection</button></form></article>';
    }
    return html;
  }
  function activityLog() {
    let html = head(
      "Activity log",
      "Audit trail of operational changes in this browser session",
    );
    const entries = (s.activity || []).slice().reverse();
    if (!entries.length) return html + "<p>No activity recorded yet.</p>";
    for (const entry of entries) {
      html += '<article class="activity-entry"><small>' + esc(entry.time) +
        '</small><strong>' + esc(entry.action) + '</strong><p>' +
        esc(entry.detail) + '</p></article>';
    }
    return html;
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([shifts[n.phase].time, "Counter handover", n.text]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
    "Safety checks": safetyChecks,
    "Activity log": activityLog,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = s.notice;
  }
  function logActivity(action, detail) {
    if (!Array.isArray(s.activity)) s.activity = [];
    s.activity.push({ time: shifts[s.phase]?.time || "Current shift", action, detail });
    if (s.activity.length > 100) s.activity = s.activity.slice(-100);
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "restart":
        s = original();
        break;
      case "advance":
        if (s.phase < 2) {
          s.phase++;
          logActivity("Shift advanced", shifts[s.phase].title);
        }
        s.notice = "Shift time updated.";
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        s.returning = 0;
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "return": {
        const l = s.loans.find((l) => l.num === Number(v));
        if (!l || l.back) return;
        s.returning = l.num;
        break;
      }
      case "cancel-return":
        s.returning = 0;
        break;
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
      return;
    }
    if (e.target.matches("[data-issue-request]")) {
      const request = getReq(e.target.value);
      const assetSelect = q("[data-issue-asset]");
      if (!assetSelect) return;
      const eligible = request ? assets.filter((a) =>
        request.items.includes(a.type) &&
        !a.repair &&
        !out(a.id) &&
        (s.safety?.[a.id]?.status || "Cleared") === "Cleared" &&
        !s.loans.some((l) => l.req === request.id && !l.back && getAsset(l.asset)?.type === a.type)
      ) : [];
      assetSelect.innerHTML = '<option value="">Select an available requested unit…</option>' +
        eligible.map((a) => '<option value="' + esc(a.id) + '">' + esc(a.id + " · " + a.type + " · " + a.model) + '</option>').join("");
      assetSelect.disabled = eligible.length === 0;
      if (request && !eligible.length) {
        q("[data-status]").textContent = "No eligible units remain for this request. Check inventory, outstanding loans and safety status.";
      }
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-return]")) {
      const num = Number(f.dataset.return);
      const loan = s.loans.find((l) => l.num === num && !l.back);
      const condition = String(form.get("condition"));
      const note = String(form.get("note")).trim();
      if (!loan || !["Passed inspection", "Needs cleaning", "Damaged"].includes(condition) || !note) return;
      loan.back = true;
      loan.returnCondition = condition;
      loan.returnNote = note;
      const safetyStatus = condition === "Passed inspection" ? "Cleared" : condition === "Damaged" ? "Quarantined" : "Needs inspection";
      s.safety[loan.asset] = {
        status: safetyStatus,
        note: "Return check: " + condition + " — " + note
      };
      s.returning = 0;
      logActivity("Equipment returned", loan.asset + " · slip L-" + loan.num + " · " + condition + " · " + note);
      commit("Return recorded for " + loan.asset + ". Safety status: " + safetyStatus + ".");
      return;
    }
    if (f.matches("[data-safety]")) {
      const assetId = f.dataset.safety;
      const status = String(form.get("status"));
      const note = String(form.get("note")).trim();
      if (!getAsset(assetId) || !["Cleared", "Needs inspection", "Quarantined"].includes(status) || !note) return;
      s.safety[assetId] = { status, note };
      logActivity("Safety status updated", assetId + " · " + status + " · " + note);
      commit(assetId + " inspection saved: " + status + ".");
      return;
    }
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      logActivity("Handover note added", text);
      commit("Handover note saved.");
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || unit.repair || out(asset) || !people.includes(who) ||
        !["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"].includes(due))
      return;
    if ((s.safety?.[asset]?.status || "Cleared") !== "Cleared") {
      q("[data-status]").textContent = asset + " is not safety-cleared. Complete its inspection before issuing.";
      return;
    }
    if (!r.items.includes(unit.type)) {
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = Math.max(...s.loans.map((l) => l.num)) + 1;
    s.loans.push({ num, req, asset, who, due, back: false });
    logActivity("Equipment issued", asset + " · " + req + " · " + who + " · due " + due + " · slip L-" + num);
    s.editing = false;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  function restore(d) {
    if (
      !d ||
      d.version !== 1 ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l && getReq(l.req) && getAsset(l.asset) && Number.isInteger(l.num),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      loans: d.loans.map((l) => ({ ...l })),
      notes: d.notes.map((n) => ({ ...n })),
      safety: d.safety && typeof d.safety === "object" ? { ...original().safety, ...d.safety } : original().safety,
      activity: Array.isArray(d.activity) ? d.activity.slice(-100) : original().activity,
    };
    if (!s.safety) s.safety = original().safety;
    if (!s.activity) s.activity = original().activity;
    paint();
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();