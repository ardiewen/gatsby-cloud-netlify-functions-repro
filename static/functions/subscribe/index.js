const mailchimp = require("@mailchimp/mailchimp_marketing");
const md5 = require("md5");

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER,
});

async function addOrUpdateListMember(listId, email, mergeFields = {}) {
  const subscriberHash = md5(email.toLowerCase());

  const res = await mailchimp.lists.setListMember(listId, subscriberHash, {
    email_address: email.toLowerCase(),
    status_if_new: "subscribed",
    merge_fields: mergeFields,
  });

  return res;
}

async function updateListMemberTags(listId = "", email = "", tags = []) {
  const subscriberHash = md5(email.toLowerCase());

  const res = await mailchimp.lists.updateListMemberTags(
    listId,
    subscriberHash,
    {
      tags: tags.map((tag) => ({ name: tag, status: "active" })),
    }
  );

  return res;
}

module.exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const data = JSON.parse(event.body);
  console.log("Incoming data: ", data);

  if (!data.listId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Missing field: listId",
      }),
    };
  }

  if (!data.email) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Missing field: email",
      }),
    };
  }

  try {
    const res = await addOrUpdateListMember(
      data.listId,
      data.email,
      data.mergeFields
    );

    if (data.tags) {
      await updateListMemberTags(data.listId, data.email, data.tags);
    }

    if (res.id) {
      return {
        statusCode: 200,
        body: JSON.stringify(res),
      };
    }
  } catch (err) {
    console.log(err.message);

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Error: ${err.message}`,
      }),
    };
  }
};
