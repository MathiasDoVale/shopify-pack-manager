import { useLoaderData, useNavigate } from "@remix-run/react";
import { Page, Layout, Card, ResourceList, ResourceItem, Button, BlockStack, Text } from "@shopify/polaris";
import { getPacks } from "../models/Packs.server";

export const loader = async () => {
  const packs = await getPacks();
  return { packs };
};

export default function PacksList() {
  const { packs } = useLoaderData();
  const navigate = useNavigate();

  return (
    <Page title="Packs created" primaryAction={<Button primary onClick={() => navigate("/app/create")}>Create Pack</Button>}>
      <Layout>
        <Layout.Section>
          {packs.length === 0 ? (
            <Card sectioned>
              <BlockStack vertical>
                <p>There are no packs created yet.</p>
                <Button primary onClick={() => navigate("/app/create")}>Create Pack</Button>
              </BlockStack>
            </Card>
          ) : (
            <Card sectioned>
              <ResourceList
                resourceName={{ singular: "pack", plural: "packs" }}
                items={packs}
                renderItem={(pack) => (
                  <ResourceItem id={pack.id} url={`/app/packs/${pack.id}`} accessibilityLabel={`Ver ${pack.name}`}>
                    <Text variant="headingSm" as="h6">
                      {pack.name}
                    </Text>
                    <h3>Discount: {pack.discount}%</h3>
                    <p>{pack.products.length} products </p>
                  </ResourceItem>
                )}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
