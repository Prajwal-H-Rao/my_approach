import { Server} from "socket.io";
import { saveTos3 } from "./aws_s3.js";
import { fetchDir, saveFile } from "./file_structure.js";
import TerminalManager from "./pty-terminal.js";

const terminalManager = TerminalManager();

export function initWs(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket) => {
    const host = socket.handshake.headers.host;
    console.log(`Host is ${host}`);
    const replID = host?.split(".")[0];

    if (!replID) {
      socket.disconnect();
      terminalManager.clear(socket.id);
      return;
    }

    socket.emit("loaded", { rootContent: await fetchDir("/workspace", "") });
    initHandlers(socket, replID);
  });
}

function initHandlers(socket, replID) {
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("fetchDir", async (dir, callback) => {
    const dirPath = `/workspace/${dir}`;
    const contents = await fetchDir(dirPath, dir);
    callback(contents);
  });

  socket.on("updateContent", async ({ path: filePath, content }) => {
    const fullPath = `/workspace/${filePath}`;
    await saveFile(fullPath, content);
    await saveTos3(`code/${replID}`, filePath, content);
  });

  socket.on("requestTerminal", async () => {
    terminalManager.createPty(socket.id, replID, (data, id) => {
      socket.emit("terminal", {
        data: Buffer.from(data, "utf-8"),
      });
    });
  });

  socket.on('TerminalData',async({data})=>{
    terminalManager.write(socket.id,data)
  })
}
