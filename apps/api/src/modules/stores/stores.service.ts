import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus } from './store.entity';

@Injectable()
export class StoresService {
  constructor(@InjectRepository(Store) private repo: Repository<Store>) {}

  async findAll() {
    return this.repo.query(`SELECT id, name, "primaryColor", phone, "monthlyGoal", plan FROM stores ORDER BY "createdAt" DESC`);
  }

  async findOne(id: string) {
    const r = await this.repo.query(
      `SELECT id, name, "primaryColor", phone, "monthlyGoal", address, COALESCE("profitMargin", 26.30) as "profitMargin", COALESCE(margin, 26.30) as margin, plan, COALESCE(status, 'trial') as status, "createdAt", COALESCE(palette, 'emerald') as palette, "pixKey", "pixKeyType", "pixMerchantName", "pixCity", "logoUrl", settings FROM stores WHERE id = $1`, [id]
    );
    if (!r || r.length === 0) throw new NotFoundException('Loja nao encontrada');
    const store = r[0];
    const TRIAL_DAYS = 7;
    const created = new Date(store.createdAt);
    const diffDays = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
    const trialDaysLeft = store.status === 'trial' ? Math.max(0, TRIAL_DAYS - diffDays) : null;
    const trialExpired  = store.status === 'trial' && diffDays >= TRIAL_DAYS;
    return { ...store, trialDaysLeft, trialExpired };
  }

  async create(data: Partial<Store>) {
    const paidPlans = ['business', 'pro', 'starter', 'basic'];
    const isPaid = data.plan && paidPlans.includes((data.plan as string).toLowerCase());
    const status: StoreStatus = isPaid ? StoreStatus.ACTIVE : StoreStatus.TRIAL;
    const store = this.repo.create({ ...data, status });
    return this.repo.save(store);
  }

  async update(id: string, data: any) {
    const pixTypes = ['cpf', 'cnpj', 'email', 'phone', 'random'];
    if (data.pixKeyType && !pixTypes.includes(data.pixKeyType)) throw new BadRequestException('pixKeyType invalido (cpf|cnpj|email|phone|random)');
    if (data.pixKey && String(data.pixKey).length > 140) throw new BadRequestException('pixKey muito longa (max 140)');
    if (data.pixMerchantName && String(data.pixMerchantName).trim().length > 25) throw new BadRequestException('pixMerchantName: maximo 25 caracteres');
    if (data.pixCity && String(data.pixCity).trim().length > 15) throw new BadRequestException('pixCity: maximo 15 caracteres');
    // cada bloco só roda se o campo veio no body, para permitir PATCH parcial (ex.: só PIX) sem apagar o resto
    if ('name' in data) await this.repo.query(
      `UPDATE stores SET name = $1, "primaryColor" = $2, "monthlyGoal" = $3, address = $4 WHERE id = $5`,
      [data.name, data.primaryColor || '#0F6E56', data.monthlyGoal || 0, data.address || null, id]
    );
    if ('margin' in data || 'profitMargin' in data) try { await this.repo.query(`UPDATE stores SET "profitMargin" = $1, margin = $2 WHERE id = $3`, [data.profitMargin || data.margin || 26.30, data.margin || data.profitMargin || 26.30, id]); } catch(e) {}
    if ('phone' in data || 'cnpj' in data) try { await this.repo.query(`UPDATE stores SET phone = $1, cnpj = $2 WHERE id = $3`, [data.phone || null, data.cnpj || null, id]); } catch(e) {}
    if ('hiddenModules' in data) {
      // abas que o lojista escolheu esconder do menu; dashboard e config nunca somem (senão não dá para reativar)
      const allowed = ['vendas', 'clientes', 'fiado', 'pix', 'estoque', 'caixa', 'recibos', 'relatórios', 'comissoes', 'equipe'];
      if (!Array.isArray(data.hiddenModules) || data.hiddenModules.some((m: any) => !allowed.includes(m))) throw new BadRequestException('hiddenModules invalido');
      await this.repo.query(
        `UPDATE stores SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object('hiddenModules', $1::jsonb) WHERE id = $2`,
        [JSON.stringify([...new Set(data.hiddenModules)]), id],
      );
    }
    if ('logoUrl' in data) {
      const logo = data.logoUrl ? String(data.logoUrl) : null;
      // só aceita imagem embutida (data URL) já reduzida no navegador; cabe no limite padrão de 100kb do body
      if (logo && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(logo) || logo.length > 90000)) throw new BadRequestException('Logo invalida: envie PNG, JPG ou WEBP pequeno');
      await this.repo.query(`UPDATE stores SET "logoUrl" = $1 WHERE id = $2`, [logo, id]);
    }
    if ('palette' in data) try { await this.repo.query(`UPDATE stores SET palette = $1 WHERE id = $2`, [data.palette || 'emerald', id]); } catch(e) {}
    const pixCols = ['pixKey', 'pixKeyType', 'pixMerchantName', 'pixCity'].filter((k) => k in data);
    if (pixCols.length) {
      await this.repo.query(
        `UPDATE stores SET ${pixCols.map((k, i) => `"${k}" = $${i + 1}`).join(', ')} WHERE id = $${pixCols.length + 1}`,
        [...pixCols.map((k) => (data[k] === '' || data[k] == null ? null : String(data[k]).trim())), id],
      );
    }
    return this.findOne(id);
  }
}
