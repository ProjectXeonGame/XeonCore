class EventEmitter {
  constructor() {
    this._events = {};
  }
  ensureEvent(event) {
    if (this._events[event] == undefined) this._events[event] = [];
  }
  on(event, fn) {
    this.ensureEvent(event);
    this._events[event].push({ once: false, fn });
  }
  removeListener(event, fn) {
    this.ensureEvent(event);
    let events = this._events[event];
    let idx = events.findIndex((v) => v.fn.toString() == fn.toString());
    if (idx > -1) {
      events[idx] = null;
    }
  }
  removeAllListeners(event) {
    this.ensureEvent(event);
    this._events[event] = [];
  }
  once(event, fn) {
    this.ensureEvent(event);
    this._events[event].push({ once: true, fn });
  }
  emit(event, ...args) {
    this.ensureEvent(event);
    const onceEvents = [];
    this._events[event].forEach((ev, i) => {
      ev.fn(...args);
      if (ev.once) onceEvents.push(i);
    });
    for (const i of onceEvents) {
      this._events[event][i] = null;
    }
    this._events[event] = this._events[event].filter((ev) => ev != null);
  }
}

class Terminal extends EventEmitter {
  constructor(inputField, outputField, prompt, promptText = "> ") {
    super();
    this.input = document.getElementById(inputField);
    this.output = document.getElementById(outputField);
    this.promptResult = null;
    this.prompt = document.getElementById(prompt);
    this.promptText = promptText;
    this.isEnabled = true;
    this.waitingOn = null;
    this.history = [];
    this.historyIndex = -1;
    this.historyTemp = "";

    this.focus();

    window.addEventListener("click", (_ev) => {
      this.focus();
    });

    this.input.addEventListener("keydown", this.onKeyDown.bind(this));

    this.setPrompt();
  }
  addHistoryItem(item) {
    this.historyIndex = this.history.push(item);
  }
  moveHistoryIndex(dir) {
    this.historyIndex -= dir;
    if (this.historyIndex < 0) this.historyIndex = 0;
    else if (this.historyIndex > this.historyIndex.length - 1) {
      this.historyIndex = this.history.length;
    }
  }
  getNextHistory(dir) {
    this.moveHistoryIndex(dir);
    this.input.value = "";
    const nv = this.history[this.historyIndex];
    if (this.historyIndex == this.history.length) {
      this.input.value = this.historyTemp;
      this.historyTemp = "";
    } else if (nv != undefined) {
      this.input.value = nv;
    } else {
      this.input.value = "";
    }
  }
  enabled(state = true) {
    if (this.isEnabled == state) return;
    this.isEnabled = state;
    if (!state) {
      this.input.setAttribute("disabled", state.toString());
      this.tempPrompt("");
    } else {
      this.setPrompt();
      this.input.removeAttribute("disabled");
      this.focus();
    }
  }
  focus() {
    this.input.focus();
  }
  onKeyDown(ev) {
    if (!this.isEnabled) return;
    let inp = this.input;
    if (ev.key == "Enter") {
      let inptxt = inp.value;
      if (inptxt.length > 0) {
        inp.value = "";
        if (this.promptResult != null) this.promptResult(inptxt);
        else {
          this.addHistoryItem(inptxt);
          this.emit("input", inptxt);
        }
      }
      ev.preventDefault();
    } else if (ev.key == "ArrowUp" && !this.getPasswordState()) {
      if (this.historyIndex > 0) {
        if (this.historyIndex == this.history.length) {
          this.historyTemp = inp.value;
        }
        this.getNextHistory(1);
      }
      ev.preventDefault();
    } else if (ev.key == "ArrowDown" && !this.getPasswordState()) {
      if (this.historyIndex < this.history.length) {
        this.getNextHistory(-1);
      }
      ev.preventDefault();
    }
  }
  log(...args) {
    function toString(v) {
      switch (typeof v) {
        case "object":
          return JSON.stringify(v, null, 2);
          break;
        default:
          return v.toString();
          break;
      }
    }
    let t = args.map((v) => toString(v)).join(" ");
    let v = document.createElement("div");
    v.innerText = t;
    this.output.appendChild(v);
  }
  setPrompt(prompt) {
    this.promptText = prompt || this.promptText;
    this.prompt.innerText = this.promptText;
  }
  tempPrompt(prompt) {
    this.prompt.innerText = prompt;
  }
  setPassword(state) {
    if (state) this.input.setAttribute("type", "password");
    else this.input.setAttribute("type", "text");
  }
  getPasswordState() {
    return this.input.getAttribute("type") == "password";
  }
  async ask(question, password = false) {
    return await new Promise((resolve, reject) => {
      if (password) this.setPassword(true);
      this.tempPrompt(question);
      this.promptResult = (answer) => {
        this.setPrompt();
        if (password) this.setPassword(false);
        this.promptResult = null;
        resolve(answer);
      };
    });
  }
}

