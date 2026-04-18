const STORAGE_KEYS = {
  chores: "mela-mahdi-chores:v1:rules",
  statuses: "mela-mahdi-chores:v1:statuses",
};

const SYNC_CHANNEL_NAME = "mela-mahdi-chores:v1:sync";

const USER_META = {
  Mela: {
    accentClass: "pill-mela",
  },
  Mahdi: {
    accentClass: "pill-mahdi",
  },
};

const DEFAULT_RULES = [
  {
    id: "rule-dishes",
    title: "Tidy the kitchen after dinner",
    assignedTo: "Mahdi",
    startDate: "2026-04-17",
    frequency: "daily",
    intervalDays: null,
  },
  {
    id: "rule-laundry",
    title: "Laundry reset",
    assignedTo: "Mela",
    startDate: "2026-04-18",
    frequency: "weekly",
    intervalDays: null,
  },
  {
    id: "rule-plants",
    title: "Water the plants",
    assignedTo: "Mahdi",
    startDate: "2026-04-17",
    frequency: "interval",
    intervalDays: 3,
  },
  {
    id: "rule-bathroom",
    title: "Bathroom refresh",
    assignedTo: "Mela",
    startDate: "2026-04-20",
    frequency: "monthly",
    intervalDays: null,
  },
];

const syncChannel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel(SYNC_CHANNEL_NAME)
    : null;

const state = {
  rules: loadRules(),
  statuses: loadStatuses(),
  currentView: "today",
  todayKey: dateToKey(new Date()),
  selectedDateKey: dateToKey(new Date()),
  calendarMonth: startOfMonth(new Date()),
  openComposerKey: null,
};

