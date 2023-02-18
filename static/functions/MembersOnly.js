const PASSCODES = ["whitecroc", "WHITECROC"]

module.exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" }
  }

  // Parse the body contents into an object.
  const data = JSON.parse(event.body)
  console.log("Incoming Data: ", data)

  if (!data.passcode) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `Missing field: passcode` }),
    }
  }

  const hasPasscode =
    PASSCODES.findIndex(passcode => passcode === data.passcode) !== -1

  if (hasPasscode) {
    return {
      statusCode: 200,
      body: JSON.stringify({ result: "success" }),
    }
  } else
    return {
      statusCode: 400,
      body: JSON.stringify({
        result: "failure",
        error: {
          message: "Invalid Access Code. Please try again.",
        },
      }),
    }
}
