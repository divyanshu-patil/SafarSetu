import { createApp } from "./app";
import { Engine } from "./engine";
import { createStore } from "./store";

const engine = new Engine(createStore());
const port = Number(process.env.PORT ?? 4000);
createApp(engine).listen(port, () => console.log(`SafarSetu API on :${port} (store: ${engine.store.kind})`));
setInterval(() => engine.tick().catch((e) => console.error("tick", e)), 1000);
