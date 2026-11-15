
import { auth } from "express-oauth2-jwt-bearer";
import type { Request, Response, NextFunction } from "express";
import User from "../models/user";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      auth0Id: string;
    }
  }
}

const audience = process.env.AUTH0_AUDIENCE;
const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL;

if (!audience || !issuerBaseURL) {
  throw new Error(
    "Missing AUTH0_AUDIENCE or AUTH0_ISSUER_BASE_URL in backend .env"
  );
}

export const jwtCheck = auth({
  audience,
  issuerBaseURL,
  tokenSigningAlg: "RS256",
});

export const jwtParse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // jwtCheck must run before jwtParse.
    // jwtCheck verifies the token and attaches its payload to req.auth.
    const auth0Id = req.auth?.payload.sub;

    if (typeof auth0Id !== "string") {
      return res.sendStatus(401);
    }

    const user = await User.findOne({ auth0Id });

    if (!user || !user._id) {
      return res.sendStatus(401);
    }

    req.auth0Id = auth0Id;
    req.userId = user._id.toString();

    return next();
  } catch (error) {
    console.error("JWT parsing error:", error);
    return res.sendStatus(401);
  }
};
