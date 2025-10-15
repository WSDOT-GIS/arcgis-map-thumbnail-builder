import { $ } from "bun";

await Promise.all([$`tsc`, $`vite build`]);
