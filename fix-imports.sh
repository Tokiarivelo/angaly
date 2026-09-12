sed -i "s|import { PrismaService } from '@angaly/database';|import { PrismaService } from '../../../prisma/prisma.service';|" apps/api/src/orders/application/use-cases/create-order-from-cart.use-case.ts
sed -i "s|import { PrismaService } from '@angaly/database';|import { PrismaService } from '../../../prisma/prisma.service';|" apps/api/src/orders/infrastructure/repositories/prisma-order.repository.ts
sed -i "s|import { DatabaseModule } from '@angaly/database';|import { PrismaModule } from '../../prisma/prisma.module';|" apps/api/src/orders/orders.module.ts
sed -i "s|DatabaseModule|PrismaModule|" apps/api/src/orders/orders.module.ts
