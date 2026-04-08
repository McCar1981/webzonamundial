import { getClient } from "@/sanity/client";
import { NOTICIAS_QUERY } from "@/sanity/queries";
import { SanityNoticia, sanityNoticiaToPost, Post } from "@/sanity/types";
import NoticiasClient from "./NoticiasClient";

// Datos estáticos de respaldo (mientras no haya contenido en Sanity)
const STATIC_POSTS: Post[] = [
  {
    id: 100,
    title: "¡BOMBA! Rodrygo Goes se pierde el Mundial 2026",
    excerpt:
      "El delantero del Real Madrid sufrió una grave lesión jugando ante el Getafe. Rotura del menisco y del ligamento cruzado anterior de la rodilla derecha. Tendrá 8 meses de recuperación y se pierde el sueño de jugar con Brasil.",
    cat: "selecciones",
    date: "2026-03-02",
    readTime: 4,
    flags: ["br"],
    featured: true,
    realImage:
      "https://media.cnn.com/api/v1/images/stellar/prod/gettyimages-2264605162.jpg?q=w_1160,c_fill/f_webp",
    imageCaption: "Rodrygo Goes durante un partido con el Real Madrid",
    imageSource: "Getty Images vía CNN",
  },
  {
    id: 101,
    title: "Neymar podría volver a la Canarinha por la lesión de Rodrygo",
    excerpt:
      "La ausencia de Rodrygo abre una ventana para el regreso de Neymar. El astro del Santos viene de marcar un doblete en el Brasileirao y Ancelotti podría reconsiderar su convocatoria.",
    cat: "selecciones",
    date: "2026-03-04",
    readTime: 5,
    flags: ["br"],
    featured: true,
    realImage:
      "https://images.ctfassets.net/3mv54pzvptwz/7Jj4ryLGJazS8pDUlCK2Vg/10b71577e0270c8158d669b5fca17aa9/54331642772_05fa9ffe6b_o_dentro.jpg",
    imageCaption: "Neymar Jr. durante un partido con el Santos",
    imageSource: "FIFA via Getty Images",
  },
  {
    id: 102,
    title: "Zinedine Zidane será el DT de Francia después del Mundial 2026",
    excerpt:
      "El presidente de la Federación Francesa confirmó que ya tienen elegido al sucesor de Didier Deschamps. Zidane tomará las riendas tras la Copa del Mundo.",
    cat: "selecciones",
    date: "2026-03-23",
    readTime: 6,
    flags: ["fr"],
    featured: true,
    realImage:
      "https://blob.postadeportes.com/images/2026/03/23/zinedine-zidane-ya-tiene-fecha-para-dirigir-a-francia-97eaf274-focus-0.2-0.41-1479-828.webp",
    imageCaption: "Zinedine Zidane",
    imageSource: "Posta Deportes",
  },
  {
    id: 103,
    title: "Cristiano Ronaldo se recupera en Madrid: 'Mejorando cada día'",
    excerpt:
      "El astro portugués no pudo decir presente en los amistosos de marzo y se recupera en Madrid de su lesión. A sus 41 años, el Bicho busca llegar en forma al Mundial 2026.",
    cat: "selecciones",
    date: "2026-03-24",
    readTime: 5,
    flags: ["pt"],
    featured: false,
    realImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/800px-Cristiano_Ronaldo_2018.jpg",
    imageCaption: "Cristiano Ronaldo con Portugal en 2018",
    imageSource: "Wikimedia Commons",
  },
  {
    id: 104,
    title: "Messi jugará el Mundial 'en casa' en Estados Unidos",
    excerpt:
      "El crack argentino reside en Miami desde hace 3 años y jugará el Mundial en territorio norteamericano. Inter Miami no dará descanso a Leo previo al torneo.",
    cat: "selecciones",
    date: "2026-03-22",
    readTime: 4,
    flags: ["ar", "us"],
    featured: true,
    realImage: "https://media.elcomercio.com/wp-content/uploads/2025/12/lionel-messi-2-1024x683.jpg",
    imageCaption: "Lionel Messi con el Inter de Miami",
    imageSource: "El Comercio",
  },
  {
    id: 105,
    title: "Jordania hace historia: debutará en un Mundial",
    excerpt:
      "Los árabes llegan al Mundial 2026 en el mejor momento de su historia futbolística. Clasificaron por primera vez tras un proyecto que comenzó en 2002.",
    cat: "selecciones",
    date: "2026-03-25",
    readTime: 5,
    flags: ["jo", "ar"],
    featured: false,
    realImage:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Jordan_national_football_team.jpg/800px-Jordan_national_football_team.jpg",
    imageCaption: "Selección de Jordania",
    imageSource: "Wikimedia Commons",
  },
];

async function getPosts(): Promise<Post[]> {
  // Si no hay Project ID configurado, usa datos estáticos directamente
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === "tu-project-id") {
    return STATIC_POSTS;
  }

  try {
    const sanityPosts = await getClient().fetch<SanityNoticia[]>(NOTICIAS_QUERY);
    if (sanityPosts && sanityPosts.length > 0) {
      return sanityPosts.map(sanityNoticiaToPost);
    }
  } catch {
    // Si falla la conexión, cae al fallback
  }

  return STATIC_POSTS;
}

export const metadata = {
  title: "Blog & Noticias | ZonaMundial",
  description: "Análisis, datos, historia y guías para vivir la Copa del Mundo 2026 como un experto.",
};

// Revalidar cada 60 segundos para contenido semi-dinámico
export const revalidate = 60;

export default async function NoticiasPage() {
  const posts = await getPosts();
  return <NoticiasClient posts={posts} />;
}
