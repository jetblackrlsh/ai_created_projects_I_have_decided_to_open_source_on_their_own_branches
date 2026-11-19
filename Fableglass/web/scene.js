const get = id => document.getElementById(id);
const composer = get('composer');
const prompt = get('prompt');
const transcript = get('story');
const storageKey = 'fableglass-stories-v1';
let busy = false;
let ready = false;
let stopped = false;

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

const saved = load(storageKey);
const legacy = saved ? null : load('fableglass-session-v3');
const stories = Array.isArray(saved?.stories) ? saved.stories : Object.entries(legacy?.customScenarios || {})
  .filter(([, data]) => typeof data?.premise === 'string')
  .map(([id, setup]) => ({
    id, title: setup.title, premise: setup.premise, setup,
    turns: [], prior: Array.isArray(legacy.sessions?.[id]) ? legacy.sessions[id] : [],
  }));
let selected = stories.find(story => story.id === (saved?.selected ?? legacy?.selected))?.id ?? null;
const current = () => stories.find(story => story.id === selected);
const latest = () => current()?.turns.at(-1)?.world;

function notice(message = '') {
  get('notice').hidden = !message;
  get('notice').textContent = message;
}

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ selected, stories })); }
  catch { notice('Browser storage is full or unavailable. Recent changes will stay in this window.'); }
}

function entry(label, text, role = '') {
  const article = document.createElement('article');
  article.className = 'entry ' + role;
  const heading = document.createElement('div');
  heading.className = 'entry-label';
  heading.textContent = label;
  const prose = document.createElement('div');
  prose.className = 'entry-text';
  prose.textContent = text;
  article.append(heading, prose);
  return article;
}

function controls() {
  const started = Boolean(latest());
  get('send').disabled = busy || !ready || !prompt.value.trim();
  get('send').textContent = busy ? 'Writing…' : started ? 'Take turn' : 'Begin story';
  get('undo').hidden = !started;
  get('undo').disabled = busy || !current()?.turns.at(-2)?.world;
  get('view-memory').hidden = !started;
  get('view-memory').disabled = busy;
  get('replay').hidden = !current()?.turns.some(turn => turn.input);
  get('replay').disabled = busy || !ready;
  get('rename').hidden = !current();
  get('rename').disabled = busy;
  get('delete-story').hidden = !current();
  get('delete-story').disabled = busy;
  get('new-story').disabled = busy;
  get('stop').disabled = stopped || busy;
  for (const button of get('stories').children) button.disabled = busy;
}

function setComposer() {
  const started = Boolean(latest());
  prompt.maxLength = started ? 2700 : 4000;
  prompt.placeholder = started ? 'What do you do or say?' : 'Describe the opening in your own words. Where are you, who’s with you, and what’s happening?';
  prompt.setAttribute('aria-label', started ? 'Your action or dialogue' : 'Story opening');
}

function render() {
  const story = current();
  const world = latest();
  get('title').textContent = story?.title || 'Start a story';
  get('chapter').hidden = !world;
  get('chapter').textContent = world ? 'Chapter ' + world.chapter : '';
  get('location').hidden = !world?.place || world.place.toLowerCase() === story.title.toLowerCase();
  get('location').textContent = world?.place || '';

  get('stories').replaceChildren(...stories.map(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scene-tab';
    button.textContent = item.title;
    if (item.id === selected) button.setAttribute('aria-current', 'true');
    button.onclick = () => select(item.id);
    return button;
  }));
  transcript.replaceChildren();
  if (story?.prior.length) {
    const earlier = document.createElement('details');
    earlier.className = 'earlier';
    const summary = document.createElement('summary');
    summary.textContent = 'Transcript from the earlier version';
    earlier.append(summary);
    for (const turn of story.prior) earlier.append(entry(turn.name || 'You', turn.message, 'user'), entry('Narrator', turn.reply));
    transcript.append(earlier);
  }
  if (!world) {
    const opening = document.createElement('p');
    opening.className = 'opening';
    opening.textContent = story?.setup
      ? 'You can begin again from this premise. The earlier transcript is available above when there is one.'
      : 'Write a few lines to set the scene, or start with what your character sees or says.';
    transcript.append(opening);
  }
  const checkLabels = { success: 'Success', partial: 'Partial success', failure: 'Setback' };
  for (const turn of story?.turns || []) {
    if (turn.input) transcript.append(entry('You', turn.input, 'user'));
    const outcome = turn.check?.type === 'action' ? checkLabels[turn.check.outcome] : '';
    transcript.append(entry(outcome ? 'Narrator · ' + outcome : 'Narrator', turn.reply));
  }
  transcript.scrollTop = transcript.scrollHeight;
  setComposer();
  controls();
}

function select(id) {
  if (busy) return;
  selected = id;
  prompt.value = current()?.turns.length ? '' : current()?.premise || '';
  notice();
  render();
  persist();
  prompt.focus();
}

