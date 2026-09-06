# The Rake multiplayer server — Back4app

The multiplayer backend is a Node.js WebSocket server in `server.js`.

## Deploy without a credit card

1. Create a free Back4app Containers account.
2. Create a new **Containers** app.
3. Connect GitHub and select `nezoko45-dev/the-rake-whispering-pines3`.
4. Use branch `main` and the repository root as the Docker root.
5. Back4app will detect the `Dockerfile` and build the server.
6. Wait for the deployment to become Ready.
7. Copy the generated `b4a.run` URL.

Back4app Containers supports WebSockets, so the multiplayer server can accept browser `wss://` connections.

## Important

The Vercel frontend must connect to the Back4app URL, not the Vercel URL. Once the Back4app URL exists, set the frontend multiplayer endpoint to:

`wss://YOUR-BACK4APP-URL`

Do not include `https://` in a WebSocket endpoint; use `wss://` for the HTTPS Back4app deployment.
