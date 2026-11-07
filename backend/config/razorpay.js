
import Razorpay from "razorpay";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend/.env explicitly
const envPath = path.resolve(__dirname, "../.env");

const envResult = dotenv.config({
    path: envPath,
    override: true
});

if (envResult.error) {
    console.error("ENV FILE ERROR:", envResult.error.message);
}

const keyId = process.env.RAZORPAY_KEY_ID?.trim();
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

console.log("========== RAZORPAY CONFIG ==========");
console.log("ENV Path:", envPath);
console.log("Key Loaded:", Boolean(keyId));
console.log("Secret Loaded:", Boolean(keySecret));
console.log("Test Mode:", keyId?.startsWith("rzp_test_"));

const razorpay =
    keyId && keySecret
        ? new Razorpay({
              key_id: keyId,
              key_secret: keySecret
          })
        : null;

export { keyId };
export default razorpay;
