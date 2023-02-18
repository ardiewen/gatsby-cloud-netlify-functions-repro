const mailchimp = require("@mailchimp/mailchimp_marketing")
const md5 = require("md5")

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER,
})

const parsePriceInt = price =>
  Math.round(parseFloat(price.replace(/\$|,/g, "")))

const getStoreCart = async sessionId =>
  await mailchimp.ecommerce.getStoreCart(
    process.env.MAILCHIMP_WOOCOMMERCE_STORE,
    sessionId
  )

const addStoreCart = async (sessionId, cart, currency, customer) => {
  const data = {
    id: sessionId,
    customer: {
      id: customer.id || md5(customer.email.toLowerCase()),
      email_address: customer.email,
      opt_in_status: true,
    },
    currency_code: currency,
    order_total: parsePriceInt(cart.total),
    tax_total: parsePriceInt(cart.totalTax),
    lines: cart.contents.nodes.map(item => ({
      id: item.key,
      product_id: item.product.node.id,
      product_variant_id:
        item.product.node.__typename === "SimpleProduct"
          ? item.product.node.id
          : item.product.node.__typename === "VariableProduct"
          ? item.variation.node.id
          : null,
      quantity: item.quantity,
      price: parsePriceInt(item.subtotal),
    })),
    checkout_url: `${process.env.GATSBY_SITE_URL}/checkout?session_id=${sessionId}`,
  }

  const res = await mailchimp.ecommerce.addStoreCart(
    process.env.MAILCHIMP_WOOCOMMERCE_STORE,
    data
  )

  return res
}

const updateStoreCart = async (sessionId, cart) =>
  await mailchimp.ecommerce.updateStoreCart(
    process.env.MAILCHIMP_WOOCOMMERCE_STORE,
    sessionId,
    {
      customer: {},
      currency_code: null,
      order_total: null,
      tax_total: null,
      lines: {
        // product_id: ,
        // product_variant_id: ,
        // quantity: ,
        // price: ,
      },
    }
  )

const deleteStoreCart = async sessionId =>
  await mailchimp.ecommerce.deleteStoreCart(
    process.env.MAILCHIMP_WOOCOMMERCE_STORE,
    sessionId
  )

const sendOrder = async (order, currency) =>
  await mailchimp.ecommerce.addStoreOrder(
    process.env.MAILCHIMP_WOOCOMMERCE_STORE,
    {
      id: order.id, // REQUIRED: the order id,
      customer: {
        id: order.customer.id, // REQUIRED: the customer id
        email_address: order.customer.email,
        // opt_in_status: true,
        first_name: order.customer.firstName,
        last_name: order.customer.lastName,
        company: order.billing.company,
        address: {
          address1: order.billing.address1,
          address2: order.billing.address2,
          city: order.billing.city,
          province: null, // Normalized version of the code
          province_code: order.billing.state,
          postal_code: order.billing.postcode,
          country: null, // Normalized version of the code
          country_code: order.billing.country,
        },
      },
      currency_code: currency, // REQUIRED
      order_total: parsePriceint(order.total), // REQUIRED
      lines: order.lineItems.nodes.reduce(
        (acc, curr) => [
          ...acc,
          {
            // id: // We don't use this as an identifier for line item
            product_id: curr.product.node.id,
            product_variant_id: curr.variation ? curr.variation.node.id : null,
            quantity: curr.quantity,
            price: parsePriceInt(curr.product.node.price),
            // discount: // not used
          },
        ],
        []
      ),
      // campaign_id: ,
      // landing_site: ,
      financial_status: "paid",
      fulfillment_status: "pending",
      // order_url: ,
      discount_total: parsePriceInt(order.discountTotal),
      tax_total: parsePriceInt(order.totalTax),
      shipping_total: parsePriceInt(order.shippingTotal),
      // tracking_code: ,
      processed_at_foreign: new Date(order.date).toISOString(),
      // cancelled_at_foreign: ,
      updated_at_foreign: new Date(order.modified).toISOString(),
      shipping_address: {
        name: `${order.shipping.firstName} ${order.shipping.lastName}`,
        company: order.shipping.company,
        address1: order.shipping.address1,
        address2: order.shipping.address2,
        city: order.shipping.city,
        province: null, // Normalized version of the code
        province_code: order.shipping.state,
        postal_code: order.shipping.postcode,
        country: null, // Normalized version of the code
        country_code: order.shipping.country,
        longitude: null,
        latitude: null,
        phone: order.shipping.phone,
      },
      billing_address: {
        name: `${order.billing.firstName} ${order.billing.lastName}`,
        company: order.billing.company,
        address1: order.billing.address1,
        address2: order.billing.address2,
        city: order.billing.city,
        province: null, // Normalized version of the code
        province_code: order.billing.state,
        postal_code: order.billing.postcode,
        country: null, // Normalized version of the code
        country_code: order.billing.country,
        longitude: null,
        latitude: null,
        phone: order.billing.phone,
      },
      // promos: [],
      // outreach: {},
      // tracking_number: ,
      // tracking_carrier: ,
      // tracking_url: ,
    }
  )

module.exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" }
  }

  const data = JSON.parse(event.body)
  console.log("Incoming data: ", data)

  switch (data.type) {
    case "get": {
      const res = await getStoreCart(data.sessionId)

      return {
        statusCode: 200,
        body: JSON.stringify(res),
      }
    }
    case "create": {
      try {
        const res = await addStoreCart(
          data.sessionId,
          data.cart,
          data.currency,
          data.customer
        )

        // Successful response will return the cart ID
        if (res.id) {
          return {
            statusCode: 200,
            body: JSON.stringify(res),
          }
        }
      } catch (err) {
        console.error(err)
        // Error response will return additional info
        return {
          statusCode: res.status,
          body: res.response.text,
        }
      }
    }
    case "delete": {
      const res = await deleteStoreCart(data.sessionId)

      return {
        statusCode: 200,
        body: JSON.stringify(res),
      }
    }
    case "send": {
      const res = await sendOrder(data.order, data.currency)

      return {
        statusCode: 200,
        body: JSON.stringify(res),
      }
    }
    default:
      return {
        statusCode: 404,
        body: `Error: Unhandled type: ${data.type}`,
      }
  }
}
