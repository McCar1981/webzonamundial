import { defineField, defineType } from "sanity";

export const noticiaSchema = defineType({
  name: "noticia",
  title: "Noticias",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (rule) => rule.required().min(5).max(120),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Resumen",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: "cat",
      title: "Categoría",
      type: "string",
      options: {
        list: [
          { title: "Análisis", value: "analisis" },
          { title: "Datos & Stats", value: "datos" },
          { title: "Historia", value: "historia" },
          { title: "Sedes", value: "sedes" },
          { title: "Selecciones", value: "selecciones" },
          { title: "Plataforma", value: "plataforma" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "date",
      title: "Fecha de publicación",
      type: "date",
      options: { dateFormat: "YYYY-MM-DD" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "readTime",
      title: "Tiempo de lectura (minutos)",
      type: "number",
      validation: (rule) => rule.required().min(1).max(60),
    }),
    defineField({
      name: "flags",
      title: "Banderas de países (código ISO 2)",
      description: "Ejemplo: es, ar, br, fr",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "featured",
      title: "¿Destacado?",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "mainImage",
      title: "Imagen principal (Sanity)",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Texto alternativo",
          type: "string",
        }),
        defineField({
          name: "caption",
          title: "Pie de foto",
          type: "string",
        }),
        defineField({
          name: "source",
          title: "Fuente de la imagen",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "externalImageUrl",
      title: "URL de imagen externa (alternativa)",
      description: "Solo si no usas imagen de Sanity",
      type: "url",
    }),
    defineField({
      name: "body",
      title: "Contenido del artículo",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "Cita", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Negrita", value: "strong" },
              { title: "Cursiva", value: "em" },
            ],
          },
        },
        {
          type: "image",
          options: { hotspot: true },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "cat",
      media: "mainImage",
    },
    prepare({ title, subtitle, media }) {
      const cats: Record<string, string> = {
        analisis: "Análisis",
        datos: "Datos & Stats",
        historia: "Historia",
        sedes: "Sedes",
        selecciones: "Selecciones",
        plataforma: "Plataforma",
      };
      return {
        title,
        subtitle: cats[subtitle] || subtitle,
        media,
      };
    },
  },
  orderings: [
    {
      title: "Fecha (más reciente)",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
});
