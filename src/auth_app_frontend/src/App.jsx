import { useState, useEffect } from "react";
import {
  createActor,
  auth_app_backend,
} from "../../declarations/auth_app_backend";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";

function App() {
  const [greeting, setGreeting] = useState("");
  const [principal, setPrincipal] = useState("");
  const [showPrincipal, setShowPrincipal] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [actor, setActor] = useState(auth_app_backend);

  useEffect(() => {
    initAuthClient();
  }, []);

  async function initAuthClient() {
    const client = await AuthClient.create();
    setAuthClient(client);
    if (await client.isAuthenticated()) {
      await updateActorWithIdentity(client);
    }
  }

  async function updateActorWithIdentity(client) {
    const identity = client.getIdentity();
    const agent = new HttpAgent({ identity });

    if (process.env.DFX_NETWORK === "local") {
      await agent.fetchRootKey();
    }

    const newActor = createActor(process.env.CANISTER_ID_AUTH_APP_BACKEND, {
      agent,
    });
    setActor(newActor);
    setIsAuthenticated(true);
  }

  async function handleLogin() {
    if (!authClient) {
      await initAuthClient();
    }

    const identity_url = `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:8080`;
    console.log(`Logging in with identity URL: ${identity_url}`);

    await new Promise((resolve) =>
      authClient.login({
        identityProvider: identity_url,
        onSuccess: resolve,
      })
    );

    await updateActorWithIdentity(authClient);
  }

  async function handleLogout() {
    if (authClient) {
      await authClient.logout();
      setActor(auth_app_backend); // Reset to default unauthenticated identity
      setIsAuthenticated(false);
    }
  }

  async function handleWhoAmI(event) {
    event.preventDefault();

    try {
      const principal = await actor.whoami();
      setPrincipal(`Your principal is: ${principal.toText()}`);
    } catch (error) {
      console.error("Failed to fetch principal:", error);
      setPrincipal("Error retrieving principal");
    }

    setShowPrincipal(true);
    return false;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    const greeting = await actor.greet(name);
    setGreeting(greeting);
    return false;
  }

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />
      <form action="#" onSubmit={handleSubmit}>
        <label htmlFor="name">Enter your name: &nbsp;</label>
        <input id="name" alt="Name" type="text" />
        <button type="submit">Click Me!</button>
      </form>
      <section id="greeting" style={{ textAlign: "center" }}>
        {greeting}
      </section>
      <br />
      <center>
        {isAuthenticated ? (
          <button id="logout" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button id="login" onClick={handleLogin}>
            Login
          </button>
        )}
      </center>
      <br />
      <button id="whoami" onClick={handleWhoAmI}>
        Who Am I?
      </button>
      {showPrincipal && (
        <section className="response" style={{ textAlign: "center" }}>
          {principal}
        </section>
      )}
    </main>
  );
}

export default App;
