"use strict";

const grid = document.querySelector("#seed-grid");
const makeButton = document.querySelector("#make-button");
const wordsButton = document.querySelector("#words-button");
const storyButton = document.querySelector("#story-button");
const rerollButtons = document.querySelector("#reroll-buttons");
const buttonLabel = document.querySelector("#button-label");
const storyCard = document.querySelector("#story-card");
const storyTitle = document.querySelector("#story-title");
const storyPattern = document.querySelector("#story-pattern");
const announcement = document.querySelector("#announcement");
const loadError = document.querySelector("#load-error");
const tooltip = document.querySelector("#meaning-tooltip");
const meaningText = document.querySelector("#meaning-text");

let words = [];
let stories = [];
let categories = [];
let reels = [];
let cells = [];
let busy = false;
let started = false;
let openIndex = null;
let currentStory = null;

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createFinalWords() {
  const chance = Math.random();
  const rareCount = chance < 0.8 ? 0 : chance < 0.95 ? 1 : 2;
  const rareCategories = new Set(shuffled(categories).slice(0, rareCount));
  return shuffled(categories.map((category) => {
    const wantedRare = rareCategories.has(category);
    const pool = words.filter((item) => item.category === category && item.rare === wantedRare);
    return randomFrom(pool.length ? pool : words.filter((item) => item.category === category));
  }));
}

function chooseStory() {
  if (stories.length < 2) return stories[0];
  let next = randomFrom(stories);
  while (currentStory && next.id === currentStory.id) next = randomFrom(stories);
  return next;
}

function fitText(element, maxSize, minSize) {
  const parent = element.parentElement;
  if (!parent || parent.clientWidth === 0) return;
  const available = Math.max(24, parent.clientWidth - 14);
  const count = Math.max(1, Array.from(element.textContent || "").length);
  const size = Math.max(minSize, Math.min(maxSize, Math.floor((available - 2) / (count * 1.08))));
  element.style.fontSize = `${size}px`;
  element.style.transform = "scaleX(1)";
  element.style.width = "max-content";
  if (element.scrollWidth > available) element.style.transform = `scaleX(${(available - 2) / element.scrollWidth})`;
}

function fitAllText(scope = document) {
  scope.querySelectorAll(".word").forEach((el) => fitText(el, 34, 8));
  scope.querySelectorAll(".reading").forEach((el) => fitText(el, 16, 7));
}

function createWordFace(item, hidden = false) {
  const face = document.createElement("span");
  face.className = "reel-face";
  if (hidden) face.setAttribute("aria-hidden", "true");
  const wordLine = document.createElement("span");
  wordLine.className = "word-line";
  const word = document.createElement("span");
  word.className = "word";
  word.textContent = item.word;
  wordLine.append(word);
  const readingLine = document.createElement("span");
  readingLine.className = "reading-line";
  const reading = document.createElement("span");
  reading.className = "reading";
  reading.textContent = `（${item.reading}）`;
  readingLine.append(reading);
  face.append(wordLine, readingLine);
  return face;
}

function renderReel(index, moving = false, duration = 0) {
  const cell = cells[index];
  const reel = reels[index];
  cell.replaceChildren();
  cell.setAttribute("aria-label", `${reel.current.word}、${reel.current.reading}。意味を見る`);
  const reelWindow = document.createElement("span");
  reelWindow.className = "reel-window";
  const track = document.createElement("span");
  track.className = "reel-track";
  track.style.animationDuration = `${duration}ms`;
  track.append(createWordFace(reel.previous, true), createWordFace(reel.current));
  reelWindow.append(track);
  cell.append(reelWindow);
  requestAnimationFrame(() => {
    fitAllText(cell);
    if (moving) track.classList.add("is-moving");
  });
}

function updateReel(index, item, duration, moving = true) {
  reels[index] = { previous: reels[index].current, current: item };
  renderReel(index, moving, duration);
}

