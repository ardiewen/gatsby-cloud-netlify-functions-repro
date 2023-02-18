require("dotenv").config({ path: ".env.production" })

const mailchimp = require("@mailchimp/mailchimp_marketing")

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER,
})

async function getStores() {
  const res = await mailchimp.ecommerce.stores()

  console.log(JSON.stringify(res, null, 2))
}

async function addStore() {
  const res = await mailchimp.ecommerce.addStore({
    id: "production20210818",
    list_id: process.env.GATSBY_MAILCHIMP_LIST_ID,
    name: "Production Website",
    currency_code: "USD",
    platform: "",
    domain: "https://vieren.co",
  })

  console.log(res)
}

async function getAllStoreProducts() {
  const res = await mailchimp.ecommerce.getAllStoreProducts(
    process.env.MAILCHIMP_WOOCOMMERCE_STORE,
    {
      fields: ["products", "total_items"],
    }
  )

  console.log(JSON.stringify(res, null, 2))
}

async function getStoreCarts() {
  const res = await mailchimp.ecommerce.getStoreCarts(
    process.env.MAILCHIMP_WOOCOMMERCE_STORE
  )

  console.log(JSON.stringify(res, null, 2))
}

getStores()

// addStore()

// getAllStoreProducts()

// getStoreCarts()
