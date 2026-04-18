const STORAGE_KEYS = {
  chores: "mela-mahdi-chores:v1:rules",
  statuses: "mela-mahdi-chores:v1:statuses",
};

const USER_META = {
  Mela: {
    accentClass: "pill-mela",
  },
  Mahdi: {
    accentClass: "pill-mahdi",
  },
};

const DEFAULT_CHORES = [
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
  titleInput: document.getElementById("titleInput"),
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

bindEvents();
initialize();

function initialize() {
  refs.startDateInput.value = state.todayKey;
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
  refs.jumpTodayBtn.addEventListener("click", () => {
    state.selectedDateKey = state.todayKey;
    state.calendarMonth = startOfMonth(keyToDate(state.todayKey));
    renderApp();
  });

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
  const todayDate = keyToDate(state.todayKey);
  refs.todayPill.textContent = formatLongDate(todayDate);
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
  const todayTasks = getTasksForDate(state.todayKey);
  const melaTasks = todayTasks.filter((task) => task.assignedTo === "Mela");
  const mahdiTasks = todayTasks.filter((task) => task.assignedTo === "Mahdi");
  const doneCount = todayTasks.filter((task) => task.status.done).length;

  refs.heroTitle.textContent =
    doneCount === todayTasks.length && todayTasks.length > 0
      ? "Everything is already settled"
      : "Today's shared flow";
  refs.heroSubtitle.textContent =
    todayTasks.length === 0
      ? "No chores are scheduled today, so the page stays intentionally quiet."
      : `${doneCount} of ${todayTasks.length} chores are checked off so far.`;

  refs.summaryText.innerHTML = buildSummaryText(todayTasks, melaTasks, mahdiTasks);
  refs.melaDueCount.textContent = String(melaTasks.length);
  refs.mahdiDueCount.textContent = String(mahdiTasks.length);
  refs.doneCount.textContent = String(doneCount);
  refs.melaCountBadge.textContent = pluralize(melaTasks.length, "chore");
  refs.mahdiCountBadge.textContent = pluralize(mahdiTasks.length, "chore");

  renderTaskList(refs.melaTasks, melaTasks, "Mela");
  renderTaskList(refs.mahdiTasks, mahdiTasks, "Mahdi");
}

function renderCalendarView() {
  const monthDate = state.calendarMonth;
  refs.calendarMonthLabel.textContent = monthDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  renderCalendarGrid();

  const selectedDate = keyToDate(state.selectedDateKey);
  const selectedTasks = getTasksForDate(state.selectedDateKey);
  const melaTasks = selectedTasks.filter((task) => task.assignedTo === "Mela");
  const mahdiTasks = selectedTasks.filter((task) => task.assignedTo === "Mahdi");

  refs.selectedDateLabel.textContent = formatLongDate(selectedDate);
  refs.selectedDateSummary.textContent =
    selectedTasks.length === 0
      ? "Nothing is generated for this date."
      : `${selectedTasks.length} chore${selectedTasks.length === 1 ? "" : "s"} generated from your routine rules.`;
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
        `No chores are due here right now.`
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
  const commentTextarea = fragment.querySelector(".comment-textarea");

  article.dataset.taskKey = task.occurrenceKey;
  article.classList.toggle("is-done", task.status.done);
  checkbox.checked = task.status.done;
  checkbox.dataset.taskKey = task.occurrenceKey;
  title.textContent = task.title;
  meta.textContent = `${describeRule(task.rule)} - Started ${formatShortDate(
    keyToDate(task.rule.startDate)
  )}`;

  commentToggle.dataset.action = "toggle-comment";
  commentToggle.dataset.taskKey = task.occurrenceKey;
  commentToggle.textContent = task.status.comment ? "Edit comment" : "Add comment";

  skipButton.dataset.action = "quick-skip";
  skipButton.dataset.taskKey = task.occurrenceKey;
  skipButton.classList.toggle("is-hidden", task.status.done);

  const shouldShowComposer = state.openComposerKey === task.occurrenceKey;
  commentForm.classList.toggle("is-hidden", !shouldShowComposer);
  commentTextarea.value = task.status.comment || "";
  commentTextarea.name = "comment";
  commentForm.dataset.taskKey = task.occurrenceKey;
  commentForm
    .querySelector(".task-comment-cancel")
    .setAttribute("data-action", "close-comment");
  commentForm
    .querySelector(".task-comment-cancel")
    .setAttribute("data-task-key", task.occurrenceKey);

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

  const orderedRules = [...state.rules].sort((a, b) => {
    if (a.assignedTo !== b.assignedTo) {
      return a.assignedTo.localeCompare(b.assignedTo);
    }
    return a.title.localeCompare(b.title);
  });

  orderedRules.forEach((rule) => {
    const card = document.createElement("article");
    card.className = "routine-card";

    const left = document.createElement("div");
    const title = document.createElement("h4");
    title.textContent = rule.title;
    const meta = document.createElement("p");
    meta.textContent = `${describeRule(rule)} - Starts ${formatShortDate(
      keyToDate(rule.startDate)
    )}`;
    const row = document.createElement("div");
    row.className = "routine-meta";
    const pill = document.createElement("span");
    pill.className = `pill ${USER_META[rule.assignedTo].accentClass}`;
    pill.textContent = rule.assignedTo;
    row.appendChild(pill);
    left.append(title, meta, row);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.dataset.ruleId = rule.id;
    deleteButton.textContent = "Remove";

    card.append(left, deleteButton);
    refs.routineList.appendChild(card);
  });
}

function renderCalendarLabels() {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  refs.calendarLabels.textContent = "";
  labels.forEach((label) => {
    const span = document.createElement("span");
    span.textContent = label;
    refs.calendarLabels.appendChild(span);
  });
}

function renderCalendarGrid() {
  refs.calendarGrid.textContent = "";

  const monthStart = startOfMonth(state.calendarMonth);
  const firstCellDate = addDays(monthStart, -monthStart.getDay());

  for (let offset = 0; offset < 42; offset += 1) {
    const dayDate = addDays(firstCellDate, offset);
    const dayKey = dateToKey(dayDate);
    const tasks = getTasksForDate(dayKey);
    const melaCount = tasks.filter((task) => task.assignedTo === "Mela").length;
    const mahdiCount = tasks.filter((task) => task.assignedTo === "Mahdi").length;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.dataset.dateKey = dayKey;
    button.classList.toggle(
      "is-other-month",
      dayDate.getMonth() !== monthStart.getMonth()
    );
    button.classList.toggle("is-selected", dayKey === state.selectedDateKey);
    button.classList.toggle("is-today", dayKey === state.todayKey);

    const number = document.createElement("span");
    number.className = "calendar-day-number";
    number.textContent = String(dayDate.getDate());

    const markers = document.createElement("div");
    markers.className = "calendar-day-markers";

    for (let i = 0; i < Math.min(melaCount, 3); i += 1) {
      const marker = document.createElement("span");
      marker.className = "calendar-marker calendar-marker-mela";
      markers.appendChild(marker);
    }

    for (let i = 0; i < Math.min(mahdiCount, 3); i += 1) {
      const marker = document.createElement("span");
      marker.className = "calendar-marker calendar-marker-mahdi";
      markers.appendChild(marker);
    }

    const summary = document.createElement("span");
    summary.className = "task-meta";
    summary.textContent =
      tasks.length === 0 ? "No chores" : pluralize(tasks.length, "task");

    button.append(number, markers, summary);
    refs.calendarGrid.appendChild(button);
  }
}

function switchView(view) {
  state.currentView = view;
  renderViewState();
}

function handleFrequencyChange(event) {
  const showInterval = event.target.value === "interval";
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
    intervalDays:
      frequency === "interval" ? Number(formData.get("intervalDays")) : null,
  };

  if (!rule.title || !rule.startDate) {
    return;
  }

  state.rules = [...state.rules, rule];
  saveRules(state.rules);
  refs.choreForm.reset();
  refs.startDateInput.value = state.todayKey;
  refs.assignedInput.value = "Mela";
  refs.frequencyInput.value = "daily";
  refs.intervalField.classList.add("is-hidden");
  refs.intervalInput.required = false;
  state.openComposerKey = null;
  renderApp();
}

function handleTaskAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const { action, taskKey } = button.dataset;
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
  const current = state.statuses[taskKey] || {};
  updateTaskStatus(taskKey, {
    done: checkbox.checked,
    comment: current.comment || "",
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
    ...state.statuses[taskKey],
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
  saveRules(state.rules);
  purgeStatusesForRule(ruleId);
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

function updateTaskStatus(taskKey, partial) {
  state.statuses = {
    ...state.statuses,
    [taskKey]: {
      done: Boolean(partial.done),
      comment: partial.comment || "",
    },
  };
  saveStatuses(state.statuses);
  renderApp();
}

function purgeStatusesForRule(ruleId) {
  const nextStatuses = {};
  Object.entries(state.statuses).forEach(([key, value]) => {
    if (!key.startsWith(`${ruleId}__`)) {
      nextStatuses[key] = value;
    }
  });
  state.statuses = nextStatuses;
  saveStatuses(state.statuses);
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

function getTasksForDate(dateKey) {
  const targetDate = keyToDate(dateKey);
  return state.rules
    .filter((rule) => occursOnDate(rule, targetDate))
    .map((rule) => {
      const occurrenceKey = `${rule.id}__${dateKey}`;
      return {
        occurrenceKey,
        title: rule.title,
        assignedTo: rule.assignedTo,
        dateKey,
        rule,
        status: state.statuses[occurrenceKey] || { done: false, comment: "" },
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function occursOnDate(rule, targetDate) {
  const startDate = keyToDate(rule.startDate);
  if (targetDate < startDate) {
    return false;
  }

  const diffDays = differenceInDays(startDate, targetDate);
  switch (rule.frequency) {
    case "daily":
      return true;
    case "weekly":
      return diffDays % 7 === 0;
    case "interval":
      return diffDays % Math.max(1, Number(rule.intervalDays) || 1) === 0;
    case "monthly":
      return occursMonthly(startDate, targetDate);
    default:
      return false;
  }
}

function occursMonthly(startDate, targetDate) {
  const monthDelta =
    targetDate.getFullYear() * 12 +
    targetDate.getMonth() -
    (startDate.getFullYear() * 12 + startDate.getMonth());

  if (monthDelta < 0) {
    return false;
  }

  const lastDay = getDaysInMonth(targetDate.getFullYear(), targetDate.getMonth());
  const scheduledDay = Math.min(startDate.getDate(), lastDay);
  return targetDate.getDate() === scheduledDay;
}

function describeRule(rule) {
  switch (rule.frequency) {
    case "daily":
      return "Every day";
    case "weekly":
      return "Every week";
    case "interval":
      return `Every ${rule.intervalDays} days`;
    case "monthly":
      return "Every month";
    default:
      return "Custom";
  }
}

function buildSummaryText(todayTasks, melaTasks, mahdiTasks) {
  if (!todayTasks.length) {
    return "<strong>Breathe easy.</strong> The current rules do not generate anything for today.";
  }

  const openComments = todayTasks.filter((task) => task.status.comment).length;
  return [
    `<strong>${pluralize(todayTasks.length, "chore")}</strong> generated for today.`,
    `${pluralize(melaTasks.length, "chore")} sit with Mela, and ${pluralize(
      mahdiTasks.length,
      "chore"
    )} sit with Mahdi.`,
    openComments
      ? `${pluralize(openComments, "note")} already attached to today's flow.`
      : "No notes yet, so the board stays clean and airy.",
  ].join(" ");
}

function createEmptyState(title, body) {
  const card = document.createElement("article");
  card.className = "empty-state";
  card.innerHTML = `<strong>${title}</strong>${body}`;
  return card;
}

function loadRules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.chores);
    if (!raw) {
      saveRules(DEFAULT_CHORES);
      return DEFAULT_CHORES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed;
    }
    saveRules(DEFAULT_CHORES);
    return DEFAULT_CHORES;
  } catch (error) {
    return DEFAULT_CHORES;
  }
}

function loadStatuses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.statuses);
    if (!raw) {
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
  } catch (error) {
    console.warn("Unable to persist chore rules.", error);
  }
}

function saveStatuses(statuses) {
  try {
    localStorage.setItem(STORAGE_KEYS.statuses, JSON.stringify(statuses));
  } catch (error) {
    console.warn("Unable to persist chore statuses.", error);
  }
}

function createId() {
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
  const [year, month, day] = key.split("-").map(Number);
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