const refs = {
  todayPill: document.getElementById("todayPill"),
  todayTab: document.getElementById("todayTab"),
  calendarTab: document.getElementById("calendarTab"),
  todayView: document.getElementById("todayView"),
  calendarView: document.getElementById("calendarView"),
  heroTitle: document.getElementById("heroTitle"),
  heroSubtitle: document.getElementById("heroSubtitle"),
  summaryText: document.getElementById("summaryText"),
  melaTasks: document.getElementById("melaTasks"),
  mahdiTasks: document.getElementById("mahdiTasks"),
  melaDueCount: document.getElementById("melaDueCount"),
  mahdiDueCount: document.getElementById("mahdiDueCount"),
  doneCount: document.getElementById("doneCount"),
  melaCountBadge: document.getElementById("melaCountBadge"),
  mahdiCountBadge: document.getElementById("mahdiCountBadge"),
  calendarMonthLabel: document.getElementById("calendarMonthLabel"),
  calendarLabels: document.getElementById("calendarLabels"),
  calendarGrid: document.getElementById("calendarGrid"),
  selectedDateLabel: document.getElementById("selectedDateLabel"),
  selectedDateSummary: document.getElementById("selectedDateSummary"),
  calendarMelaTasks: document.getElementById("calendarMelaTasks"),
  calendarMahdiTasks: document.getElementById("calendarMahdiTasks"),
  calendarMelaCount: document.getElementById("calendarMelaCount"),
  calendarMahdiCount: document.getElementById("calendarMahdiCount"),
  choreForm: document.getElementById("choreForm"),
  assignedInput: document.getElementById("assignedInput"),
  startDateInput: document.getElementById("startDateInput"),
  frequencyInput: document.getElementById("frequencyInput"),
  intervalField: document.getElementById("intervalField"),
  intervalInput: document.getElementById("intervalInput"),
  routineList: document.getElementById("routineList"),
  ruleCountBadge: document.getElementById("ruleCountBadge"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  jumpTodayBtn: document.getElementById("jumpTodayBtn"),
  taskCardTemplate: document.getElementById("taskCardTemplate"),
};

initialize();

function initialize() {
  bindEvents();
  refs.startDateInput.value = state.todayKey;
  updateFrequencyFieldVisibility(refs.frequencyInput.value);
  renderCalendarLabels();
  renderApp();
}

function bindEvents() {
  refs.todayTab.addEventListener("click", () => switchView("today"));
  refs.calendarTab.addEventListener("click", () => switchView("calendar"));
  refs.frequencyInput.addEventListener("change", handleFrequencyChange);
  refs.choreForm.addEventListener("submit", handleCreateRule);
  refs.prevMonthBtn.addEventListener("click", () => shiftCalendarMonth(-1));
  refs.nextMonthBtn.addEventListener("click", () => shiftCalendarMonth(1));
  refs.jumpTodayBtn.addEventListener("click", jumpToToday);

  refs.melaTasks.addEventListener("click", handleTaskAction);
  refs.mahdiTasks.addEventListener("click", handleTaskAction);
  refs.calendarMelaTasks.addEventListener("click", handleTaskAction);
  refs.calendarMahdiTasks.addEventListener("click", handleTaskAction);

  refs.melaTasks.addEventListener("change", handleTaskChange);
  refs.mahdiTasks.addEventListener("change", handleTaskChange);
  refs.calendarMelaTasks.addEventListener("change", handleTaskChange);
  refs.calendarMahdiTasks.addEventListener("change", handleTaskChange);

  refs.melaTasks.addEventListener("submit", handleCommentSubmit);
  refs.mahdiTasks.addEventListener("submit", handleCommentSubmit);
  refs.calendarMelaTasks.addEventListener("submit", handleCommentSubmit);
  refs.calendarMahdiTasks.addEventListener("submit", handleCommentSubmit);

  refs.routineList.addEventListener("click", handleRoutineDelete);
  refs.calendarGrid.addEventListener("click", handleCalendarClick);

  window.addEventListener("storage", handleStorageSync);

  if (syncChannel) {
    syncChannel.addEventListener("message", handleBroadcastSync);
  }
}

function renderApp() {
  state.todayKey = dateToKey(new Date());
  renderHeader();
  renderTodayView();
  renderCalendarView();
  renderRoutineList();
  renderViewState();
}

function renderHeader() {
  refs.todayPill.textContent = formatLongDate(keyToDate(state.todayKey));
}

function renderViewState() {
  const isToday = state.currentView === "today";
  refs.todayTab.classList.toggle("is-active", isToday);
  refs.todayTab.setAttribute("aria-selected", String(isToday));
  refs.calendarTab.classList.toggle("is-active", !isToday);
  refs.calendarTab.setAttribute("aria-selected", String(!isToday));
  refs.todayView.classList.toggle("is-hidden", !isToday);
  refs.calendarView.classList.toggle("is-hidden", isToday);
}

function renderTodayView() {
  const tasks = getTasksForDate(state.todayKey);
  const melaTasks = tasks.filter((task) => task.assignedTo === "Mela");
  const mahdiTasks = tasks.filter((task) => task.assignedTo === "Mahdi");
  const doneCount = tasks.filter((task) => task.status.done).length;

  refs.heroTitle.textContent =
    tasks.length > 0 && doneCount === tasks.length
      ? "Everything is already settled"
      : "Today's shared flow";

  refs.heroSubtitle.textContent =
    tasks.length === 0
      ? "No chores are scheduled today, so the page stays intentionally quiet."
      : `${doneCount} of ${tasks.length} chores are checked off so far.`;

  refs.summaryText.innerHTML = buildSummaryText(tasks, melaTasks, mahdiTasks);
  refs.melaDueCount.textContent = String(melaTasks.length);
  refs.mahdiDueCount.textContent = String(mahdiTasks.length);
  refs.doneCount.textContent = String(doneCount);
  refs.melaCountBadge.textContent = pluralize(melaTasks.length, "chore");
  refs.mahdiCountBadge.textContent = pluralize(mahdiTasks.length, "chore");

  renderTaskList(refs.melaTasks, melaTasks, "Mela");
  renderTaskList(refs.mahdiTasks, mahdiTasks, "Mahdi");
}

function renderCalendarView() {
  refs.calendarMonthLabel.textContent = state.calendarMonth.toLocaleDateString(
    undefined,
    {
      month: "long",
      year: "numeric",
    }
  );

  renderCalendarGrid();

  const selectedTasks = getTasksForDate(state.selectedDateKey);
  const melaTasks = selectedTasks.filter((task) => task.assignedTo === "Mela");
  const mahdiTasks = selectedTasks.filter((task) => task.assignedTo === "Mahdi");

  refs.selectedDateLabel.textContent = formatLongDate(keyToDate(state.selectedDateKey));
  refs.selectedDateSummary.textContent =
    selectedTasks.length === 0
      ? "Nothing is generated for this date."
      : `${pluralize(selectedTasks.length, "chore")} generated from your routine rules.`;
  refs.calendarMelaCount.textContent = String(melaTasks.length);
  refs.calendarMahdiCount.textContent = String(mahdiTasks.length);

  renderTaskList(refs.calendarMelaTasks, melaTasks, "Mela");
  renderTaskList(refs.calendarMahdiTasks, mahdiTasks, "Mahdi");
}

function renderTaskList(container, tasks, owner) {
  container.textContent = "";

  if (!tasks.length) {
    container.appendChild(
      createEmptyState(
        `${owner} has a lighter day`,
        "No chores are due here right now."
      )
    );
    return;
  }

  tasks.forEach((task) => {
    container.appendChild(createTaskCard(task));
  });
}

function createTaskCard(task) {
  const fragment = refs.taskCardTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".task-card");
  const checkbox = fragment.querySelector(".task-checkbox");
  const title = fragment.querySelector(".task-title");
  const meta = fragment.querySelector(".task-meta");
  const commentToggle = fragment.querySelector(".task-comment-toggle");
  const skipButton = fragment.querySelector(".task-skip-button");
  const preview = fragment.querySelector(".task-comment-preview");
  const commentForm = fragment.querySelector(".comment-form");
  const cancelButton = fragment.querySelector(".task-comment-cancel");
  const commentTextarea = fragment.querySelector(".comment-textarea");

  article.dataset.taskKey = task.occurrenceKey;
  article.classList.toggle("is-done", task.status.done);

  checkbox.checked = task.status.done;
  checkbox.dataset.taskKey = task.occurrenceKey;

  title.textContent = task.title;
  meta.textContent = `${describeRule(task.rule)} - Starts ${formatShortDate(
    keyToDate(task.rule.startDate)
  )}`;

  commentToggle.dataset.action = "toggle-comment";
  commentToggle.dataset.taskKey = task.occurrenceKey;
  commentToggle.textContent = task.status.comment ? "Edit comment" : "Add comment";

  skipButton.dataset.action = "quick-skip";
  skipButton.dataset.taskKey = task.occurrenceKey;
  skipButton.classList.toggle("is-hidden", task.status.done);

  commentForm.dataset.taskKey = task.occurrenceKey;
  commentForm.classList.toggle("is-hidden", state.openComposerKey !== task.occurrenceKey);
  commentTextarea.value = task.status.comment || "";

  cancelButton.dataset.action = "close-comment";
  cancelButton.dataset.taskKey = task.occurrenceKey;

  if (task.status.comment) {
    preview.classList.remove("is-hidden");
    preview.textContent = task.status.comment;
  }

  return fragment;
}

