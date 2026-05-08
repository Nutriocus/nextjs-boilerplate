// server.js — Point d'entrée pour Hostinger Node.js
// Hostinger cherche ce fichier à la racine du projet.
// Il délègue simplement au serveur standalone généré par Next.js.

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
// Hostinger injecte PORT automatiquement — fallback 3000 en local
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> NUTRIOCUS ready on http://${hostname}:${port}`);
      console.log(`> Environment: ${process.env.NODE_ENV || "development"}`);
    });
});