window.addEventListener("load", () => {
  let terminal = new Terminal(
    "terminal_input",
    "terminal_output",
    "terminal_input_prompt",
  );

  window.terminal = terminal;

  let ws = new WebSocket("wss://xeon.envis10n.dev/ws/");
  window.wsock = ws;
  ws.onopen = () => {
    terminal.log("Connected.");
  };
  ws.onclose = (ev) => {
    terminal.log("Connection lost. Code:", ev.code, "Reason:", ev.reason);
    ws = null;
  };
  ws.onmessage = (ev) => {
    try {
      let event = JSON.parse(ev.data);
      console.log(event);
      let ename = Object.keys(event.data)[0];
      let edata = event.data[ename];
      switch (ename) {
        case "Error":
          terminal.log(`${edata.code}:`, edata.message);
          break;
        case "Print":
          terminal.log(edata);
          break;
        case "Chat":
          const ts = new Date(event.timestamp).toLocaleTimeString();
          const user = edata.user;
          const channel = edata.channel;
          const body = edata.body;
          terminal.log(`[${ts}][Ch.${channel}] ${user}: ${body}`);
          break;
        default:
          terminal.log(`Unknown event "${ename}":`, edata);
          break;
      }
    } catch (e) {
      terminal.log(ev.data);
    }
  };
  ws.onerror = (ev) => {
    terminal.log("WebSocket error occurred.");
    console.log(ev);
  };

  function wevent(obj) {
    return JSON.stringify(Object.assign(obj, {
      timestamp: Date.now(),
    }));
  }

  terminal.on("input", (line) => {
    terminal.log(`${terminal.promptText}${line}`);
    if (line[0] == "/") {
      let cmd = line.substring(1).split(" ");
      switch (cmd[0]) {
        case "register":
          terminal.ask("Username: ").then((username) => {
            terminal.ask("Password: ", true).then((p1) => {
              terminal.ask("Re-enter Password: ", true).then((p2) => {
                if (p1 == p2) {
                  ws.send(wevent({
                    event: "REGISTER",
                    username,
                    password: p1,
                  }));
                }
              });
            });
          });
          if (cmd[1] != undefined && cmd[1].trim().length > 0) {
            terminal.promptResult(cmd[1].trim());
          }
          break;
        case "auth":
          terminal.ask("Username: ").then((username) => {
            terminal.ask("Password: ", true).then((password) => {
              ws.send(wevent({
                event: "AUTHENTICATE",
                username,
                password,
              }));
            });
          });
          if (cmd[1] != undefined && cmd[1].trim().length > 0) {
            terminal.promptResult(cmd[1].trim());
          }
          break;
        default:
          terminal.log("Unknown command:", cmd.join(" "));
          break;
      }
    } else {
      if (ws != null) {
        ws.send(wevent({
          event: "LINE",
          data: line,
        }));
      }
    }
  });
});
