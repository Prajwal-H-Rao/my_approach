import { spawn } from "node-pty";
import os from "os";

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

export default function useTerminalManager() {
  const sessions = {};

  // Function to create a new pty session
  const createPty = (id, replID, onData) => {
    const term = spawn(shell, [], {
      cols: 100,
      rows: 30,
      name: "xterm-color",
      cwd: `/workspace`,
    });

    term.onData((data) => onData(data, term.pid));

    sessions[id] = { terminal: term, replID };

    term.onExit(() => {
      delete sessions[id];
    });

    return term;
  };

  //Function to write to a particular terminal
  const write = (terminalId, data) => {
    if (sessions[terminalId]) {
      sessions[terminalId].terminal.write(data);
    }
  };

  //Function to kill a specific terminal
  const clear = (terminalId) => {
    if (sessions[terminalId]) {
      sessions[terminalId].terminal.kill();
      delete sessions[terminalId];
    }
  };

  return { createPty, write, clear };
}
