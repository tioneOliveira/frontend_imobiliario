import { execFileSync } from "node:child_process";
const image = process.argv[2] || process.env.FRONTEND_IMAGE;
if (!image)
  throw new Error(
    "Informe a imagem: npm run test:container -- image@sha256:...",
  );
/** @param {string[]} args */
const docker = (args) =>
  execFileSync("docker", args, { encoding: "utf8" }).trim();
const info = JSON.parse(docker(["image", "inspect", image]))[0];
if (
  !info.Config.User ||
  info.Config.User === "root" ||
  info.Config.User === "0"
)
  throw new Error("A imagem deve usar usuário não privilegiado.");
const name = "houseprice-frontend-test-" + Date.now();
try {
  docker([
    "run",
    "--detach",
    "--name",
    name,
    "--read-only",
    "--tmpfs",
    "/tmp",
    "--publish",
    "127.0.0.1::8080",
    image,
  ]);
  const deadline = Date.now() + 45000;
  let healthy = false;
  while (Date.now() < deadline) {
    const state = JSON.parse(docker(["inspect", name]))[0];
    if (state.State.Health?.Status === "healthy") {
      healthy = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!healthy) throw new Error("Healthcheck não ficou saudável.");
  const check =
    "const a=await fetch('http://127.0.0.1:8080/healthz');const b=await fetch('http://127.0.0.1:9464/metrics');const c=await fetch('http://127.0.0.1:8080/metrics');if(a.status!==200||b.status!==200||c.status!==404)process.exit(1);";
  docker(["exec", name, "node", "--input-type=module", "-e", check]);
  console.log(
    JSON.stringify({
      status: "passed",
      image_id: info.Id,
      user: info.Config.User,
      read_only: true,
      metrics_private: true,
    }),
  );
} finally {
  docker(["rm", "--force", name]);
}
