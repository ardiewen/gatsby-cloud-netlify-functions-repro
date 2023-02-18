/**
 * Option 1 as described here:
 * https://support.gatsbyjs.com/hc/en-us/articles/360054529274-Deploying-Netlify-Functions-from-Gatsby-Cloud
 */

const util = require("util");
const child_process = require("child_process");
const exec = util.promisify(child_process.exec);

exports.onPostBuild = async (gatsbyNodeHelpers) => {
  const { reporter } = gatsbyNodeHelpers;

  const reportOut = (report) => {
    const { stderr, stdout } = report;
    if (stderr) reporter.error(stderr);
    if (stdout) reporter.info(stdout);
  };

  // NOTE: the gatsby build process automatically copies /static/functions to /public/functions
  // If you use yarn, replace "npm install" with "yarn install"
  reportOut(await exec("cd ./public/functions && yarn install"));
};