function placeTooltip(anchor) {
  const rect = anchor.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const left = Math.min(window.innerWidth - tooltipRect.width - 12, Math.max(12, rect.left + rect.width / 2 - tooltipRect.width / 2));
  const above = rect.top - tooltipRect.height - 10;
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${above >= 10 ? above : rect.bottom + 10}px`;
}

function showMeaning(index) {
  if (busy) return;
  openIndex = index;
  meaningText.textContent = reels[index].current.meaning;
  tooltip.hidden = false;
  placeTooltip(cells[index]);
}

function hideMeaning(index = null) {
  if (index !== null && openIndex !== index) return;
  openIndex = null;
  tooltip.hidden = true;
}

function createCells() {
  cells = reels.map((_, index) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "seed-cell";
    cell.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") showMeaning(index); });
    cell.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") hideMeaning(index); });
    cell.addEventListener("focus", () => requestAnimationFrame(() => { if (cell.matches(":focus-visible")) showMeaning(index); }));
    cell.addEventListener("blur", () => hideMeaning(index));
    cell.addEventListener("click", () => openIndex === index ? hideMeaning(index) : showMeaning(index));
    grid.append(cell);
    return cell;
  });
  reels.forEach((_, index) => renderReel(index));
}

function setBusy(value, message = "種を選んでいます…") {
  busy = value;
  grid.classList.toggle("is-spinning", value);
  grid.setAttribute("aria-busy", String(value));
  [makeButton, wordsButton, storyButton, ...cells].forEach((button) => { button.disabled = value; });
  if (!started) buttonLabel.textContent = value ? message : "物語の種をつくる";
}

function revealControls() {
  if (started) return;
  started = true;
  makeButton.hidden = true;
  rerollButtons.hidden = false;
}

async function spinWords() {
  const finalWords = createFinalWords();
  const startTime = performance.now();
  const stopTimes = finalWords.map((_, index) => 1200 + index * 95 + Math.random() * 180);
  await Promise.all(finalWords.map((finalWord, cellIndex) => new Promise((resolve) => {
    const spinCell = () => {
      const elapsed = performance.now() - startTime;
      const stopAt = stopTimes[cellIndex];
      if (elapsed >= stopAt) {
        const landing = 360;
        updateReel(cellIndex, finalWord, landing);
        window.setTimeout(() => { renderReel(cellIndex); resolve(); }, landing);
        return;
      }
      const delay = 90 + Math.pow(Math.min(1, elapsed / stopAt), 3) * 220;
      updateReel(cellIndex, randomFrom(words), delay);
      window.setTimeout(spinCell, delay);
    };
    window.setTimeout(spinCell, cellIndex * 35);
  })));
}

async function spinStory() {
  storyCard.classList.remove("is-empty");
  storyCard.classList.add("is-choosing");
  storyPattern.textContent = "物語を選んでいます…";
  const next = chooseStory();
  for (let i = 0; i < 9; i += 1) {
    storyTitle.textContent = `『${randomFrom(stories).title}』`;
    await new Promise((resolve) => window.setTimeout(resolve, 65 + i * 15));
  }
  currentStory = next;
  storyTitle.textContent = `『${next.title}』`;
  storyPattern.textContent = next.pattern;
  storyCard.classList.remove("is-choosing");
}

async function runSelection(mode) {
  if (busy) return;
  hideMeaning();
  setBusy(true, mode === "both" ? "種を選んでいます…" : "選んでいます…");
  announcement.textContent = "新しい種を選んでいます。";
  if (mode === "both") await Promise.all([spinWords(), spinStory()]);
  if (mode === "words") await spinWords();
  if (mode === "story") await spinStory();
  revealControls();
  setBusy(false);
  announcement.textContent = mode === "words" ? "新しい9つのことばが決まりました。" : mode === "story" ? "新しい物語が決まりました。" : "9つのことばと、もうひとつの種が決まりました。";
}

async function start() {
  try {
    const [wordResponse, storyResponse] = await Promise.all([fetch("words.json"), fetch("stories.json")]);
    if (!wordResponse.ok || !storyResponse.ok) throw new Error("data load failed");
    words = await wordResponse.json();
    stories = await storyResponse.json();
    categories = [...new Set(words.map((item) => item.category))];
    if (words.length !== 5000 || categories.length !== 9 || stories.length !== 104) throw new Error("data count mismatch");
    const initial = createFinalWords();
    reels = initial.map((item) => ({ previous: item, current: item }));
    createCells();
    setBusy(false);
    announcement.textContent = "準備ができました。";
  } catch (error) {
    console.error(error);
    grid.setAttribute("aria-busy", "false");
    loadError.hidden = false;
    buttonLabel.textContent = "読み込みに失敗しました";
  }
}

makeButton.addEventListener("click", () => runSelection("both"));
wordsButton.addEventListener("click", () => runSelection("words"));
storyButton.addEventListener("click", () => runSelection("story"));
window.addEventListener("resize", () => {
  fitAllText();
  if (openIndex !== null) placeTooltip(cells[openIndex]);
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") hideMeaning(); });
document.fonts?.ready.then(() => fitAllText());
start();
