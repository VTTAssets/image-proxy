/**
 * Loads environment variables from an .env file located in the ROOT of your project
 * An example .env is included as .env.example, which you can rename and adjust to your likings
 */
require("dotenv").config();

/**
 * The webserver deaing with your requests to it
 */
const express = require("express");
const app = express();
/**
 * You can configure your own CORS on it, too
 */
const cors = require("cors");

/**
 * Downloads the images for you
 */
const fetch = require("node-fetch");

/**
 * A custom HTTP error class for easier error handling.
 */
class HTTPResponseError extends Error {
  constructor(response, status = null, statusText = null, ...args) {
    status = status === null ? response.status : status;
    statusText = statusText === null ? response.statusText : statusText;

    super(`HTTP Error Response: ${status} ${statusText}`, ...args);
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

/**
 * Checks if the response yielded a valid image object from a list of
 * valid MIME-types, see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
 * @param {object} response Express response object
 * @returns
 */
const checkResponse = (response) => {
  if (response.ok) {
    const contentType = response.headers.get("content-type").toLowerCase();

    // A list of valid MIME-types.
    // Only results in this list will result in the forwarding of the expected result
    const VALID_CONTENT_TYPES = [
      "image/jpg",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];

    // If the response was successful and the resulting MINE-type is within the range
    // of valid content types configured above, we will deliver this image
    if (
      VALID_CONTENT_TYPES.find((type) => type === contentType) !== undefined
    ) {
      return response;
    } else {
      // That's a MIME-type we do not want to support, let's respond appropriately
      // => 415: Unsupported Media Type
      throw new HTTPResponseError(
        response,
        415,
        "Unsupported Media Type, expected " +
          VALID_CONTENT_TYPES.join(", ") +
          ", received " +
          contentType
      );
    }
  } else {
    throw new HTTPResponseError(response);
  }
};

/**
 * Checks if the request is authorized. It's strongly recommended to implement something here
 * In the original implementation, the request to the proxy includes a query parameter called
 * 'access_token', which is then validated: Is the access_token valid, does it belong to a user
 * and which user is it?
 *
 * You could use a simpler mechanism and use a static access_token that is known only to you.
 * The implementation here is up to you.
 * @param {object} req Express request object
 * @param {object} res Express response object
 * @param {object} next Proceeding or stopping the flow of the request
 * @returns
 */
const authorize = async (req, res, next) => {
  // by default, access is prohibited
  let isAuthorized = false;

  /**
   * Example implementation 1: Access Token
   * ========================================================
   */
  const { access_token } = req.query;
  if (access_token && access_token === "MY_SECRET_ACCESS_TOKEN") {
    isAuthorized = true;
  } else {
    isAuthorized = false;
  }
  /* ========================================================
   * Let's assume your proxy is avaiable on localhost:4001, you will need to
   * set the proxy vtta-core uses by setting the game setting accordingly.
   *
   * While connected to your Foundry server with a browser, open up the console (F12)
   * and run the following command:
   *
   * game.settings.set('vtta-core', 'proxy', 'http://localhost:4001/%URL%?access_token=MY_SECRET_ACCESS_TOKEN');
   *
   * ========================================================
   */

  /**
   * Example implementation 2: Super simple: Publicly open.
   * !! Uncomment to use, not recommended !!
   * ========================================================
   */

  // isAuthorized = true;

  /**
   * ========================================================
   */

  if (isAuthorized) {
    next();
  } else {
    res.status(401).send("Unauthorized image proxy access").end();
    next("Unauthorized image proxy access");
  }
};

/**
 * The actual download
 * The url you want to download is URL encoded and the first and only
 * parameter to that route.
 *
 * !IMPORTANT!
 * Change the authorize middleware to something you feel comfortable with OR restrict access to your proxy
 * by making the necessary networking adjustments (firewall, routing etc.). Per default, the proxy is publicly
 * usable.
 *
 * Middlewares
 * -------------------------------------
 * cors()    => CORS configuration. This is a blank config, meaning: No CORS requirements set whatsoever.
 *              Read up on how to configure CORS for yourself if you want to implement it
 * authorize => Checks if the request is authorized. The implementation of "How should this authorization
 *              look like?" is totally up to you. Edit the authorize function above to your liking.
 */

app.get("/:url", cors(), authorize, async (req, res) => {
  const url = decodeURIComponent(req.params.url);
  console.log("[PROXY] " + url);

  try {
    // do the actual request to the URL
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36",
      },
    });

    // check if the response yielded the expected result
    checkResponse(response);

    // forward the result to the request, ie. your Foundry server
    response.body.pipe(res);
  } catch (error) {
    // something went wrong. So many options...

    // custom errors
    if (error.status && error.statusText) {
      return res.status(error.status).send(error.statusText);
    }

    // regular http errors
    if (error.response.status && error.response.statusText) {
      return res.status(error.response.status).send(error.response.statusText);
    }
    // wtf is going on
    return res
      .status(500)
      .send("An error occurred while downloading your image.");
  }
});

/**
 * Start the webserver and let him listen to the port set in the environment .env file
 */
app.listen(process.env.PORT, () => {
  console.log(`DDB Image proxy started on :${process.env.PORT}`);
});
