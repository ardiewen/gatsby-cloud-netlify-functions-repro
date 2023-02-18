import { GatsbyNode } from "gatsby";

/**
 * Option 1 as described here:
 * https://support.gatsbyjs.com/hc/en-us/articles/360054529274-Deploying-Netlify-Functions-from-Gatsby-Cloud
 */

import util from "util";
import child_process from "child_process";
const exec = util.promisify(child_process.exec);

export const onPostBuild: GatsbyNode["onPostBuild"] = async (
  gatsbyNodeHelpers
) => {
  const { reporter } = gatsbyNodeHelpers;

  const reportOut = (report: any) => {
    const { stderr, stdout } = report;
    if (stderr) reporter.error(stderr);
    if (stdout) reporter.info(stdout);
  };

  // NOTE: the gatsby build process automatically copies /static/functions to /public/functions
  // If you use yarn, replace "npm install" with "yarn install"
  reportOut(await exec("cd ./public/functions && yarn install"));
};
