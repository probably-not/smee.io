const sse = require("connect-sse")();
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const Raven = require("raven");
const cors = require("cors");
const bodyParser = require("body-parser");

const channelIsBanned = require("./channel-is-banned-middleware");
const EventBus = require("./event-bus");
const KeepAlive = require("./keep-alive");

// Tiny logger to prevent logs in tests
const log = process.env.NODE_ENV === "test" ? (_) => _ : console.log;

module.exports = (testRoute) => {
  const app = express();
  const mainRouter = express.Router();
  const hookRouter = express.Router();

  const pubFolder = path.join(__dirname, "..", "public");
  const bus = new EventBus();

  // Used for testing route error handling
  if (testRoute) testRoute(app);

  mainRouter.use(channelIsBanned);

  if (process.env.SENTRY_DSN) {
    Raven.config(process.env.SENTRY_DSN).install();
    mainRouter.use(Raven.requestHandler());
  }

  if (process.env.FORCE_HTTPS) {
    mainRouter.use(require("helmet")());
    mainRouter.use(require("express-sslify").HTTPS({ trustProtoHeader: true }));
  }

  mainRouter.use(cors());
  mainRouter.use(express.json());
  mainRouter.use(express.urlencoded({ extended: true }));
  mainRouter.use("/public", express.static(pubFolder));

  mainRouter.get("/", (req, res) => {
    res.sendFile(path.join(pubFolder, "index.html"));
  });

  mainRouter.get("/new", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.get("host");
    const channel = crypto
      .randomBytes(12)
      .toString("base64")
      .replace(/[+/=]+/g, "");

    res.redirect(307, `${protocol}://${host}/${channel}`);
  });

  mainRouter.get(
    "/:channel",
    (req, res, next) => {
      const { channel } = req.params;

      if (req.accepts("html")) {
        log(
          JSON.stringify({
            msg: "Client connected to web",
            channel: channel,
            listenerCount: bus.events.listenerCount(channel),
          })
        );
        res.sendFile(path.join(pubFolder, "webhooks.html"));
      } else {
        next();
      }
    },
    sse,
    (req, res) => {
      const { channel } = req.params;

      function send(data) {
        res.json(data);
        keepAlive.reset();
      }

      function close() {
        bus.events.removeListener(channel, send);
        keepAlive.stop();
        log(
          JSON.stringify({
            msg: "Client disconnected",
            channel: channel,
            listenerCount: bus.events.listenerCount(channel),
          })
        );
      }

      // Setup interval to ping every 30 seconds to keep the connection alive
      const keepAlive = new KeepAlive(() => res.json({}, "ping"), 30 * 1000);
      keepAlive.start();

      // Allow CORS
      res.setHeader("Access-Control-Allow-Origin", "*");

      // Listen for events on this channel
      bus.events.on(channel, send);

      // Clean up when the client disconnects
      res.on("close", close);

      res.json({}, "ready");

      log(
        JSON.stringify({
          msg: "Client connected to sse",
          channel: channel,
          listenerCount: bus.events.listenerCount(channel),
        })
      );
    }
  );

  app.use("/", mainRouter);

  hookRouter.use(bodyParser.raw({ type: "*/*" }));
  hookRouter.post("/:channel", async (req, res) => {
    log(
      JSON.stringify({
        msg: "webhook request received on channel",
        channel: req.params.channel,
        headers: req.headers,
        body: req.body,
      })
    );

    if (req.body.challenge && req.headers["user-agent"].includes("Slackbot")) {
      res.status(200).json({ challenge: req.body.challenge });
      return;
    }

    // Emit an event to the Redis bus
    await bus.emitEvent({
      channel: req.params.channel,
      payload: {
        ...req.headers,
        body: req.body,
        query: req.query,
        timestamp: Date.now(),
      },
    });

    res.status(200).end();
  });

  app.use("/", hookRouter);

  // Resend payload via the event emitter
  hookRouter.post("/:channel/redeliver", async (req, res) => {
    // Emit an event to the Redis bus
    await bus.emitEvent({
      channel: req.params.channel,
      payload: req.body,
    });
    res.status(200).end();
  });

  if (process.env.SENTRY_DSN) {
    mainRouter.use(Raven.errorHandler());
  }

  return app;
};
