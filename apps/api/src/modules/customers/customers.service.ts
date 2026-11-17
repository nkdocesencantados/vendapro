import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './customer.dto';

const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class CustomersService {
  constructor(@InjectRepository(Customer) private repo: Repository<Customer>) {}

  private async list(storeId: string, opts: { id?: string; search?: string }) {
    const params: any[] = [storeId];
    let where = `c."storeId" = $1`;
    if (opts.id) { params.push(opts.id); where += ` AND c.id = $${params.length}`; }
    if (opts.search) {
      params.push(`%${opts.search.trim()}%`);
      const p = `$${params.length}`;
      where += ` AND (c.name ILIKE ${p} OR c.phone ILIKE ${p} OR c.email ILIKE ${p} OR c.document ILIKE ${p})`;
    }
    const rows = await this.repo.query(
      `SELECT c.id, c.name, c.phone, c.email, c.document, c.notes, c."createdAt",
        COUNT(s.id) FILTER (WHERE s.status = 'completed') AS purchases,
        COALESCE(SUM(s.total) FILTER (WHERE s.status = 'completed'), 0) AS "totalSpent",
        MAX(COALESCE(s."saleDate", s."createdAt")) FILTER (WHERE s.status = 'completed') AS "lastPurchase",
        COALESCE(SUM(s.total - COALESCE(s."paidAmount", 0)) FILTER (WHERE s.status = 'completed' AND s."paymentMethod" = 'fiado'), 0) AS balance
       FROM customers c
       LEFT JOIN sales s ON s."customerId" = c.id AND s."storeId"::text = c."storeId"::text
       WHERE ${where}
       GROUP BY c.id
       ORDER BY c.name ASC`,
      params,
    );
    return rows.map((r: any) => ({
      id: r.id, name: r.name, phone: r.phone, email: r.email, document: r.document, notes: r.notes,
      createdAt: r.createdAt,
      purchases: Number(r.purchases),
      totalSpent: Number(r.totalSpent),
      lastPurchase: r.lastPurchase ? new Date(r.lastPurchase).toISOString() : null,
      balance: Number(r.balance),
    }));
  }

  async findAll(storeId: string, search?: string, filter?: string) {
    const rows = await this.list(storeId, { search });
    if (filter === 'debt') return rows.filter((c) => c.balance > 0);
    if (filter === 'inactive') {
      // inativo = última compra (ou cadastro, se nunca comprou) há 30+ dias
      const limit = Date.now() - 30 * DAY;
      return rows.filter((c) => new Date(c.lastPurchase || c.createdAt).getTime() < limit);
    }
    return rows;
  }

  async findOne(id: string, storeId: string) {
    const [customer] = await this.list(storeId, { id });
    if (!customer) throw new NotFoundException('Cliente nao encontrado');
    const sales = await this.repo.query(
      `SELECT id, total, "paymentMethod", "saleDate", "createdAt", status, COALESCE("paidAmount", 0) AS "paidAmount", "dueDate"::text AS "dueDate"
       FROM sales WHERE "storeId" = $1 AND "customerId" = $2
       ORDER BY COALESCE("saleDate", "createdAt") DESC LIMIT 50`,
      [storeId, id],
    );
    return {
      ...customer,
      sales: sales.map((s: any) => ({ ...s, total: Number(s.total), paidAmount: Number(s.paidAmount) })),
    };
  }

  async create(data: CreateCustomerDto, storeId: string) {
    const saved = await this.repo.save(this.repo.create({ ...data, storeId }));
    return this.findOne(saved.id, storeId);
  }

  async update(id: string, data: UpdateCustomerDto, storeId: string) {
    await this.findOne(id, storeId);
    await this.repo.update({ id, storeId }, data);
    return this.findOne(id, storeId);
  }

  async remove(id: string, storeId: string) {
    const customer = await this.findOne(id, storeId);
    if (customer.balance > 0) throw new ConflictException('Cliente possui saldo em aberto (fiado) e nao pode ser excluido');
    await this.repo.delete({ id, storeId });
    return { message: 'Cliente removido com sucesso' };
  }
}
