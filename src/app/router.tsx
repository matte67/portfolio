import { createBrowserRouter } from "react-router-dom";

import { SiteLayout } from "../presentation/layout/SiteLayout";
import { NotFoundPage } from "../presentation/pages/NotFoundPage";

const loadHomePage = async () => ({
  Component: (await import("../presentation/pages/HomePage")).HomePage,
});

const loadWorkPage = async () => ({
  Component: (await import("../presentation/pages/WorkPage")).WorkPage,
});

const loadProjectPage = async () => ({
  Component: (await import("../presentation/pages/ProjectPage")).ProjectPage,
});

const loadThesisPage = async () => ({
  Component: (await import("../presentation/pages/ThesisPage")).ThesisPage,
});

const loadAboutPage = async () => ({
  Component: (await import("../presentation/pages/AboutPage")).AboutPage,
});

const loadArticlesPage = async () => ({
  Component: (await import("../presentation/pages/ArticlesPage")).ArticlesPage,
});

const loadArticlePage = async () => ({
  Component: (await import("../presentation/pages/ArticlePage")).ArticlePage,
});

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SiteLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, lazy: loadHomePage },
      { path: "work", lazy: loadWorkPage },
      { path: "work/:slug", lazy: loadProjectPage },
      { path: "articles", lazy: loadArticlesPage },
      { path: "articles/:slug", lazy: loadArticlePage },
      { path: "thesis", lazy: loadThesisPage },
      { path: "about", lazy: loadAboutPage },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
