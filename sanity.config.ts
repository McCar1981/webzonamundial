import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemas";
import { apiVersion, dataset, projectId } from "./src/sanity/env";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("ZonaMundial CMS")
          .items([
            S.listItem()
              .title("Noticias")
              .id("noticia")
              .child(
                S.documentList()
                  .title("Todas las noticias")
                  .filter('_type == "noticia"')
                  .defaultOrdering([{ field: "date", direction: "desc" }])
              ),
          ]),
    }),
  ],
  document: {
    productionUrl: async (prev, context) => {
      const { document } = context;
      if (document._type === "noticia") {
        const slug = (document as { slug?: { current?: string } }).slug
          ?.current;
        if (slug) {
          return `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/noticias/${slug}`;
        }
      }
      return prev;
    },
  },
});
