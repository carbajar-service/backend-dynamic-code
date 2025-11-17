const authRouter = require("./auth");
const userRouter = require("./user");
const driverRouter = require("./driver");
const adminRouter = require("./admin");
const staffRouter = require("./staff");
const factoryRouter = require("./factory") 
const pdfRoutes = require("./pdfRoutes") 

const routes = (app) => {
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/driver", driverRouter);
  app.use("/admin", adminRouter);
  app.use("/staff", staffRouter);
  app.use("/factory", factoryRouter);
  app.use("/pdf", pdfRoutes);
};

module.exports = routes;
