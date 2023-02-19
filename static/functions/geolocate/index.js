const Reader = require("@maxmind/geoip2-node").Reader;
const path = require("path");

module.exports.handler = async (event, context) => {
  const rawIp = event.headers["x-forwarded-for"];

  const [clientIp, ...proxyIp] = rawIp.split(",");

  console.log("[Geolocate] Requested Client IP", clientIp);
  console.log("Lambda task root: ", process.env.LAMBDA_TASK_ROOT);
  const fileName = "./data/GeoLite2-Country.mmdb";
  const resolved = path.resolve(__dirname, fileName);
  console.log("Resolved", resolved);

  const reader = await Reader.open(resolved);

  if (clientIp === "::1" || clientIp === "::ffff:127.0.0.1") {
    console.log("[Geolocate] Warning: localhost request");

    const { country } = await reader.country("138.197.148.82");

    console.log(country);

    return {
      statusCode: 200,
      body: JSON.stringify({ country }),
    };
  }

  const { country } = await reader.country(clientIp);

  return {
    statusCode: 200,
    body: JSON.stringify({ country }),
  };
};
