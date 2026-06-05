export function validateLicenseEnv() {
  if (!process.env.LICENSE_SERVER_URL) {
    throw new Error(
      "[ShopVPS] LICENSE_SERVER_URL is required.\n" +
      "Add it to your .env file:\n" +
      "LICENSE_SERVER_URL=https://license.yourdomain.com"
    );
  }
}
