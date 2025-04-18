import {
  useLoaderData,
  useNavigate,
  Form,
  useActionData,
  useSubmit,
  redirect,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  ResourceList,
  ResourceItem,
  Button,
  TextField,
  BlockStack,
  Modal,
  Text,
  Thumbnail,
  Badge,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { useState, useMemo } from "react";
import invariant from "tiny-invariant";
import {
  getPack,
  getProductsFromGIDs,
  updatePack,
  deletePack,
} from "../models/Packs.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ params, request }) => {
  const { admin } = await authenticate.admin(request);
  const pack = await getPack(params.id);

  invariant(pack, "Pack doesn't exist");

  const productGids = pack.products.map((product) => product.productId);
  const productsData = await getProductsFromGIDs(productGids, admin.graphql);
  return { pack, products: productsData.nodes };
};

export const action = async ({ request, params }) => {
  invariant(params.id, "Pack id is required");
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "delete") {
    await deletePack(params.id);
    return redirect("/app");
  }

  const name = formData.get("name");
  const discountString = formData.get("discount");
  const discount = parseFloat(discountString);

  if (isNaN(discount) || discount <= 0 || discount > 100) {
    return Response.json(
      {
        error: isNaN(discount)
          ? "Discount must be a number."
          : discount <= 0
            ? "Discount must be greater than 0."
            : "Discount must be less than 100.",
        fields: { discount: true },
      },
      { status: 400 },
    );
  }

  if (!name || !discountString) {
    return Response.json(
      {
        error: "All fields are required.",
        fields: { name: !name, discount: !discountString },
      },
      { status: 400 },
    );
  }

  updatePack(params.id, name, discount);
  return Response.json({ success: "Pack succesfully updated." });
};

export default function PackDetail() {
  const { pack, products } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [name, setName] = useState(pack.name);
  const [discount, setDiscount] = useState( pack.discount >= 0 ? pack.discount.toString() : "0");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const actionData = useActionData();

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    submit(
      {
        intent: "delete",
      },
      { method: "post", action: `/app/packs/${pack.id}` },
    );
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const totalWithoutDiscount = useMemo(() => {
    return products.reduce(
      (total, product) =>
        total + parseFloat(product.priceRange.minVariantPrice.amount),
      0,
    );
  }, [products]);

  const totalWithDiscount = useMemo(() => {
    return totalWithoutDiscount - (totalWithoutDiscount * discount) / 100;
  }, [totalWithoutDiscount, discount]);

  const discountAmount = useMemo(() => {
    return (totalWithoutDiscount * parseFloat(discount)) / 100;
  }, [totalWithoutDiscount, discount]);

  return (
    <Page
      title={`Edit pack: ${pack.name}`}
      primaryAction={<Button onClick={() => navigate("/app")}>Go back</Button>}
      secondaryActions={[
        {
          content: "Delete Pack",
          onAction: handleDeleteClick,
          destructive: true,
          icon: DeleteIcon,
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <div style={{ width: "500px" }}>
            <Card sectioned>
              <Form method="post" data-testid="form">
                <BlockStack>
                  {actionData?.error && (
                    <Text as="p" tone="critical">
                      {actionData?.error}
                    </Text>
                  )}
                  {actionData?.success && (
                    <Text as="p" tone="success">
                      {actionData?.success}
                    </Text>
                  )}
                  <TextField
                    label="Name"
                    name="name"
                    value={name}
                    onChange={(value) => setName(value)}
                    autoComplete="off"
                  />
                  <TextField
                    label="Discount (%)"
                    type="number"
                    name="discount"
                    value={discount}
                    onChange={(value) => {
                      const numericValue = Number(value);
                      if (value === "" || (!isNaN(numericValue) && numericValue >= 0)) {
                        setDiscount(value);
                      }
                    }}
                  />
                  <br></br>
                  <Button submit>
                    Save changes
                  </Button>
                </BlockStack>
              </Form>
            </Card>
          </div>
        </Layout.Section>
        <Layout.Section>
          <Card title="Products in this pack" sectioned>
            {products.length > 0 ? (
              <ResourceList
                resourceName={{ singular: "product", plural: "products" }}
                items={products}
                renderItem={(product) => (
                  <ResourceItem
                    id={product.id}
                    key={product.id}
                    accessibilityLabel={`See ${product.title}`}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {product.images.nodes.length > 0 && (
                        <Thumbnail
                          source={product.images.nodes[0].url}
                          alt={product.images.nodes[0].altText}
                          size="small"
                        />
                      )}
                      <div style={{ marginLeft: "10px" }}>
                        <h3>{product.title}</h3>
                        <p>
                          Price: {product.priceRange.minVariantPrice.amount}
                        </p>
                      </div>
                    </div>
                  </ResourceItem>
                )}
              />
            ) : (
              <p>There aren't products on this pack.</p>
            )}
          </Card>
          <Card sectioned>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <Text variant="headingMd" fontWeight="bold">
                Order Summary
              </Text>

              <Badge size="large" tone="warning">
                <Text variant="bodyMd">
                  Total: <strong>{totalWithoutDiscount.toFixed(2)}€</strong>
                </Text>
              </Badge>

              <Badge size="large" tone="critical">
                <Text variant="bodyMd">
                  Discount: <strong>{discount}%</strong> (-
                  {discountAmount.toFixed(2)}€)
                </Text>
              </Badge>

              <Badge size="large" tone="success">
                <Text variant="bodyMd">
                  Total with discount:{" "}
                  <strong>{totalWithDiscount.toFixed(2)}€</strong>
                </Text>
              </Badge>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
      <Modal
        open={showDeleteModal}
        onClose={handleCancelDelete}
        title="Delete Pack"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleConfirmDelete,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCancelDelete,
          },
        ]}
      >
        <Modal.Section>
          <Text>¿Are you sure you want to delete this pack?</Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
