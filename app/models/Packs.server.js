import db from "../db.server";

export async function getPacks() {
  const packs = await db.pack.findMany({
    include: {
      products: true,
    },
  });
  return packs;
}

export async function getPack(id) {
  const pack = await db.pack.findUnique({
    where: { id },
    include: {
      products: true,
    },
  });
  return pack;
}

export async function getProductsFromGIDs(gids_list, graphql) {
  
  const response = await graphql(
    `#graphql
    query GetProducts($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          title
          images(first: 1) {
            nodes {
              altText
              url
            }
          }
          priceRange {
            minVariantPrice {
              amount
            }
          }
        }
      }
    }`,
    { variables: { ids: gids_list } }
  );
  
  const data = await response.json();
  return data.data;
}

export async function updatePack(id, name, discount) {
  const pack = await db.pack.update({ where: { id }, data: { name, discount } });
  return pack;
}

export async function deletePack(id) {
  await db.pack.delete({ where: { id } });
  return id;
}