function renderRoutineList() {
  refs.ruleCountBadge.textContent = pluralize(state.rules.length, "rule");
  refs.routineList.textContent = "";

  if (!state.rules.length) {
    refs.routineList.appendChild(
      createEmptyState(
        "No routines yet",
        "Add a chore rule and the app will automatically generate each day's tasks."
      )
    );
    return;
  }

  const orderedRules = [...state.rules].sort((left, right) => {
    if (left.assignedTo !== right.assignedTo) {
      return left.assignedTo.localeCompare(right.assignedTo);
    }

    return left.title.localeCompare(right.title);
  });

  orderedRules.forEach((rule) => {
    const card = document.createElement("article");
    card.className = "routine-card";

    const left = document.createElement("div");
    const title = document.createElement("h4");
    const meta = document.createElement("p");
    const tags = document.createElement("div");
    const pill = document.createElement("span");
    const deleteButton = document.createElement("button");

    title.textContent = rule.title;
    meta.textContent = `${describeRule(rule)} - Starts ${formatShortDate(
      keyToDate(rule.startDate)
    )}`;

    tags.className = "routine-meta";
    pill.className = `pill ${USER_META[rule.assignedTo].accentClass}`;
    pill.textContent = rule.assignedTo;
    tags.appendChild(pill);

    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.dataset.ruleId = rule.id;
    deleteButton.textContent = "Remove";

    left.append(title, meta, tags);
    card.append(left, deleteButton);
    refs.routineList.appendChild(card);
  });
}

