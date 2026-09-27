/** Fictional destinations for links demonstrated inside component previews. */
export const examplePages = {
  labs: {
    title: "Labs overview",
    text: "A sample workspace containing a chat example and a component catalog.",
  },
  chat: {
    title: "Chat box",
    text: "The sample conversation contains a proposed order change awaiting review.",
  },
  design: {
    title: "Design system",
    text: "The sample catalog groups components by their purpose.",
  },
  components: {
    title: "Components",
    text: "Navigation, forms, feedback and layout are sections of this sample catalog.",
  },
  navigation: {
    title: "Navigation",
    text: "Breadcrumbs show the hierarchy leading to the current page.",
  },
  breadcrumb: {
    title: "Breadcrumb",
    text: "The current location is text. Ancestors are links to their own pages.",
  },
  ordering: {
    title: "Ordering desk",
    text: "This sample workspace contains orders and suppliers for a fictional business.",
  },
  suppliers: {
    title: "Suppliers",
    text: "Nordwind Logistik and Northwind Textiles are fictional suppliers used in these examples.",
  },
  orders: {
    title: "12 open orders",
    text: "The sample count links to the corresponding order view. No real orders are connected.",
  },
  article: {
    title: "A sample article",
    text: "A button rendered as an anchor keeps link behavior: it can be followed, copied or opened in another tab.",
  },
  contract: {
    title: "Contract preview",
    text: "Fictional attachment: contract-2026.pdf. This example has no uploaded document or legal agreement.",
  },
} as const;
export type ExamplePage = keyof typeof examplePages;

export function exampleHref(page: ExamplePage, returnTo: string) {
  const query = new URLSearchParams({
    id: "examples-destinations--preview",
    viewMode: "story",
    args: `page:${page};returnTo:${returnTo}`,
  });
  return `./iframe.html?${query}`;
}
