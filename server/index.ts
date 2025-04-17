import express from "express";
import cors from "cors";
import initializeDatabase from "./db";
import OrganizationRoutes from "./routes/organizationRoutes";
import AccountRoutes from "./routes/accountRoutes";
import DealRoutes from "./routes/dealRoutes";

const app = express();
const port = process.env.PORT || 3000;

const db = initializeDatabase();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/organizations', OrganizationRoutes(db));
app.use('/accounts', AccountRoutes(db));
app.use('/deals', DealRoutes(db));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
