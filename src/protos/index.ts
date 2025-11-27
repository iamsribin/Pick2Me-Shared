import path from "path";
import { loadSync } from "@grpc/proto-loader";
import * as grpc from "@grpc/grpc-js";
import { fileURLToPath } from "url";

const PROTO_OPTIONS = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadPackage(protoFilename: string) {
  const protoPath = path.join(__dirname, protoFilename);
// function loadPackage(protoFilename: string) {
  // const protoPath = path.join(__dirname, protoFilename);
  const packageDef = loadSync(protoPath, PROTO_OPTIONS);
  return grpc.loadPackageDefinition(packageDef) as any;
}

export const userProto = loadPackage("user.proto").user_package;
export const driverProto = loadPackage("driver.proto").driver_package;
export const bookingProto = loadPackage("booking.proto").booking_package;
export const realtimeProto = loadPackage("realtime.proto").realtime_package;
export const paymentProto = loadPackage("payment.proto").payment_package;


export const userServiceDescriptor = userProto?.UserService?.service ?? null;
export const driverServiceDescriptor = driverProto?.DriverService?.service ?? null;
export const bookingDescriptor = bookingProto?.BookingService?.service ?? null;
export const realtimeServiceDescriptor = realtimeProto?.RealtimeService?.service ?? null;
export const paymentServiceDescriptor = paymentProto?.PaymentService.service ?? null; 