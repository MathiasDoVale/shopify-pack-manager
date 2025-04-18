import { redirect } from "@remix-run/node";
import { useState } from "react";
import { Form, useActionData, Link } from "@remix-run/react";
import {
  Text,
  BlockStack,
  Button,
  Layout,
  Card,
  TextField,
} from "@shopify/polaris";
import db from "../db.server";


export const action = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const discountString = parseFloat(formData.get("discount") || "0");
  const productIdsString = formData.get("productIds");

  const discount = parseFloat(discountString);
  if (isNaN(discount) || discount <= 0 || discount > 100) {
    return Response.json(
      {
        error: "Discount must be a number between 1 and 100.",
        fields: { discount: true },
      },
      { status: 400 },
    );
  }
  
  if (!name || !discountString || !productIdsString) {
    return Response.json(
      {
        error: "All fields are required.",
        fields: {
          name: !name,
          discount: !discountString,
          productIds: !productIdsString,
        },
      },
      { status: 400 },
    );
  }

  const productIds = JSON.parse(productIdsString);

  const pack = await db.pack.create({
    data: { name, discount },
  });

  await db.relationPackProduct.createMany({
    data: productIds.map((productId) => ({
      packId: pack.id,
      productId,
    })),
  });

  return redirect("/app");
};



export default function NewPack() {
  const actionData = useActionData();
  const [name, setName] = useState("");
  const [discount, setDiscount] = useState("");
  const [productIds, setProductIds] = useState("[]");
  const [productsSelected, setProductsSelected] = useState([]);

  async function selectProduct(setProductIds, setProductsSelected) {
    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: true,
    });
  
    if (products) {
      const ids = products.map((product) => product.id);
      setProductIds(JSON.stringify(ids));
      setProductsSelected(products);
    }
  }

  return (
    // Contenedor principal centrado
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      width: "100%" 
    }}>
      <Layout>
        <Layout.Section>
          <div style={{ width: "500px" }}>
            {/* Botón Back en la parte superior */}
            <div style={{ marginBottom: "16px" }}>
              <Link to="/app">
                <Button>← Back</Button>
              </Link>
            </div>
            
            <Card sectioned>
              <Text variant="headingXl" as="h4" alignment="center">
                Create pack
              </Text>
              {actionData?.error && (
                <Text as="p" tone="critical" data-testid="text-critical">
                  {actionData?.error}
                </Text>
              )}
              <Form method="post">
                <input type="hidden" name="productIds" value={productIds} />

                <BlockStack gap="500">
                  <TextField
                    label="Name"
                    name="name"
                    value={name}
                    onChange={(value) => setName(value)}
                    placeholder="Name"
                    autoComplete="off"
                  />
                  <TextField
                    label="Discount (%)"
                    type="number"
                    name="discount"
                    value={discount}
                    onChange={(value) => setDiscount(value)}
                    placeholder="Discount %"
                  />
                  <Button
                    id="select-product"
                    onClick={() =>
                      selectProduct(setProductIds, setProductsSelected)
                    }
                  >
                    Select product
                  </Button>

                  {productsSelected.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                        marginTop: "10px",
                        justifyContent: "center"
                      }}
                    >
                      {productsSelected.map((product, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            border: "1px solid #ccc",
                            padding: "10px",
                            borderRadius: "8px",
                            width: "120px",
                          }}
                        >
                          <img
                            src={
                              product.images[0]?.originalSrc ||
                              "https://via.placeholder.com/100"
                            }
                            alt={product.title}
                            style={{
                              width: "80px",
                              height: "80px",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                          />
                          <p
                            style={{
                              fontSize: "14px",
                              textAlign: "center",
                              marginTop: "5px",
                            }}
                          >
                            {product.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </BlockStack>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "center", 
                  marginTop: "20px" 
                }}>
                  <Button submit>Save</Button>
                </div>
              </Form>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </div>
  );
}