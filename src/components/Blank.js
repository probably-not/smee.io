import React from "react";
import Octicon, { Info } from "@primer/octicons-react";
import CodeExample from "./CodeExample";

export default function Blank() {
  return (
    <div className="container-md p-responsive">
      <div className="Box p-3 mt-4 mb-6">
        <div className="d-flex flex-items-center mb-2">
          <label htmlFor="url">Webhook Proxy URL</label>
          <span
            className="ml-2 tooltipped tooltipped-n text-gray-light"
            aria-label="Tell your service of choice to send webhook payloads to this URL."
          >
            <Octicon icon={Info} />
          </span>
        </div>
        <input
          type="text"
          id="url"
          autoFocus
          onFocus={(e) => e.target.select()}
          readOnly
          value={window.location.href}
          className="form-control input-xl input-block"
        />
        <p className="mt-2 text-gray-light f6">
          This page will automatically update as things happen.
        </p>

        <hr />
        <div className="mt-4 markdown-body">
          <h3>Use the CLI</h3>
          <pre>$ npm install --global smee-client</pre>
          <p>
            Then the <code>smee</code> command will forward webhooks from
            smee.io to your local development environment.
          </p>
          <pre>
            <code>$ smee -u {window.location.href}</code>
          </pre>

          <p>For usage info:</p>
          <pre>
            <code>$ smee --help</code>
          </pre>

          <h3 className="mt-3">Use the Node.js client</h3>
          <pre>$ npm install --save smee-client</pre>
          <p>Then:</p>
          <CodeExample />

          <h3 className="mt-3">Using Probot's built-in support</h3>
          <pre>$ npm install --save smee-client</pre>
          <p>Then set the environment variable:</p>
          <pre>WEBHOOK_PROXY_URL={window.location.href}</pre>
        </div>
      </div>
    </div>
  );
}