function renderCalendarLabels() {
  refs.calendarLabels.textContent = "";

  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((label) => {
    const cell = document.createElement("span");
    cell.textContent = label;
    refs.calendarLabels.appendChild(cell);
  });
}

function renderCalendarGrid() {
  refs.calendarGrid.textContent = "";

  const monthStart = startOfMonth(state.calendarMonth);
  const firstCellDate = addDays(monthStart, -monthStart.getDay());

  for (let index = 0; index < 42; index += 1) {
    const dayDate = addDays(firstCellDate, index);
    const dayKey = dateToKey(dayDate);
    const tasks = getTasksForDate(dayKey);
    const melaCount = tasks.filter((task) => task.assignedTo === "Mela").length;
    const mahdiCount = tasks.filter((task) => task.assignedTo === "Mahdi").length;

    const button = document.createElement("button");
    const number = document.createElement("span");
    const markers = document.createElement("div");
    const summary = document.createElement("span");

    button.type = "button";
    button.className = "calendar-day";
    button.dataset.dateKey = dayKey;
    button.classList.toggle("is-other-month", dayDate.getMonth() !== monthStart.getMonth());
    button.classList.toggle("is-selected", dayKey === state.selectedDateKey);
    button.classList.toggle("is-today", dayKey === state.todayKey);

    number.className = "calendar-day-number";
    number.textContent = String(dayDate.getDate());

    markers.className = "calendar-day-markers";
    appendCalendarMarkers(markers, "calendar-marker-mela", melaCount);
    appendCalendarMarkers(markers, "calendar-marker-mahdi", mahdiCount);

    summary.className = "task-meta";
    summary.textContent = tasks.length === 0 ? "No chores" : pluralize(tasks.length, "task");

    button.append(number, markers, summary);
    refs.calendarGrid.appendChild(button);
  }
}

function appendCalendarMarkers(container, className, count) {
  for (let index = 0; index < Math.min(count, 3); index += 1) {
    const marker = document.createElement("span");
    marker.className = `calendar-marker ${className}`;
    container.appendChild(marker);
  }
}

function switchView(view) {
  state.currentView = view;
  renderViewState();
}

function jumpToToday() {
  state.selectedDateKey = state.todayKey;
  state.calendarMonth = startOfMonth(keyToDate(state.todayKey));
  renderApp();
}

function handleFrequencyChange(event) {
  updateFrequencyFieldVisibility(event.target.value);
}

function updateFrequencyFieldVisibility(frequency) {
  const showInterval = frequency === "interval";
  refs.intervalField.classList.toggle("is-hidden", !showInterval);
  refs.intervalInput.required = showInterval;
}

function handleCreateRule(event) {
  event.preventDefault();

  const formData = new FormData(refs.choreForm);
  const frequency = String(formData.get("frequency"));
  const rule = {
    id: createId(),
    title: String(formData.get("title")).trim(),
    assignedTo: String(formData.get("assignedTo")),
    startDate: String(formData.get("startDate")),
    frequency,
    intervalDays: frequency === "interval" ? sanitizeInterval(formData.get("intervalDays")) : null,
  };

  if (!rule.title || !rule.startDate) {
    return;
  }

  state.rules = [...state.rules, rule];
  state.openComposerKey = null;
  saveRules(state.rules);

  refs.choreForm.reset();
  refs.assignedInput.value = "Mela";
  refs.startDateInput.value = state.todayKey;
  refs.frequencyInput.value = "daily";
  refs.intervalInput.value = "3";
  updateFrequencyFieldVisibility("daily");

  renderApp();
}

function handleTaskAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const { action, taskKey } = button.dataset;
  if (!taskKey) {
    return;
  }

  if (action === "toggle-comment") {
    state.openComposerKey = state.openComposerKey === taskKey ? null : taskKey;
    renderApp();
    return;
  }

  if (action === "close-comment") {
    state.openComposerKey = null;
    renderApp();
    return;
  }

  if (action === "quick-skip") {
    state.openComposerKey = null;
    updateTaskStatus(taskKey, {
      done: false,
      comment: "I couldn't do it",
    });
  }
}

function handleTaskChange(event) {
  const checkbox = event.target.closest(".task-checkbox");
  if (!checkbox) {
    return;
  }

  const taskKey = checkbox.dataset.taskKey;
  const currentStatus = state.statuses[taskKey] || { done: false, comment: "" };

  updateTaskStatus(taskKey, {
    done: checkbox.checked,
    comment: currentStatus.comment,
  });
}

function handleCommentSubmit(event) {
  const form = event.target.closest(".comment-form");
  if (!form) {
    return;
  }

  event.preventDefault();

  const taskKey = form.dataset.taskKey;
  const textarea = form.querySelector(".comment-textarea");

  state.openComposerKey = null;
  updateTaskStatus(taskKey, {
    ...(state.statuses[taskKey] || {}),
    comment: textarea.value.trim(),
  });
}

function handleRoutineDelete(event) {
  const button = event.target.closest("[data-rule-id]");
  if (!button) {
    return;
  }

  const ruleId = button.dataset.ruleId;
  const rule = state.rules.find((item) => item.id === ruleId);
  if (!rule) {
    return;
  }

  const confirmed = window.confirm(`Remove "${rule.title}"?`);
  if (!confirmed) {
    return;
  }

  state.rules = state.rules.filter((item) => item.id !== ruleId);
  purgeStatusesForRule(ruleId);
  saveRules(state.rules);
  renderApp();
}

function handleCalendarClick(event) {
  const button = event.target.closest(".calendar-day");
  if (!button) {
    return;
  }

  state.selectedDateKey = button.dataset.dateKey;
  renderApp();
}

function handleStorageSync(event) {
  if (event.key !== STORAGE_KEYS.chores && event.key !== STORAGE_KEYS.statuses) {
    return;
  }

  hydrateStateFromStorage();
}

function handleBroadcastSync(event) {
  const message = event.data;
  if (!message || (message.type !== "rules" && message.type !== "statuses")) {
    return;
  }

  hydrateStateFromStorage();
}

function hydrateStateFromStorage() {
  state.rules = loadRules();
  state.statuses = loadStatuses();

  if (state.openComposerKey && !taskExists(state.openComposerKey)) {
    state.openComposerKey = null;
  }

  renderApp();
}

function updateTaskStatus(taskKey, nextStatus) {
  state.statuses = {
    ...state.statuses,
    [taskKey]: {
      done: Boolean(nextStatus.done),
      comment: nextStatus.comment || "",
    },
  };

  saveStatuses(state.statuses);
  renderApp();
}

function purgeStatusesForRule(ruleId) {
  const nextStatuses = {};

  Object.entries(state.statuses).forEach(([taskKey, status]) => {
    if (!taskKey.startsWith(`${ruleId}__`)) {
      nextStatuses[taskKey] = status;
    }
  });

  state.statuses = nextStatuses;
  saveStatuses(state.statuses);
}

