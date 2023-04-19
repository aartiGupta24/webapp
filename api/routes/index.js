import userRouter from "./user-router.js";
import productRouter from "./product-router.js";
import { client } from "../../util/statsd_client.js";

export default (app) => {
  app.get("/aarti", (req, res) => {
    res.status(200).send("Ok");
    client.increment("endpoint.health.http.get");
  });
  app.get("/healthz", (req, res) => {
    res.status(200).send("Ok");
    client.increment("endpoint.healthz.http.get");
  });
  app.use("/v1", userRouter);
  app.use("/v1", productRouter);
};
