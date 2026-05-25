import { ImageSourcePropType } from "react-native";

import { PaymentProvider } from "./types";

export const paymentQrImages: Record<PaymentProvider, ImageSourcePropType> = {
  esewa: require("../../assets/payments/esewa-qr.png"),
  khalti: require("../../assets/payments/khalti-qr.png")
};