function getTasksForDate(dateKey) {
  const targetDate = keyToDate(dateKey);

  return state.rules
    .filter((rule) => occursOnDate(rule, targetDate))
    .map((rule) => {
      const occurrenceKey = `${rule.id}__${dateKey}`;
      return {
        occurrenceKey,
        assignedTo: rule.assignedTo,
        title: rule.title,
        rule,
        status: state.statuses[occurrenceKey] || { done: false, comment: "" },
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title));
}

function occursOnDate(rule, targetDate) {
  const startDate = keyToDate(rule.startDate);
  if (targetDate < startDate) {
    return false;
  }

  const diffDays = differenceInDays(startDate, targetDate);
  if (rule.frequency === "daily") {
    return true;
  }

  if (rule.frequency === "weekly") {
    return diffDays % 7 === 0;
  }

  if (rule.frequency === "interval") {
    return diffDays % sanitizeInterval(rule.intervalDays) === 0;
  }

  if (rule.frequency === "monthly") {
    return occursMonthly(startDate, targetDate);
  }

  return false;
}

function occursMonthly(startDate, targetDate) {
  const monthDelta =
    targetDate.getFullYear() * 12 +
    targetDate.getMonth() -
    (startDate.getFullYear() * 12 + startDate.getMonth());

  if (monthDelta < 0) {
    return false;
  }

  const dayOfMonth = Math.min(
    startDate.getDate(),
    getDaysInMonth(targetDate.getFullYear(), targetDate.getMonth())
  );

  return targetDate.getDate() === dayOfMonth;
}

function describeRule(rule) {
  if (rule.frequency === "daily") {
    return "Every day";
  }

  if (rule.frequency === "weekly") {
    return "Every week";
  }

  if (rule.frequency === "interval") {
    return `Every ${sanitizeInterval(rule.intervalDays)} days`;
  }

  if (rule.frequency === "monthly") {
    return "Every month";
  }

  return "Custom";
}

function buildSummaryText(tasks, melaTasks, mahdiTasks) {
  if (!tasks.length) {
    return "<strong>Breathe easy.</strong> The current rules do not generate anything for today.";
  }

  const notesCount = tasks.filter((task) => task.status.comment).length;
  return [
    `<strong>${pluralize(tasks.length, "chore")}</strong> generated for today.`,
    `${pluralize(melaTasks.length, "chore")} sit with Mela, and ${pluralize(
      mahdiTasks.length,
      "chore"
    )} sit with Mahdi.`,
    notesCount
      ? `${pluralize(notesCount, "note")} already attached to today's flow.`
      : "No notes yet, so the board stays clean and airy.",
  ].join(" ");
}

function taskExists(taskKey) {
  const [ruleId, dateKey] = String(taskKey).split("__");
  if (!ruleId || !dateKey) {
    return false;
  }

  const rule = state.rules.find((item) => item.id === ruleId);
  if (!rule) {
    return false;
  }

  return occursOnDate(rule, keyToDate(dateKey));
}

function createEmptyState(title, body) {
  const card = document.createElement("article");
  card.className = "empty-state";
  card.innerHTML = `<strong>${title}</strong>${body}`;
  return card;
}

function shiftCalendarMonth(direction) {
  state.calendarMonth = startOfMonth(
    new Date(
      state.calendarMonth.getFullYear(),
      state.calendarMonth.getMonth() + direction,
      1,
      12
    )
  );
  renderApp();
}

function loadRules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.chores);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEYS.chores, JSON.stringify(DEFAULT_RULES));
      return [...DEFAULT_RULES];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_RULES];
  } catch (error) {
    return [...DEFAULT_RULES];
  }
}

function loadStatuses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.statuses);
    if (raw === null) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function saveRules(rules) {
  try {
    localStorage.setItem(STORAGE_KEYS.chores, JSON.stringify(rules));
    broadcastSync("rules");
  } catch (error) {
    console.warn("Unable to persist chore rules.", error);
  }
}

function saveStatuses(statuses) {
  try {
    localStorage.setItem(STORAGE_KEYS.statuses, JSON.stringify(statuses));
    broadcastSync("statuses");
  } catch (error) {
    console.warn("Unable to persist chore statuses.", error);
  }
}

function broadcastSync(type) {
  if (!syncChannel) {
    return;
  }

  syncChannel.postMessage({
    type,
    sentAt: Date.now(),
  });
}

function sanitizeInterval(value) {
  return Math.max(1, Number(value) || 1);
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `rule-${crypto.randomUUID()}`;
  }

  return `rule-${Math.random().toString(36).slice(2, 10)}`;
}

function pluralize(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function dateToKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function keyToDate(key) {
  const [year, month, day] = String(key).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12);
}

function differenceInDays(startDate, endDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((stripTime(endDate) - stripTime(startDate)) / millisecondsPerDay);
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).getTime();
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatLongDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
