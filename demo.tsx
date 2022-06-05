import * as React from "react";
import { createRoot } from "react-dom/client";
import {
  DataBrowserRouter,
  Form,
  Link,
  Outlet,
  redirect,
  Route,
  useLocation,
  useNavigation,
} from "react-router-dom";
import type { CallbackData } from "remix-use-spa-metrics";
import { useSpaMetrics } from "remix-use-spa-metrics";

createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <DataBrowserRouter fallbackElement={<p>Loading...</p>}>
      <Route path="/" element={<Root />}>
        <Route index loader={indexLoader} element={<Index />} />
        <Route
          path="page"
          loader={pageLoader}
          action={pageAction}
          element={<Page />}
        />
      </Route>
    </DataBrowserRouter>
  </React.StrictMode>
);

async function sleep() {
  await new Promise((r) => setTimeout(r, Math.round(Math.random() * 1000)));
}

async function indexLoader() {
  await sleep();
  return {};
}

function Index() {
  return <h2>Index Page</h2>;
}

async function pageLoader({ request }) {
  await sleep();
  let isRedirect = new URL(request.url).searchParams.get("redirect") === "1";
  if (isRedirect) {
    return redirect("/");
  }
  return {};
}

async function pageAction({ request }) {
  await sleep();
  let isRedirect = (await request.formData()).get("redirect") === "1";
  if (isRedirect) {
    return redirect("/");
  }
  return {};
}

function Page() {
  return <h2>Page</h2>;
}

function Root() {
  let location = useLocation();
  let navigation = useNavigation();
  let callback = React.useCallback((data: CallbackData) => {
    // Send data to your third-party service here
    console.log(data);
  }, []);

  useSpaMetrics(location, navigation, callback);

  return (
    <>
      <style>{`
      a, button {
        display: block;
        margin-bottom: 0.5rem;
      }
    `}</style>
      <h1>Root Layout</h1>
      <p>navigation.state: {navigation.state}</p>
      <Link to="/">Home (async loading navigation)</Link>
      <Link to="/page">Page (async loading navigation)</Link>
      <Link to="/page?redirect=1">Page (async redirect navigation)</Link>
      <Form method="post" action="page">
        <button type="submit">Submit (async submission navigation)</button>
      </Form>
      <Form method="post" action="page">
        <input type="hidden" name="redirect" value="1" />
        <button type="submit">Submit (async redirect navigation)</button>
      </Form>
      <Outlet />
    </>
  );
}
