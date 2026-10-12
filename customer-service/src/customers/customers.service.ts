import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
  ) {}

  findAll(): Promise<Customer[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.repo.findOneBy({ id });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const exists = await this.repo.findOneBy({ email: dto.email });
    if (exists) throw new ConflictException(`Email ${dto.email} already exists`);
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    if (dto.email && dto.email !== customer.email) {
      const exists = await this.repo.findOneBy({ email: dto.email });
      if (exists) throw new ConflictException(`Email ${dto.email} already exists`);
    }
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async remove(id: number): Promise<void> {
    await this.repo.remove(await this.findOne(id));
  }

  /** Seed determinista: 5 clientes con IDs 1-5 (coherentes con order-service). */
  async seedIfEmpty(): Promise<void> {
    if ((await this.repo.count()) > 0) return;
    await this.repo.save([
      { id: 1, name: 'Ana Torres', email: 'ana.torres@example.com', phone: '+51 999 111 222' },
      { id: 2, name: 'Luis Paredes', email: 'luis.paredes@example.com', phone: '+51 999 333 444' },
      { id: 3, name: 'María Quispe', email: 'maria.quispe@example.com', phone: '+51 999 555 666' },
      { id: 4, name: 'Jorge Ramos', email: 'jorge.ramos@example.com', phone: '+51 999 777 888' },
      { id: 5, name: 'Sofía Vega', email: 'sofia.vega@example.com', phone: '+51 999 000 111' },
    ]);
  }
}