async function send(event) {
  event.preventDefault();
  const input = prompt.value.trim();
  if (!input || busy || !ready) return;
  const world = latest();
  let story = current();
  const start = !world;
  busy = true;
  notice();
  controls();
  if (!start) transcript.append(entry('You', input, 'user'));
  transcript.append(entry('Narrator', 'Writing the next turn…', 'pending'));
  transcript.scrollTop = transcript.scrollHeight;
  try {
    const result = await requestTurn(start ? { premise: input, setup: story?.setup } : { state: world, message: input });
    if (!story) {
      story = { id: crypto.randomUUID(), title: result.world.title, premise: input, prior: [], turns: [] };
      stories.unshift(story);
      selected = story.id;
    }
    if (start) story.premise = input;
    saveTurn(story, start ? '' : input, result);
    prompt.value = '';
    persist();
  } catch (error) {
    notice(error.message);
  } finally {
    busy = false;
    render();
    prompt.focus();
  }
}

async function requestTurn(payload) {
  const response = await fetch('/api/turn', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The model did not reply.');
  return result;
}

function saveTurn(story, input, result) {
  story.turns.push({ input, reply: result.reply, world: result.world, ...(result.check ? { check: result.check } : {}) });
  // Keep the whole transcript and a rolling set of undo points.
  const older = story.turns.at(-11);
  if (older) delete older.world;
}

get('replay').onclick = async () => {
  const original = current();
  if (!original || busy || !ready) return;
  const inputs = original.turns.map(turn => turn.input).filter(Boolean);
  const copy = {
    id: crypto.randomUUID(), title: original.title + ' (replay)', premise: original.premise,
    setup: original.setup, prior: [], turns: [],
  };
  busy = true;
  controls();
  notice('Replaying your moves in a separate story…');
  try {
    let result = await requestTurn({ premise: copy.premise, setup: copy.setup });
    saveTurn(copy, '', result);
    for (const [index, message] of inputs.entries()) {
      notice('Replaying move ' + (index + 1) + ' of ' + inputs.length + '…');
      result = await requestTurn({ state: result.world, message });
      saveTurn(copy, message, result);
    }
    stories.unshift(copy);
    selected = copy.id;
    prompt.value = '';
    notice();
    persist();
  } catch (error) {
    notice(error.message);
  } finally {
    busy = false;
    render();
    prompt.focus();
  }
};

async function status() {
  if (stopped) return;
  const element = get('status');
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    ready = data.ready;
    element.textContent = ready ? 'CPU model ready' : data.error ? 'Model unavailable' : 'Starting CPU model';
    if (data.error) notice(data.error);
  } catch {
    ready = false;
    element.textContent = 'Model stopped';
  }
  element.classList.toggle('ready', ready);
  controls();
}

get('new-story').onclick = () => select(null);
get('undo').onclick = () => {
  const story = current();
  if (busy || !story?.turns.at(-2)?.world) return;
  const turn = story.turns.pop();
  prompt.value = turn.input;
  notice();
  render();
  persist();
  prompt.focus();
};
get('rename').onclick = () => {
  const story = current();
  if (!story || busy) return;
  const title = window.prompt('Story title', story.title)?.trim().slice(0, 60);
  if (!title) return;
  story.title = title;
  render();
  persist();
};
const deleteDialog = get('confirm-delete');
let deletionId;
get('delete-story').onclick = () => {
  const story = current();
  if (!story || busy) return;
  deletionId = story.id;
  deleteDialog.returnValue = '';
  get('delete-description').textContent = 'Delete “' + story.title + '” and its saved transcript from this browser?';
  deleteDialog.showModal();
};
deleteDialog.onclose = () => {
  if (deleteDialog.returnValue !== 'delete' || !deletionId) return;
  const index = stories.findIndex(story => story.id === deletionId);
  if (index === -1) return;
  stories.splice(index, 1);
  select(stories[Math.min(index, stories.length - 1)]?.id ?? null);
};
get('view-memory').onclick = () => {
  const world = latest();
  if (!world) return;
  const context = world.problem ? ['Current situation — ' + world.problem] : [];
  if (world.arena?.outcome) context.push(world.arena.outcome);
  if (world.goal) context.push('Opening goal — ' + world.goal);
  const inventory = world.items.filter(item => item.carried).map(item => item.name);
  if (inventory.length) context.push('Carrying — ' + inventory.join(', '));
  get('memory-summary').textContent = context.join('\n');
  get('memory-facts').replaceChildren(...world.facts.map(value => {
    const line = document.createElement('li');
    line.textContent = value;
    return line;
  }));
  get('memory').showModal();
};
get('close-memory').onclick = () => get('memory').close();
get('stop').onclick = async () => {
  stopped = true;
  ready = false;
  controls();
  await fetch('/api/stop', { method: 'POST' }).catch(() => {});
  get('status').classList.remove('ready');
  get('status').textContent = 'Model stopped';
  notice('Open Play Fableglass.exe to start again.');
};
composer.onsubmit = send;
prompt.oninput = controls;
prompt.onkeydown = event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    composer.requestSubmit();
  }
};
if (current() && !latest()) prompt.value = current().premise;
render();
if (!saved && legacy) persist();
await status();
setInterval(status, 2500);
