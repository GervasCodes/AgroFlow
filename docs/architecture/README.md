Place system architecture notes and diagrams here.
Layers: Users -> Channels (App/Web/USSD/WhatsApp/Agent) -> API/Backend
(roles & permissions enforced here) -> Database (Postgres+PostGIS via
Prisma) -> Payments/AI (called only from the backend).
