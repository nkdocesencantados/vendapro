import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/sale.entity';
import { FinancialService } from '../financial/financial.service';
import { EntryType, EntryCategory } from '../financial/financial-entry.entity';
import { PaymentDto } from './payment.dto';

const today = (offsetDays = 0) => {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('sv-SE'); // YYYY-MM-DD no fuso do servidor
};

@Injectable()
export class ReceivablesService {
  constructor(
    @InjectRepository(Sale) private saleRepo: Repository<Sale>,
    private financial: FinancialService,
  ) {}

  private async list(storeId: string, saleId?: string) {
    const params: any[] = [storeId];
    if (saleId) params.push(saleId);
    const rows = await this.saleRepo.query(
      `SELECT s.id AS "saleId", s."customerId", COALESCE(c.name, s."customerName") AS "customerName", c.phone AS "customerPhone",
        s.total, COALESCE(s."paidAmount", 0) AS "paidAmount", COALESCE(s."saleDate", s."createdAt") AS "saleDate", s."dueDate"::text AS "dueDate"
       FROM sales s
       LEFT JOIN customers c ON c.id = s."customerId" AND c."storeId"::text = s."storeId"::text
       WHERE s."storeId" = $1 AND s.status = 'completed' AND s."paymentMethod" = 'fiado' ${saleId ? 'AND s.id = $2' : ''}
       ORDER BY s."dueDate" ASC NULLS LAST, s."createdAt" ASC`,
      params,
    );
    const t = today();
    return rows.map((r: any) => {
      const total = Number(r.total);
      const paidAmount = Number(r.paidAmount);
      const balance = Math.round((total - paidAmount) * 100) / 100;
      const status = balance <= 0 ? 'paid' : r.dueDate && r.dueDate < t ? 'overdue' : 'open';
      return {
        saleId: r.saleId, customerId: r.customerId, customerName: r.customerName, customerPhone: r.customerPhone,
        total, paidAmount, balance, saleDate: r.saleDate, dueDate: r.dueDate, status,
      };
    });
  }

  // open = tudo com saldo (inclui vencidos); overdue/paid = status exato; all/vazio = tudo
  async findAll(storeId: string, status?: string) {
    const rows = await this.list(storeId);
    if (status === 'open') return rows.filter((r) => r.balance > 0);
    if (status === 'overdue' || status === 'paid') return rows.filter((r) => r.status === status);
    return rows;
  }

  async summary(storeId: string) {
    const rows = (await this.list(storeId)).filter((r) => r.balance > 0);
    const t = today(), week = today(7);
    const sum = (a: typeof rows) => Math.round(a.reduce((s, r) => s + r.balance, 0) * 100) / 100;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('sv-SE');
    const [received] = await this.saleRepo.query(
      `SELECT COALESCE(SUM(f.amount), 0) AS total
       FROM financial_entries f
       JOIN sales s ON s.id::text = f."referenceId" AND s."storeId"::text = f."storeId"::text
       WHERE f."storeId" = $1 AND s."paymentMethod" = 'fiado' AND f.type = 'income' AND f.date >= $2`,
      [storeId, monthStart],
    );
    return {
      open: sum(rows),
      overdue: sum(rows.filter((r) => r.status === 'overdue')),
      receivedThisMonth: Number(received.total),
      dueThisWeek: rows.filter((r) => r.dueDate && r.dueDate >= t && r.dueDate <= week).length,
    };
  }

  async addPayment(saleId: string, data: PaymentDto, storeId: string, userId: string) {
    const amount = Math.round(data.amount * 100) / 100;
    if (amount <= 0) throw new BadRequestException('Valor deve ser maior que zero');
    const [current] = await this.list(storeId, saleId);
    if (!current) throw new NotFoundException('Venda fiado nao encontrada');
    // update atômico: impede pagar além do total mesmo com requisições simultâneas
    // TypeORM/postgres devolve [rows, rowCount] para UPDATE
    const [updated] = await this.saleRepo.query(
      `UPDATE sales SET "paidAmount" = COALESCE("paidAmount", 0) + $1,
         "paidAt" = CASE WHEN COALESCE("paidAmount", 0) + $1 >= total THEN NOW() ELSE "paidAt" END,
         "updatedAt" = NOW()
       WHERE id = $2 AND "storeId" = $3 AND status = 'completed' AND "paymentMethod" = 'fiado'
         AND COALESCE("paidAmount", 0) + $1 <= total
       RETURNING id`,
      [amount, saleId, storeId],
    );
    if (!updated?.length) throw new BadRequestException(`Valor excede o saldo em aberto (R$ ${current.balance.toFixed(2)})`);
    await this.financial.create({
      type: EntryType.INCOME, category: EntryCategory.SALE,
      description: `Recebimento fiado #${saleId.slice(0, 8)} (${data.method})`,
      amount, date: new Date(), isPaid: true, referenceId: saleId, storeId, createdById: userId,
    });
    const [result] = await this.list(storeId, saleId);
    return result;
  }
}
