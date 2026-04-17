import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/cities
router.get("/cities", async (_req: Request, res: Response) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    res.json({ cities });
  } catch (error) {
    console.error("cities error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/fns?city_id=X
router.get("/fns", async (req: Request, res: Response) => {
  try {
    const cityId = req.query.city_id as string;

    if (!cityId) {
      res.status(400).json({ error: "city_id is required" });
      return;
    }

    const offices = await prisma.fnsOffice.findMany({
      where: { cityId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, cityId: true },
    });
    res.json({ offices });
  } catch (error) {
    console.error("fns error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/services
router.get("/services", async (_req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    res.json({ services });
  } catch (error) {
    console.error("services error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
